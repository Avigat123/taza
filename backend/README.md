# Taza — Backend API

> **Predict freshness. Prevent waste. Save value.**

Taza is an AI-powered fresh-produce intelligence platform for India's supply chain. This is the **Node.js / Express / MongoDB backend** that powers:

- Batch & quality inspection management  
- Freshness / shelf-life / spoilage prediction  
- Market price intelligence & opportunity comparison  
- Profit / loss calculation per destination  
- Decision & recommendation engine  
- Waste-reduction dashboard metrics  
- Digital batch traceability passport  

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Environment Variables](#2-environment-variables)
3. [Project Structure](#3-project-structure)
4. [Architecture Overview](#4-architecture-overview)
5. [Data Models](#5-data-models)
6. [API Reference](#6-api-reference)
7. [Business Logic — How the Engines Work](#7-business-logic--how-the-engines-work)
8. [Demo / Seed Data](#8-demo--seed-data)
9. [Adding New Features](#9-adding-new-features)
10. [Connecting the Python ML Service](#10-connecting-the-python-ml-service)
11. [Docker](#11-docker)
12. [Known Limitations](#12-known-limitations)

---

## 1. Quick Start

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env   # then fill in MONGODB_URI

# Start dev server (hot-reload via nodemon)
npm run dev

# Start production server
npm start
```

The server starts on **port 5000** by default.  
Verify: `GET http://localhost:5000/api/health`

---

## 2. Environment Variables

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<dbname>?appName=<app>
NODE_ENV=development
```

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (default 5000) | HTTP port the server listens on |
| `MONGODB_URI` | **Yes** | MongoDB Atlas (or local) connection string |
| `NODE_ENV` | No (default `development`) | Suppresses debug logs in production |

---

## 3. Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection + demo seed trigger
│   │   ├── env.js                   # Centralised environment variable reader
│   │   └── redis.js                 # Redis config stub (Phase 11 — not yet active)
│   │
│   ├── models/                      # Mongoose schemas (one per collection)
│   │   ├── Batch.js                 # Core produce batch
│   │   ├── QualityInspection.js     # Quality signals for a batch
│   │   ├── Prediction.js            # Freshness/shelf-life/spoilage result
│   │   ├── MarketPrice.js           # Market price observation
│   │   ├── ProfitAnalysis.js        # Per-destination P&L calculation
│   │   ├── Recommendation.js        # Decision engine output
│   │   ├── SensorReading.js         # IoT sensor data stub (Phase 11)
│   │   └── User.js                  # User/auth stub (Phase 10+)
│   │
│   ├── services/                    # Business logic — no HTTP knowledge here
│   │   ├── batch.service.js         # Batch CRUD, filtering, pagination
│   │   ├── qualityInspection.service.js
│   │   ├── freshness.service.js     # Assembles signals → calls calculations
│   │   ├── shelfLife.service.js     # Remaining shelf-life estimate
│   │   ├── spoilage.service.js      # Spoilage probability estimate
│   │   ├── prediction.service.js    # Orchestrates all three + persists result
│   │   ├── market.service.js        # Price queries + opportunity calculation
│   │   ├── profit.service.js        # Full P&L across all markets
│   │   ├── recommendation.service.js# Decision engine (rule-based)
│   │   ├── waste.service.js         # Aggregated waste/inventory metrics
│   │   └── traceability.service.js  # Batch passport + timeline
│   │
│   ├── controllers/                 # HTTP layer — parse req, call service, send res
│   │   ├── batch.controller.js
│   │   ├── qualityInspection.controller.js
│   │   ├── prediction.controller.js
│   │   ├── market.controller.js
│   │   ├── profit.controller.js
│   │   ├── recommendation.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── traceability.controller.js
│   │   └── agent.controller.js      # AI agent stub (Phase 10)
│   │
│   ├── routes/                      # Express routers — URL → controller
│   │   ├── batch.routes.js
│   │   ├── qualityInspection.routes.js
│   │   ├── prediction.routes.js
│   │   ├── market.routes.js
│   │   ├── profit.routes.js
│   │   ├── recommendation.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── traceability.routes.js
│   │   └── agent.routes.js          # stub
│   │
│   ├── middleware/
│   │   ├── error.middleware.js      # Centralised error handler (LAST in chain)
│   │   ├── validation.middleware.js # validateBody() / validateQuery() factories
│   │   └── upload.middleware.js     # File-upload stub (for image inspection)
│   │
│   ├── utils/
│   │   ├── calculations.js          # Pure math — freshness, shelf life, P&L
│   │   ├── logger.js                # Structured logger (timestamp + level)
│   │   └── response.js              # sendSuccess() / sendError() helpers
│   │
│   ├── app.js                       # Express app: middleware + routes + 404 + error
│   └── server.js                    # Entry point: connect DB → start listening
│
├── tests/
│   ├── batch.test.js                # stub — ready to fill
│   ├── prediction.test.js           # stub
│   └── recommendation.test.js       # stub
│
├── .env                             # Local secrets — never commit
├── .gitignore
├── Dockerfile
├── package.json                     # type: "module" (ES Modules throughout)
├── README.md                        # ← you are here
├── PRODUCT.md                       # What Taza does and why — business docs
└── PROJECT.md                       # Developer guide — how everything fits together
```

---

## 4. Architecture Overview

```
Frontend (React + Vite)
        │
        ▼
Express Backend (Node.js)
        │
   ┌────┴────────────────────────────────┐
   │                                     │
   ▼                                     ▼
MongoDB Atlas                    Python ML Service
(Batch, Prediction,              (not yet built — adapter
 MarketPrice, etc.)               in prediction.service.js)
```

### Request Flow (typical)

```
HTTP Request
    ↓
Route  (routes/*.routes.js)
    ↓
Validation middleware  (validateBody / validateQuery)
    ↓
Controller  (controllers/*.controller.js)
    ↓
Service  (services/*.service.js)
    ↓
Model / DB  (models/*.js  →  MongoDB)
    ↓
Response  (utils/response.js → sendSuccess / sendError)
    ↓
Error Middleware  (if thrown — middleware/error.middleware.js)
```

---

## 5. Data Models

### `Batch`
The central document. Represents a physical consignment of produce.

| Field | Type | Required | Description |
|---|---|---|---|
| `batchCode` | String | Auto | Human-readable ID, e.g. `MNG-1723...` |
| `produceType` | String | ✅ | Normalised lowercase: `"mango"`, `"tomato"` |
| `productName` | String | ✅ | Display name: `"Alphonso Mango"` |
| `variety` | String | No | `"Alphonso"`, `"Kesar"` |
| `quantity` | Number | ✅ | kg (or specified unit) |
| `unit` | String | ✅ | Default `"kg"` |
| `origin` | String | ✅ | Farm / source location |
| `harvestDate` | Date | ✅ | Used to compute age |
| `arrivalDate` | Date | ✅ | Arrival at current location |
| `currentLocation` | String | ✅ | City / warehouse name |
| `procurementCostPerKg` | Number | No | ₹/kg — needed for P&L |
| `storageCostPerKgPerDay` | Number | No | ₹/kg/day — needed for P&L |
| `storageTemperatureCelsius` | Number | No | Latest known temp |
| `storageHumidityPercent` | Number | No | Latest known humidity |
| `status` | Enum | — | `ACTIVE / SOLD / PARTIALLY_SOLD / SPOILED / REDIRECTED / IN_TRANSIT` |
| `latestFreshnessScore` | Number | — | Cached after prediction run |
| `latestShelfLifeDays` | Number | — | Cached after prediction run |
| `latestSpoilageProbability` | Number | — | Cached after prediction run |
| `latestPredictionAt` | Date | — | When last prediction ran |

---

### `QualityInspection`
Signals collected about a batch (manually, from image, or from sensor).

| Field | Description |
|---|---|
| `batchId` | Reference to Batch |
| `inspectionType` | `MANUAL / IMAGE / SENSOR` |
| `visualQuality.score` | 0–100 visual quality score |
| `visualQuality.color` | Observed colour |
| `visualQuality.visibleDefects` | Array of defect strings |
| `physicalQuality.firmness` | 0–100 |
| `physicalQuality.surfaceCondition` | Text description |
| `environmentalData.temperature` | °C at inspection time |
| `environmentalData.humidity` | % at inspection time |
| `imageUrl` | Optional uploaded image |
| `notes` | Free-text notes |

---

### `Prediction`
One freshness estimate for a batch at a point in time.

| Field | Description |
|---|---|
| `batchId` | Reference to Batch |
| `inspectionId` | Which inspection triggered this (optional) |
| `freshnessScore` | 0–100 |
| `shelfLifeDays` | Estimated commercially useful days remaining |
| `spoilageProbability` | 0–1 |
| `riskLevel` | `LOW / MEDIUM / HIGH / CRITICAL` |
| `confidence` | 0–1 — how many signals were available |
| `source` | `heuristic_mock` or `ml_python_service` |
| `inputSignals` | Snapshot of signals used (audit trail) |
| `riskBreakdown` | Per-factor risk: visual, temperature, age, storage |

---

### `MarketPrice`
One observed or estimated price for a produce type at a location.

| Field | Description |
|---|---|
| `produceType` | Normalised lowercase |
| `market` | Market name (e.g. `"Azadpur"`) |
| `location` | City |
| `pricePerKg` | ₹/kg |
| `priceMin / priceMax` | Range observed |
| `demandLevel` | `LOW / MEDIUM / HIGH / UNKNOWN` |
| `estimatedTransportTimeHours` | From a reference origin |
| `observationDate` | When price was recorded |
| `source` | `"agmarknet" / "manual" / "demo_seed"` |
| `isEstimate` | `true` if estimated, not directly observed |
| `confidenceLevel` | `LOW / MEDIUM / HIGH` |

---

### `ProfitAnalysis`
Full P&L calculation for a batch across all available markets.

| Field | Description |
|---|---|
| `batchId` | Reference to Batch |
| `predictionId` | Which prediction was used |
| `inputSnapshot` | Snapshot of all inputs at calculation time |
| `marketAnalysis[]` | Array — one entry per market (see P&L section) |
| `bestMarket` | Name of highest-profit destination |
| `bestExpectedProfit` | ₹ value |
| `missingCostInputs` | Fields that were unavailable |

---

### `Recommendation`
Decision engine output — what to do with the batch.

| Field | Description |
|---|---|
| `actionType` | `SELL_LOCAL / MOVE_TO_MARKET / DISCOUNT / PROCESS / REDIRECT / HOLD / URGENT_SELL` |
| `targetMarket` | Populated for `MOVE_TO_MARKET` |
| `urgencyLevel` | `LOW / MEDIUM / HIGH / CRITICAL` |
| `reason` | Human-readable explanation |
| `reasonFactors` | Structured version (shelf life, spoilage %, risk) |
| `expectedRevenue / expectedProfit` | ₹ estimates |
| `expectedWastePercent / expectedWasteKg` | Estimated waste |

---

## 6. API Reference

Base URL: `http://localhost:5000/api`

All responses follow the envelope:
```json
{ "success": true, "data": {}, "message": "...", "meta": {} }
{ "success": false, "message": "...", "errors": [] }
```

---

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Server health check |

---

### Batches — `/batches`

| Method | Endpoint | Body / Query | Description |
|---|---|---|---|
| POST | `/batches` | `{ productName, produceType, quantity, origin, harvestDate, arrivalDate, currentLocation, ...optional }` | Create batch |
| GET | `/batches` | `?produceType=mango&status=ACTIVE&currentLocation=Delhi&page=1&limit=20&sortBy=createdAt&sortOrder=desc` | List + filter batches |
| GET | `/batches/:id` | — | Get single batch |
| PUT | `/batches/:id` | Any updatable fields | Update batch |
| DELETE | `/batches/:id` | — | Delete batch |

**Required on POST:** `productName`, `produceType`, `quantity`, `origin`, `harvestDate`, `arrivalDate`, `currentLocation`

---

### Quality Inspections — `/batches/:batchId/inspections`

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/batches/:batchId/inspections` | `{ inspectionType, visualQuality, physicalQuality, environmentalData, notes }` | Add inspection |
| GET | `/batches/:batchId/inspections` | — | All inspections for batch |
| GET | `/batches/:batchId/inspections/:inspectionId` | — | Single inspection |
| DELETE | `/batches/:batchId/inspections/:inspectionId` | — | Delete inspection |

**Required on POST:** `inspectionType` (`MANUAL / IMAGE / SENSOR`)

**Example body:**
```json
{
  "inspectionType": "MANUAL",
  "visualQuality": {
    "score": 82,
    "color": "yellow-green",
    "visibleDefects": ["minor bruising"]
  },
  "physicalQuality": { "firmness": 75 },
  "environmentalData": { "temperature": 10.5, "humidity": 84 },
  "notes": "Batch looks good overall"
}
```

---

### Predictions — `/predictions`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predictions/:batchId/run` | **Run freshness prediction** for batch |
| GET | `/predictions/:batchId` | Latest prediction |
| GET | `/predictions/:batchId/history?limit=10` | Prediction history |

> **Run this before market opportunities or recommendations.**  
> The prediction reads the batch's latest quality inspection automatically.

**Example response:**
```json
{
  "freshnessScore": 78,
  "shelfLifeDays": 2.1,
  "spoilageProbability": 0.31,
  "riskLevel": "MEDIUM",
  "confidence": 0.6,
  "source": "heuristic_mock",
  "riskBreakdown": {
    "visualDefectRisk": 0.08,
    "temperatureStressRisk": null,
    "ageRisk": 0.71,
    "storageRisk": 0.3
  }
}
```

---

### Market Intelligence — `/market`

| Method | Endpoint | Query / Body | Description |
|---|---|---|---|
| GET | `/market/prices` | `?produce=mango&location=delhi` | Get recent market prices |
| GET | `/market/markets` | `?produce=mango` | List distinct markets |
| POST | `/market/prices` | `{ produceType, market, location, pricePerKg, ... }` | Add price record |
| GET | `/market/opportunities/:batchId` | `?transportConfig={}` | **Ranked market comparison** |

**Required on POST:** `produceType`, `market`, `location`, `pricePerKg`

**Market opportunities response:**
```json
{
  "batchId": "...",
  "quantity": 1000,
  "freshnessScore": 78,
  "shelfLifeDays": 2.1,
  "markets": [
    {
      "market": "Azadpur",
      "location": "Delhi",
      "pricePerKg": 80,
      "transportCostTotal": 4000,
      "expectedSpoilagePercent": 12,
      "expectedRevenue": 70400,
      "netOpportunityValue": 66400,
      "risk": "LOW",
      "isFeasible": true
    }
  ]
}
```

**transportConfig** (optional query param, JSON):
```json
{
  "delhi": { "costPerKg": 4, "timeHours": 1 },
  "jaipur": { "costPerKg": 7, "timeHours": 5 }
}
```

---

### Profit / Loss — `/profit`

| Method | Endpoint | Body | Description |
|---|---|---|---|
| POST | `/profit/:batchId/analyze` | `{ procurementCostPerKg, storageCostPerKgPerDay, transportConfig }` | Run P&L analysis |
| GET | `/profit/:batchId` | — | Latest analysis |
| GET | `/profit/:batchId/history?limit=5` | — | Analysis history |

Body is optional — costs fall back to batch-stored values if not provided.

**P&L per market includes:**
- `sellableQuantity` / `spoiledQuantity`
- `grossRevenue` / `transportCostTotal`
- `procurementCost` / `storageCost` / `spoilageLoss`
- `expectedProfit` / `profitPerKg` / `wastePercent`
- `isPartialCalculation: true` if any cost was unknown

---

### Recommendations — `/recommendations`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/recommendations/:batchId/generate` | **Run decision engine** |
| GET | `/recommendations/:batchId` | Latest recommendation |
| GET | `/recommendations/:batchId/history?limit=10` | History |

**Action types:**

| Action | When triggered |
|---|---|
| `URGENT_SELL` | Shelf life ≤ 0.5 days |
| `DISCOUNT` | Spoilage ≥ 70% AND shelf life ≤ 1.5 days |
| `MOVE_TO_MARKET` | Better market offers ≥ 10% more profit AND shelf life allows travel |
| `SELL_LOCAL` | Shelf life ≤ 1.5 days (but not URGENT / DISCOUNT) |
| `HOLD` | Shelf life > 4 days AND spoilage < 20% |
| `SELL_LOCAL` (default) | Everything else |

**Example response:**
```json
{
  "actionType": "MOVE_TO_MARKET",
  "targetMarket": "Chandigarh Grain Market",
  "targetLocation": "Chandigarh",
  "urgencyLevel": "MEDIUM",
  "reason": "Moving to Chandigarh Grain Market offers an estimated ₹71,500 profit — significantly better than Delhi (₹62,000). Transport time is within estimated shelf life.",
  "expectedProfit": 71500,
  "expectedWastePercent": 15
}
```

---

### Dashboard — `/dashboard`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/dashboard/overview` | Aggregated inventory + waste metrics |
| GET | `/dashboard/urgent` | Active batches sorted by shelf-life urgency |

**Overview response includes:**
- `totalBatches`, `totalInventoryKg`
- `atRiskBatchCount`, `atRiskInventoryKg`
- `criticalBatchCount`
- `estimatedSpoilageKg`, `estimatedSpoilagePercent`
- `estimatedValueAtRisk` (₹, if procurement costs are available)
- `batchesRequiringImmediateAction[]` — top 10 most urgent
- `inventoryByStatus` — count + kg per status
- `recentRecommendations` — action type counts for last 7 days

---

### Traceability — `/traceability`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/traceability/:batchId` | Full digital batch passport |
| GET | `/traceability/supply-chain/summary` | Inventory by status across supply chain |

**Batch passport includes:**
- Batch metadata snapshot
- `supplyChainStages[]` — FARM → HARVEST → TRANSPORT → WAREHOUSE → SOLD
- `timeline[]` — chronological events: creation, inspections, predictions, recommendations
- `currentFreshness` — latest prediction snapshot

---

## 7. Business Logic — How the Engines Work

### Freshness Score (`utils/calculations.js → computeFreshnessScore`)

Weighted combination of available signals:

| Signal | Weight | Notes |
|---|---|---|
| Visual quality score | 35% | From image inspection |
| Firmness | 20% | Physical measurement |
| Age (days since harvest) | 25% | Compared to produce-specific reference shelf life |
| Temperature | 12% | Penalty for deviation from ideal storage range |
| Humidity | 8% | Penalty for deviation from ideal range |

Missing signals are excluded — the score is still computed from available data. Confidence reflects how many signals were present.

---

### Shelf Life (`computeShelfLifeDays`)

```
remainingLife = referenceShelfLife × (freshnessScore / 100)
```

Then capped by `referenceLife − daysSinceHarvest` (whichever is lower).

Temperature acceleration (Q10 model): every 10°C above ideal mid doubles the degradation rate.

---

### Spoilage Probability (`computeSpoilageProbability`)

Individual risk factors are combined using the **probability-of-union formula** (not simple addition, so total never exceeds 1):

```
P(A∪B) = P(A) + P(B) − P(A)×P(B)
```

Factors considered: age risk, freshness risk, visual defect risk, temperature stress risk, shelf-life urgency risk.

---

### Transport Spoilage (`computeTransportSpoilage`)

```
ratio = transportTimeDays / shelfLifeDays

if ratio >= 1 → high spoilage penalty
else → additional spoilage = ratio × 1.2 (handling stress) × 0.3
```

This penalises distant markets when shelf life is short.

---

### Profit / Loss (`computeExpectedProfitLoss`)

```
sellableQty     = quantity × (1 − spoilageFraction)
grossRevenue    = sellableQty × pricePerKg
procurementCost = quantity × procurementCostPerKg    [if known]
storageCost     = quantity × storageCostPerKgPerDay × storageDays  [if known]
spoilageLoss    = spoiledQty × procurementCostPerKg  [if known]
expectedProfit  = grossRevenue − transportCost − procurementCost − storageCost − spoilageLoss
```

If any cost is unknown, `isPartialCalculation: true` and `missingInputs[]` lists which fields are needed.

---

### Decision Engine Priority (`recommendation.service.js`)

Rules evaluated in order — first match wins:

1. **URGENT_SELL** — shelf life ≤ 0.5 days
2. **DISCOUNT** — spoilage ≥ 70% AND shelf life ≤ 1.5 days
3. **MOVE_TO_MARKET** — best feasible market offers ≥ 10% more profit than second-best AND shelf life allows travel
4. **SELL_LOCAL** — shelf life ≤ 1.5 days
5. **HOLD** — shelf life > 4 days AND spoilage < 20%
6. **SELL_LOCAL** (default fallback)

---

## 8. Demo / Seed Data

On first startup, the DB connection seeds **demo market prices** for:

- Mango: Azadpur (Delhi), Jaipur APMC, Chandigarh, Agra, Lucknow
- Tomato: Azadpur, Jaipur, Chandigarh
- Banana, Potato, Onion: selected markets

All demo records have:
```json
{
  "source": "demo_seed",
  "isEstimate": true,
  "confidenceLevel": "LOW",
  "notes": "DEMO DATA — for hackathon demonstration only. Not actual market prices."
}
```

Seeding is idempotent — if demo records already exist, it skips.

To add real market data: `POST /api/market/prices` with `source: "manual"` and `isEstimate: false`.

---

## 9. Adding New Features

### Adding a new route family

1. Create `src/models/NewThing.js`
2. Create `src/services/newThing.service.js`
3. Create `src/controllers/newThing.controller.js`
4. Create `src/routes/newThing.routes.js`
5. Register in `src/app.js`: `app.use('/api/newthings', newThingRoutes)`

### Adding a new produce type to reference data

Edit `src/utils/calculations.js`:
- Add to `REFERENCE_SHELF_LIFE_DAYS` object
- Add to `IDEAL_STORAGE_TEMP` object

### Adding a new decision rule

Edit `src/services/recommendation.service.js`:
- Write a new `ruleXxx(prediction, profitAnalysis)` function
- Insert it into the priority chain in `generateRecommendation()`

---

## 10. Connecting the Python ML Service

The prediction pipeline is designed to be swappable. Currently it uses heuristic calculations (`source: "heuristic_mock"`).

**To plug in the Python ML service:**

In `src/services/prediction.service.js`, find:
```js
// Replace the computeXxx() calls with a call to mlProxyService.predict()
// Change source to "ml_python_service"
```

Replace the three `computeXxx()` calls with an HTTP call to your Python service:
```js
import axios from 'axios';

const mlResult = await axios.post('http://localhost:8000/predict', {
  produceType: batch.produceType,
  daysSinceHarvest: signals.daysSinceHarvest,
  temperature: signals.temperature,
  // ... other signals
});

const { freshnessScore, shelfLifeDays, spoilageProbability } = mlResult.data;
```

Then update `source: "ml_python_service"` and `confidence` from the ML response.

Everything downstream (market analysis, P&L, recommendation) will automatically use the ML outputs — no other changes needed.

---

## 11. Docker

```dockerfile
# Build
docker build -t taza-backend .

# Run
docker run -p 5000:5000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e NODE_ENV=production \
  taza-backend
```

The Dockerfile uses `node:20-alpine` for a minimal image (~150 MB).

---

## 12. Known Limitations

| Limitation | Notes |
|---|---|
| Predictions are heuristic | `source: "heuristic_mock"` — replace with Python ML service (see section 10) |
| Market prices are demo data | All prices have `isEstimate: true`. Add real data via `POST /api/market/prices` |
| No authentication | User model is stubbed. Add JWT middleware when needed |
| No file upload | `upload.middleware.js` is stubbed. Integrate multer + cloud storage for image inspection |
| No Redis | `redis.js` is stubbed. Add caching for market prices and dashboard metrics in Phase 11 |
| No IoT | `SensorReading.js` is stubbed. Add MQTT listener in Phase 11 |
| Transport config is optional | If not provided, transport costs in market opportunities will be `null` and ranked by revenue only |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 5 |
| Database | MongoDB (Mongoose 9) |
| Module system | ES Modules (`"type": "module"`) |
| Dev server | nodemon |
| Container | Docker (node:20-alpine) |
