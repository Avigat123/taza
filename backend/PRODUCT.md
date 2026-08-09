# Taza — Product Documentation

> **Predict freshness. Prevent waste. Save value.**

---

## What Is Taza?

Taza is an AI-powered fresh-produce intelligence platform built for India's fruit and vegetable supply chain.

India loses an estimated **15–30% of all fruits and vegetables** before they reach consumers — not because the supply chain lacks effort, but because it lacks **information at the right time**.

Taza creates a digital intelligence layer over the supply chain. It combines produce inspection data, quality measurements, storage conditions, and supply-chain information to answer the questions that operators actually need answered before making decisions.

---

## The Problem Taza Solves

Fresh produce moves through multiple stages:

```
Farm → Aggregator → Pack House → Transport → Warehouse → Mandi → Retailer → Consumer
```

At every stage, operators face the same set of hard questions:

- How fresh is this batch, really?
- How long will it last?
- How much of it will spoil?
- Should I sell it here or move it to a better market?
- If I move it, will it survive the journey?
- How much money will I make or lose depending on what I do?
- What should I actually do — right now?

Traditional quality inspection is **manual, periodic, subjective, and impossible to scale**. A worker inspecting a 1,000 kg mango batch gives a subjective opinion ("looks good") with no estimate of remaining shelf life and no comparison of what the batch would fetch in different markets.

---

## What Taza Does Differently

Taza doesn't just answer "Is this fresh?"

It answers:

> **"How fresh is this produce, how long will it remain usable, what is its deterioration risk, and what should we do with it — right now — to maximise value and minimise waste?"**

It does this by combining multiple signals:

| Signal Type | Examples |
|---|---|
| **Visual** | Ripeness, colour, bruising, visible mold, defects |
| **Physical** | Firmness, Brix, surface condition |
| **Environmental** | Temperature, humidity, storage duration |
| **Supply-chain** | Harvest date, transit time, batch age, current location |
| **Market** | Prices at nearby and distant markets, demand levels |
| **Economics** | Procurement cost, transport cost, storage cost, spoilage loss |

These are combined into a structured decision:

```
OBSERVE → PREDICT → COMPARE MARKETS → CALCULATE P&L → RECOMMEND ACTION → REDUCE WASTE
```

---

## Core Features

### Feature 1 — Batch Management

Every physical consignment of produce is tracked as a **Batch**.

A batch record contains:
- What the produce is (type, variety, name)
- How much (quantity, unit)
- Where it came from (origin, harvest date)
- Where it is now (current location, arrival date)
- What it cost (procurement cost per kg — optional)
- Its current status (ACTIVE, SOLD, SPOILED, etc.)

Batches are the central unit of the entire system. Every other feature operates on a batch.

---

### Feature 2 — Quality Inspection

An operator records quality signals for a batch:

- Visual score (0–100)
- Observed colour
- Visible defects (bruising, mold, cracks, spots, etc.)
- Firmness
- Storage temperature and humidity
- Inspector notes

Inspection type can be:
- **MANUAL** — human inspection
- **IMAGE** — from a computer vision model (Python ML service)
- **SENSOR** — from an IoT temperature/humidity device

A batch can have multiple inspections over time. The most recent inspection is always used for prediction.

---

### Feature 3 — Freshness Prediction

The system combines all available signals into three key estimates:

**Freshness Score (0–100)**
An overall indicator of current quality state. Higher = fresher.

**Estimated Remaining Shelf Life (days)**
How many more commercially useful days remain. Not a guarantee — an estimate.

**Spoilage Probability (0–1)**
The estimated probability that a meaningful portion of the batch has already spoiled or will spoil soon.

**Risk Level**
- 🟢 LOW (< 20% spoilage probability)
- 🟡 MEDIUM (20–45%)
- 🟠 HIGH (45–70%)
- 🔴 CRITICAL (≥ 70%)

**Honest uncertainty:** Every prediction includes a `confidence` score (0–1) reflecting how many signals were available. If only the harvest date is known and no inspection has been done, confidence will be low (0.2) and the estimate will be clearly marked.

The `source` field distinguishes:
- `heuristic_mock` — mathematical estimates from supply-chain data (current state)
- `ml_python_service` — results from the trained Python ML model (when integrated)

---

### Feature 4 — Market Price Intelligence

For each produce type, the system maintains a database of price observations at different markets.

Each price record includes:
- Market name and city
- Price per kg (₹)
- Demand level
- Whether the price is observed or estimated
- Source of the data
- Date of observation

The system will **never invent prices**. If a price is unavailable for a market, it says so.

---

### Feature 5 — Market Opportunity Comparison

Given a batch with a freshness prediction, the system compares selling opportunities across all markets that have price data for that produce type.

For each market, it calculates:
- Expected spoilage during transport (higher for farther markets when shelf life is short)
- Expected sellable quantity after transit spoilage
- Expected gross revenue
- Transport cost (if transport data is available)
- Net opportunity value (revenue minus transport cost)
- Feasibility (will the produce survive the journey?)
- Risk level

