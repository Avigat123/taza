# Taza — Developer / Project Guide

This document explains the **technical architecture** of the Taza backend — how every file fits together, what every design decision means, and what to do when you need to extend or change things.

Read this before touching any code.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Module System](#2-module-system)
3. [Startup Sequence](#3-startup-sequence)
4. [The Four Layers](#4-the-four-layers)
5. [File-by-File Reference](#5-file-by-file-reference)
6. [Utils — The Calculation Engine](#6-utils--the-calculation-engine)
7. [The Prediction Pipeline](#7-the-prediction-pipeline)
8. [The Market Opportunity Pipeline](#8-the-market-opportunity-pipeline)
9. [The Decision Engine](#9-the-decision-engine)
10. [Error Handling](#10-error-handling)
11. [Response Shape](#11-response-shape)
12. [Database Conventions](#12-database-conventions)
13. [Extending the System](#13-extending-the-system)
14. [What Is Stubbed / Not Yet Built](#14-what-is-stubbed--not-yet-built)
15. [Implementation Phase Log](#15-implementation-phase-log)

---

## 1. Design Principles

These principles drove every decision in this codebase. If you're making a change, ask whether it respects them.

### Separation of Concerns — Strictly Enforced

There are four distinct responsibilities that must never bleed into each other:

| Layer | Responsibility | Files |
|---|---|---|
| **ML / Prediction** | "What is likely to happen?" | `prediction.service.js`, `freshness.service.js`, `shelfLife.service.js`, `spoilage.service.js` |
| **Market Intelligence** | "What is the current economic opportunity?" | `market.service.js`, `MarketPrice.js` |
| **Profit/Loss Engine** | "How much will we gain or lose?" | `profit.service.js`, `ProfitAnalysis.js`, `calculations.js` |
| **Decision Engine** | "What should we do?" | `recommendation.service.js`, `Recommendation.js` |

A controller should never do market calculations. A service should never format HTTP responses. The calculations utility should never touch the database.

---

### Honest Data

- Never invent market prices. If no price exists for a market, say so.
- Never claim ML accuracy that hasn't been measured. All heuristic predictions are labelled `source: "heuristic_mock"`.
- If a cost input (procurement cost, storage cost) is unknown, flag it with `isPartialCalculation: true` — do not invent a value.
- Every prediction has a `confidence` score reflecting how much signal data was available.

---

### Modular + Replaceable

The key bottleneck today is the ML inference. The heuristic calculations in `utils/calculations.js` are designed to be **replaced** by the Python ML service call without changing anything else in the stack.

Similarly, market prices are loaded from a database — so switching from demo seed data to a real market API feed (Agmarknet, etc.) only requires changing `market.service.js`.

---

### Clean Math

All business-logic calculations live in `src/utils/calculations.js` as **pure functions** — they take inputs and return outputs with no side effects, no database calls, and no Express awareness. This makes them testable in isolation.

---

## 2. Module System

The entire backend uses **ES Modules** (`"type": "module"` in `package.json`).

This means:
- Use `import` / `export`, never `require` / `module.exports`
- File extensions must always be explicit: `import X from './foo.js'` not `'./foo'`
- Dynamic imports are used in `db.js` to avoid circular dependency during startup

---

## 3. Startup Sequence

```
node src/server.js
    │
    ├── import app from './app.js'          ← Express app configured
    ├── import env from './config/env.js'   ← .env loaded
    ├── import connectDB from './config/db.js'
    │
    └── startServer()
            │
            ├── await connectDB()
            │       ├── mongoose.connect(env.mongoUri)
            │       └── seedDemoMarketPrices()   ← no-op if already seeded
            │
            └── app.listen(env.port)
                    └── logger.info('Taza backend running...')
```

The error middleware is registered **at the bottom of `app.js`** — this is intentional. Express requires the error handler to be the last middleware registered. It was moved out of `server.js` specifically to guarantee this ordering as more routes are added.

---

## 4. The Four Layers

Every API feature follows the same four-layer pattern:

### Layer 1 — Route (`routes/*.routes.js`)

- Maps HTTP methods + URL patterns to controller functions
- Applies validation middleware (`validateBody`, `validateQuery`) before the controller
- No business logic here — only routing and validation

```js
router.post('/', validateBody(['productName', 'quantity']), createBatchController);
```

---

### Layer 2 — Controller (`controllers/*.controller.js`)

- Reads `req.params`, `req.body`, `req.query`
- Calls one or more service functions
- Returns responses using `sendSuccess()` or `sendError()`
- Wraps everything in `try/catch` and passes errors to `next(error)` for the error middleware
- No database calls, no business logic calculations

```js
export const createBatchController = async (req, res, next) => {
    try {
        const batch = await createBatch(req.body);
        return sendSuccess(res, 201, batch, 'Batch created successfully');
    } catch (error) {
        next(error);
    }
};
```

---

### Layer 3 — Service (`services/*.service.js`)

- Contains all business logic
- Calls Mongoose models for database operations
- Calls utility functions for calculations
- Calls other services (e.g., prediction service calls freshness + shelfLife + spoilage services)
- Returns plain JS objects — no HTTP knowledge

---

### Layer 4 — Model (`models/*.js`)

- Mongoose schemas only
- Field definitions, types, validation constraints, indexes
- No methods (kept simple intentionally)

---

## 5. File-by-File Reference

### `src/config/env.js`
Reads `.env` via dotenv and exports a typed object. Always import environment variables from here — never access `process.env` directly in other files.

```js
import env from '../config/env.js';
env.port      // PORT
env.mongoUri  // MONGODB_URI
env.nodeEnv   // NODE_ENV
```

---

### `src/config/db.js`
MongoDB connection using `mongoose.connect`. On successful connection, triggers demo market data seed via dynamic import (avoids circular dependency: `db.js` → `market.service.js` → `MarketPrice.js`).

---

### `src/config/redis.js`
**STUB** — not implemented. Placeholder for Phase 11 Redis caching of market prices and dashboard metrics.

---

### `src/utils/logger.js`
Structured logger using native `console`. Format: `[2026-08-09T09:29:00Z] [INFO] message {meta}`.

Four levels: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`.

`debug()` is silenced in production (`NODE_ENV=production`).

Replace with `winston` or `pino` by keeping the same interface — no other files need to change.

---

### `src/utils/response.js`
Two named exports used by every controller:

```js
sendSuccess(res, 200, data, message, meta)
sendError(res, 400, message, errors)
```

All API responses are guaranteed to have the shape `{ success: bool, data?, message?, meta?, errors? }`.

---

### `src/utils/calculations.js`

The heart of the business logic. All pure functions — no side effects, no DB, no Express.

| Function | Purpose |
|---|---|
| `computeFreshnessScore(signals)` | Weighted multi-signal freshness score (0–100) |
| `computeShelfLifeDays(inputs)` | Heuristic remaining shelf life with Q10 temperature model |
| `computeSpoilageProbability(inputs)` | Probability-of-union spoilage estimate |
| `probabilityToRiskLevel(prob)` | 0–1 → `LOW/MEDIUM/HIGH/CRITICAL` |
| `computeTransportSpoilage(inputs)` | Additional spoilage during transit |
| `computeExpectedProfitLoss(inputs)` | Full per-destination P&L calculation |
| `REFERENCE_SHELF_LIFE_DAYS` | Lookup table: produce type → reference shelf life |
| `IDEAL_STORAGE_TEMP` | Lookup table: produce type → ideal temperature range |

**When to change this file:** when improving the freshness model, adding a new produce type to the reference data, or adjusting the P&L formula.

**When NOT to change this file:** for anything involving HTTP, database, or external services.

---

### `src/middleware/error.middleware.js`

Registered last in `app.js`. Handles:

| Error type | HTTP Status | Trigger |
|---|---|---|
| `CastError` (Mongoose) | 400 | Invalid ObjectId in URL param |
| `ValidationError` (Mongoose) | 422 | Schema validation failed |
| MongoDB duplicate key (code 11000) | 409 | Unique index violated |
| Any other error | 500 (or `err.statusCode`) | Generic |

To throw a custom HTTP error from a service:
```js
throw Object.assign(new Error('Batch not found'), { statusCode: 404 });
```

---

### `src/middleware/validation.middleware.js`

Factory functions for route-level validation:

```js
validateBody(['field1', 'field2'])   // returns middleware that checks req.body
validateQuery(['param1'])            // returns middleware that checks req.query
```

Only checks presence — not format or type. For deeper validation, replace with `zod` or `joi` — the route files don't need to change.

---

### `src/models/Batch.js`

Central document. Extended from the original to add:
- `batchCode` — auto-generated, unique, human-readable
- `produceType` — normalised lowercase (for market price lookups)
- `variety` — optional produce sub-type
- `procurementCostPerKg`, `storageCostPerKgPerDay` — for P&L (optional, null if unknown)
- `storageTemperatureCelsius`, `storageHumidityPercent` — latest env reading
- `latestFreshnessScore`, `latestShelfLifeDays`, `latestSpoilageProbability`, `latestPredictionAt` — prediction cache (updated after each prediction run; used by dashboard without re-running inference)
- Extended `status` enum: `ACTIVE / SOLD / PARTIALLY_SOLD / SPOILED / REDIRECTED / IN_TRANSIT`

---

### `src/services/batch.service.js`

Core functions:

| Function | Notes |
|---|---|
| `createBatch(data)` | Auto-generates `batchCode` if not provided |
| `getAllBatches(filters, options)` | Filtering by `produceType`, `status`, `currentLocation`; pagination |
| `getBatchById(id)` | Returns null if not found (controller handles 404) |
| `updateBatch(id, data)` | Prevents overwriting `batchCode` |
| `deleteBatch(id)` | Hard delete |
| `updateBatchPredictionCache(id, data)` | Called by prediction service after inference |
| `getActiveBatchesByUrgency()` | Sorted by `latestShelfLifeDays ASC, latestSpoilageProbability DESC` — used by dashboard |

---

### `src/services/freshness.service.js`

Assembles freshness input signals from a Batch document + its latest QualityInspection, then calls `computeFreshnessScore()` from `calculations.js`.

`buildFreshnessSignals(batch, inspection)` returns the input object — exposed so `prediction.service.js` can store the signals for auditability.

---

### `src/services/shelfLife.service.js`

`getDaysSinceDate(date)` — exported because it's also used by `freshness.service.js` and `spoilage.service.js`.

`computeBatchShelfLife(batch, freshnessScore, inspection)` — resolves temperature from inspection → batch → null (in priority order), then calls `computeShelfLifeDays()`.

---

### `src/services/spoilage.service.js`

`computeBatchSpoilage(batch, freshnessScore, shelfLifeDays, inspection)` — resolves visible defects and temperature, calls `computeSpoilageProbability()`, and adds `riskLevel` via `probabilityToRiskLevel()`.

---

### `src/services/prediction.service.js`

**The orchestrator.** Runs the full prediction pipeline:

1. Load batch
2. Load latest inspection
3. Build signals (`freshness.service.js`)
4. Compute freshness score
5. Compute shelf life
6. Compute spoilage probability + risk
7. Compute confidence (based on signal count)
8. Persist as `Prediction` document
9. Update batch prediction cache

The `source` field is currently `"heuristic_mock"`.

**To connect the Python ML service:** Replace steps 4–6 with an HTTP call to the Python service. Keep steps 1–3 (signal collection) and steps 7–9 (persistence). See `README.md` section 10 for the exact change.

---

### `src/services/market.service.js`

`getMarketPrices(produceType, location)` — queries last 7 days of prices for a produce type. If `location` is provided, filters by regex.

`computeMarketOpportunities(batch, predictionData, marketPrices, transportConfig)` — the key calculation function. For each market:
1. Gets latest price per location
2. Calculates transport spoilage using `computeTransportSpoilage()`
3. Calculates expected revenue and net opportunity
4. Computes shelf-life margin and risk level
5. Returns sorted array (highest net opportunity first)

`seedDemoMarketPrices()` — idempotent seeder. Skips if `source: "demo_seed"` records already exist.

---

### `src/services/profit.service.js`

`runProfitAnalysis(batchId, overrides, transportConfig)`:
1. Loads batch, prediction, and market prices
2. Resolves cost inputs (overrides > batch stored values > null)
3. Calls `computeMarketOpportunities()` for transport spoilage
4. Calls `computeExpectedProfitLoss()` per market
5. Identifies best market (highest profit, fallback to highest revenue)
6. Persists as `ProfitAnalysis` document

Cost override flow: The POST body can include `procurementCostPerKg` and `storageCostPerKgPerDay` to avoid needing to update the batch first. This allows the frontend to let operators plug in costs at analysis time.

---

### `src/services/recommendation.service.js`

**The decision engine.** Rules evaluated in priority order:

```
ruleUrgentSell()     → shelf life ≤ 0.5 days
    ↓ (if null)
ruleDiscount()       → spoilage ≥ 70% AND shelf life ≤ 1.5 days
    ↓ (if null)
ruleMoveToMarket()   → best market ≥ 10% better profit AND shelf life allows travel
    ↓ (if null)
ruleSellLocal()      → shelf life ≤ 1.5 days
    ↓ (if null)
ruleHold()           → shelf life > 4 days AND spoilage < 20%
    ↓ (if null)
ruleDefaultSellLocal() → always fires as fallback
```

Each rule is a separate named function. To add a new rule: write the function, insert it into the chain. To change thresholds: edit the `THRESHOLDS` constant object at the top of the file.

The profit analysis is optional — if no profit analysis has been run for the batch, `ruleMoveToMarket` will return null and the engine will continue to the next rule.

---

### `src/services/waste.service.js`

`computeWasteMetrics()` reads all ACTIVE batches. Uses the cached prediction fields (`latestSpoilageProbability`, `latestShelfLifeDays`) from the Batch document — does not re-run predictions. This makes dashboard loading fast regardless of batch count.

If `batchesWithPredictions < totalBatches`, the response includes `isPartial: true` and a note explaining that some batches need predictions run.

---

### `src/services/traceability.service.js`

`getBatchPassport(batchId)` loads the batch + all related QualityInspection, Prediction, and Recommendation documents, merges them into a chronological event timeline, and adds the supply-chain stage progression.

The timeline is sorted by `timestamp` ascending — earliest event first.

---

## 6. Utils — The Calculation Engine

`src/utils/calculations.js` is the most important file to understand when modifying business logic.

### Freshness Score — Weight Rationale

| Signal | Weight | Why |
|---|---|---|
| Visual score | 35% | Most direct observable indicator of quality |
| Firmness | 20% | Key predictor for ripe/overripe state |
| Age (days since harvest) | 25% | Strong predictor across all produce types |
| Temperature | 12% | Storage stress accelerates degradation |
| Humidity | 8% | Secondary environmental factor |

Weights are adjustable. Missing signals are excluded from the weighted average, so a partial score is still valid — it just has lower confidence.

### Temperature Model

Ideal temperature ranges are stored in `IDEAL_STORAGE_TEMP`. For every degree outside the ideal range, score is penalised 8 points (temperature) or 3 points (humidity).

### Q10 Model for Shelf Life

For temperature above the ideal mid-point, shelf life is divided by an acceleration factor:

```
accelerationFactor = 2^(tempExcess / 10)
```

This is a standard food science approximation (Q10 = 2 means degradation doubles every 10°C).

### Probability of Union for Spoilage

Instead of summing risk factors (which can exceed 1), we use the probability of union formula:

```
P(A∪B) = P(A) + P(B) − P(A) × P(B)
```

Applied iteratively across all risk factors. Result is always 0–1.

---

## 7. The Prediction Pipeline

```
POST /api/predictions/:batchId/run
        │
        ▼
prediction.service.js → runBatchPrediction(batchId)
        │
        ├── getBatchById(batchId)
        ├── getLatestInspectionForBatch(batchId)
        │
        ├── freshness.service.js → buildFreshnessSignals(batch, inspection)
        ├── freshness.service.js → computeBatchFreshnessScore(batch, inspection)
        │       └── calculations.js → computeFreshnessScore(signals)
        │
        ├── shelfLife.service.js → computeBatchShelfLife(batch, freshnessScore, inspection)
        │       └── calculations.js → computeShelfLifeDays(inputs)
        │
        ├── spoilage.service.js → computeBatchSpoilage(batch, freshnessScore, shelfLifeDays, inspection)
        │       └── calculations.js → computeSpoilageProbability(inputs)
        │       └── calculations.js → probabilityToRiskLevel(probability)
        │
        ├── Prediction.create(predictionData)        ← persisted to MongoDB
        │
        └── updateBatchPredictionCache(batchId, ...)  ← cached on Batch document
```

**ML Integration point:** Replace `computeBatchFreshnessScore`, `computeBatchShelfLife`, `computeBatchSpoilage` with a single call to the Python ML service. The rest of the pipeline remains unchanged.

---

## 8. The Market Opportunity Pipeline

```
GET /api/market/opportunities/:batchId
        │
        ▼
market.controller.js
        │
        ├── getBatchById(batchId)
        ├── getLatestPrediction(batchId)           ← must exist first
        ├── getMarketPrices(batch.produceType)     ← from MarketPrice collection
        │
        └── computeMarketOpportunities(batch, prediction, prices, transportConfig)
                │
                ├── For each market location:
                │       ├── computeTransportSpoilage(shelfLife, transportTime, baseSpoilage)
                │       ├── sellableQty = quantity × (1 - transitSpoilageFraction)
                │       ├── expectedRevenue = sellableQty × pricePerKg
                │       ├── netOpportunity = revenue - transportCost
                │       └── risk = shelf life margin check
                │
                └── Sort by netOpportunityValue DESC
```

---

## 9. The Decision Engine

```
POST /api/recommendations/:batchId/generate
        │
        ▼
recommendation.service.js → generateRecommendation(batchId)
        │
        ├── getBatchById(batchId)
        ├── getLatestPrediction(batchId)          ← required
        ├── getLatestProfitAnalysis(batchId)      ← optional (may be null)
        │
        ├── ruleUrgentSell(prediction)            ← shelfLife ≤ 0.5 days?
        ├── ruleDiscount(prediction)              ← spoilage ≥ 70% AND shelfLife ≤ 1.5?
        ├── ruleMoveToMarket(prediction, profit)  ← better market + feasible travel?
        ├── ruleSellLocal(prediction, profit)     ← shelfLife ≤ 1.5 days?
        ├── ruleHold(prediction)                  ← shelfLife > 4 AND spoilage < 20%?
        └── ruleDefaultSellLocal(prediction, profit)  ← always fires
                │
                ▼
        Recommendation.create(decision)           ← persisted to MongoDB
```

Decision thresholds are in `THRESHOLDS` constant at the top of `recommendation.service.js`. Change them there — don't hardcode numbers inside rules.

---

## 10. Error Handling

All errors are handled by `src/middleware/error.middleware.js`.

**From controllers:** `try { ... } catch (error) { next(error); }`

**Custom HTTP errors from services:**
```js
throw Object.assign(new Error('Batch not found'), { statusCode: 404 });
```

**Mongoose errors are automatically handled:**
- `CastError` (bad ObjectId) → 400
- `ValidationError` → 422 with field-level errors
- Duplicate key (11000) → 409

**Never return error responses directly from services** — always throw. The controller's `try/catch` propagates to the middleware.

---

## 11. Response Shape

All successful responses:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional human message",
  "meta": { "total": 10, "page": 1 }
}
```

All error responses:
```json
{
  "success": false,
  "message": "What went wrong",
  "errors": [{ "field": "quantity", "message": "Path quantity is required" }]
}
```

Use `sendSuccess(res, statusCode, data, message, meta)` and `sendError(res, statusCode, message, errors)` from `utils/response.js`. Never construct raw objects in controllers.

---

## 12. Database Conventions

- Collection names are pluralised by Mongoose automatically (`Batch` → `batches`)
- All schemas use `{ timestamps: true }` — `createdAt` and `updatedAt` are always present
- Indexes are defined at the bottom of each schema file
- The Batch document carries a **prediction cache** (`latestFreshnessScore`, etc.) for fast dashboard reads — the canonical source of truth for prediction data is always the `Prediction` collection
- `produceType` is always lowercase — enforced by `lowercase: true` in the schema
- Cost fields default to `null` (not 0) so the system can distinguish "zero cost" from "unknown cost"
- References use `mongoose.Schema.Types.ObjectId` with `ref` — always populate explicitly when needed

---

## 13. Extending the System

### Add a new produce type

In `src/utils/calculations.js`:
1. Add to `REFERENCE_SHELF_LIFE_DAYS`: `papaya: 5`
2. Add to `IDEAL_STORAGE_TEMP`: `papaya: { min: 10, max: 14 }`

That's all — the rest of the pipeline uses these tables automatically.

### Add a new market

Via API: `POST /api/market/prices` with real data and `isEstimate: false`.

Or add to the seed in `market.service.js → seedDemoMarketPrices()` (mark as demo).

### Add a new decision rule

In `recommendation.service.js`:
1. Write `const ruleMyNew = (prediction, profitAnalysis) => { ... }` — return a decision object or `null`
2. Insert into the chain in `generateRecommendation()`: `ruleUrgentSell(p) || ... || ruleMyNew(p, prof) || ...`

### Add a new route family

1. `src/models/Thing.js` — Mongoose schema
2. `src/services/thing.service.js` — business logic
3. `src/controllers/thing.controller.js` — HTTP layer
4. `src/routes/thing.routes.js` — router
5. `src/app.js` — `app.use('/api/things', thingRoutes)`

### Add input validation

In the route file:
```js
import { validateBody } from '../middleware/validation.middleware.js';
router.post('/', validateBody(['field1', 'field2']), controller);
```

For deeper validation (types, formats, enums), replace `validateBody` with a `zod`/`joi` schema without touching controllers.

---

## 14. What Is Stubbed / Not Yet Built

These files exist as empty stubs — they are intentional placeholders for future phases.

| File | Phase | What it will do |
|---|---|---|
| `models/User.js` | 10+ | User accounts, roles (farmer, aggregator, warehouse) |
| `models/SensorReading.js` | 11 | IoT temperature/humidity readings per batch |
| `controllers/agent.controller.js` | 10 | AI operations agent (LLM-powered) |
| `routes/agent.routes.js` | 10 | Agent API endpoints |
| `middleware/upload.middleware.js` | 3 | Multer + cloud storage for image upload (quality inspection) |
| `config/redis.js` | 11 | Redis client for market price caching |

Do not delete these stubs — they signal intent and keep the import structure ready.

---

## 15. Implementation Phase Log

| Phase | Status | What was built |
|---|---|---|
| **Phase 0** | ✅ Done | Project inspection and assessment |
| **Phase 1** | ✅ Done | Foundation: logger, response utils, validation middleware, error middleware, server.js cleanup |
| **Phase 2** | ✅ Done | Extended Batch schema; batch service with filtering/pagination/batchCode; QualityInspection service/controller/routes |
| **Phase 3** | ✅ Done | Prediction model; prediction service (heuristic mock adapter); prediction controller/routes |
| **Phase 4** | ✅ Done | `calculations.js` (all pure math); freshness/shelfLife/spoilage services |
| **Phase 5** | ✅ Done | MarketPrice model; market service with opportunity calculation; demo seed; market controller/routes |
| **Phase 6** | ✅ Done | ProfitAnalysis model; profit service; profit controller/routes |
| **Phase 7** | ✅ Done | Recommendation model; decision engine (6 rules); recommendation controller/routes |
| **Phase 8** | ✅ Done | Waste service; dashboard controller/routes |
| **Phase 9** | ✅ Done | Traceability service (batch passport + timeline); traceability controller/routes |
| **Phase 10** | 🔲 Pending | AI operations agent (LLM API required) |
| **Phase 11** | 🔲 Pending | Redis caching, IoT/MQTT sensor integration |

**Python ML Service integration** is designed and ready — see `prediction.service.js` and `README.md` section 10 for the exact change required.