Markets are ranked by net opportunity value. The ranking automatically penalises distant markets when shelf life is critically short.

**Example:** A mango batch with 1.8 days of shelf life and a potential market 7 hours away will get a very high spoilage penalty for that distant market — even if its price per kg is higher.

---

### Feature 6 — Profit / Loss Engine

A full economic calculation per destination, combining:

| Input | Source |
|---|---|
| Quantity | Batch |
| Price per kg | Market price database |
| Transport cost | Transport config or market data |
| Expected spoilage fraction | Market opportunity calculation |
| Procurement cost | Batch (or provided at query time) |
| Storage cost | Batch (or provided at query time) |

Output per market:
- Gross revenue
- Transport cost
- Procurement cost (or flagged as missing)
- Storage cost (or flagged as missing)
- Spoilage loss
- Expected net profit
- Profit per kg
- Waste percentage

**Honest partial calculations:** If procurement cost is not stored in the batch, the P&L engine does not invent it. It returns a partial calculation, clearly marks `isPartialCalculation: true`, and lists the missing inputs so the operator can provide them.

---

### Feature 7 — Decision / Recommendation Engine

The decision engine synthesises all available information — freshness, shelf life, spoilage risk, market comparison, and P&L — into a single actionable recommendation.

Possible actions:

| Action | Meaning |
|---|---|
| `URGENT_SELL` | Sell immediately at any price. Shelf life critically short. |
| `DISCOUNT` | High spoilage risk. Reduce price to move inventory fast. |
| `MOVE_TO_MARKET` | A specific distant market offers significantly better economics and the produce can survive the journey. |
| `SELL_LOCAL` | Sell in the current location. Best option given shelf life and market comparison. |
| `HOLD` | No action needed. Freshness is good, shelf life is comfortable. |
| `PROCESS` | Convert to processed/value-added form. |
| `REDIRECT` | Alternative buyer, donation, or recovery channel. |

Every recommendation includes:
- A human-readable **reason** explaining why
- The specific **target market** (for MOVE_TO_MARKET)
- **Urgency level** for the dashboard display
- **Expected profit** and **expected waste %**

---

### Feature 8 — Waste Reduction Dashboard

The dashboard aggregates metrics across all active batches:

- Total inventory (kg)
- At-risk inventory (batches with ≥ 20% spoilage probability)
- Critical inventory (batches with ≥ 50% spoilage or < 1 day shelf life)
- Estimated total spoilage (kg and %)
- Estimated value at risk (₹, if procurement costs are available)
- Batches requiring immediate action (sorted by urgency)
- Recent recommendation counts by action type (last 7 days)

These metrics are **estimates**, clearly flagged as such in every response.

---

### Feature 9 — Digital Batch Passport (Traceability)

Every batch can be viewed as a complete digital record:

**Supply-chain stages:**
FARM → HARVEST → TRANSPORT → WAREHOUSE → SOLD

**Chronological event timeline:**
- When the batch was created
- When each quality inspection was performed (with what results)
- When each freshness prediction ran (with what scores)
- What action was recommended at each decision point

This gives a full audit trail of what happened to a batch and why decisions were made.

---

## What Taza Does NOT Claim

**Taza does not claim that a camera can see inside produce.**

A normal RGB camera can observe external characteristics: colour, surface defects, bruising, mold on the surface. It cannot reliably detect internal spoilage, Brix content, or fermentation state.

Therefore:
- Every prediction is labelled as an **estimate**
- The `confidence` field reflects the quality of available data
- Predictions are not food-safety certifications
- The system says "estimated spoilage probability" — not "this batch is safe to eat"

Future versions can integrate NIR spectroscopy, hyperspectral imaging, or gas sensing to improve internal quality detection. The current architecture is designed to accept these as additional input signals without changing the downstream decision pipeline.

---

## Who Uses Taza?

| User | How they use it |
|---|---|
| **Warehouse manager** | Dashboard — which batches need action today? |
| **Procurement team** | P&L analysis — where should this batch go? |
| **Transport coordinator** | Market opportunities — which market justifies the transport cost? |
| **Retailer** | Traceability — scan QR to see batch history |
| **Cold-chain operator** | Sensor integration — temperature excursions affect shelf life in real time |

---

## The Core Loop

```
SEE (Inspect)
    ↓
PREDICT (Freshness, Shelf Life, Spoilage Risk)
    ↓
COMPARE (Market prices, transport costs, expected spoilage during transit)
    ↓
CALCULATE (Expected profit/loss per destination)
    ↓
DECIDE (What action maximises value and minimises waste?)
    ↓
ACT (Sell, Move, Discount, Process, or Hold)
    ↓
MEASURE (Dashboard: how much waste was prevented?)
```

---

## Taza's Honest Value Proposition

Taza is not a magic system that eliminates all food waste.

It is a **decision-support system** that gives operators the information they need to make better decisions faster — before produce becomes waste instead of after.

Every percentage point improvement in decision quality across thousands of batches compounds into significant waste reduction and value preservation.

> **Taza — Predict freshness. Prevent waste. Save value.**
