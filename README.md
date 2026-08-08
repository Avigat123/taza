# taza
# Taza — AI-Powered Fresh Produce Intelligence Platform

## 1. Project Overview

**Taza** is an AI-powered fresh-produce intelligence platform designed to reduce food waste across India's fruit and vegetable supply chain.

Fresh produce passes through multiple stages — **farm, aggregation, transportation, pack houses, warehouses, mandis, retailers, and consumers**. At every stage, produce quality changes due to ripeness, temperature, humidity, handling, storage duration, transportation time, and demand fluctuations.

Taza combines **Computer Vision, Machine Learning, supply-chain data, and intelligent decision-making** to continuously estimate the condition of produce and determine the best action before it becomes waste.

Instead of simply answering:

> **"Is this fruit fresh?"**

Taza answers:

> **"How fresh is it, how long will it remain usable, what is its spoilage risk, and what should we do with it now?"**

---

# 2. Problem Statement

A major challenge in the fresh-produce supply chain is that quality is highly dynamic.

Two batches of the same fruit can have completely different shelf lives depending on:

* Time since harvesting
* Ripeness
* Temperature exposure
* Humidity
* Storage duration
* Transportation conditions
* Physical damage
* Brix/quality measurements
* Demand and destination

Traditional quality inspection is often manual, periodic, and difficult to scale.

A simple image classifier also has an important limitation: **a normal RGB camera can primarily observe external characteristics and cannot reliably determine all internal spoilage.**

Therefore, Taza does not claim to "see inside" every fruit. Instead, it performs **multimodal freshness and deterioration-risk estimation** by combining visible characteristics with measurable quality and supply-chain information.

---

# 3. Proposed Solution

Taza creates a digital intelligence layer over the fresh-produce supply chain.

The system collects information from multiple sources:

### 📷 Computer Vision

Analyzes produce images for:

* Color
* Ripeness
* Bruises
* Spots
* Visible mold
* Cracks
* Surface defects
* Shriveling
* Size and shape

### 🧪 Quality Parameters

Where available, the system can use:

* Brix
* Firmness
* pH/acidity
* Weight loss
* Other quality measurements

### 🌡️ Storage & Environmental Data

The platform can consider:

* Temperature
* Humidity
* Storage duration
* Time since harvest
* Temperature excursions

### 🚚 Supply-Chain Data

The system can use:

* Batch information
* Harvest date
* Transportation duration
* Location
* Storage location
* Inventory quantity
* Demand
* Destination

These inputs are combined by the AI layer to generate a more useful assessment of produce condition.

---

# 4. Core AI Pipeline

```text
Produce Image
      +
Quality Parameters
      +
Storage Conditions
      +
Harvest/Batch Information
      +
Supply-Chain Data
            ↓
      AI Intelligence Layer
            ↓
 ┌──────────┼───────────┐
 ↓          ↓           ↓
Freshness  Shelf-Life  Spoilage
 Score     Prediction   Risk
 └──────────┼───────────┘
            ↓
      Decision Engine
            ↓
 ┌──────────┼──────────────┐
 ↓          ↓              ↓
Sell       Move         Redirect
Now        Batch        Produce
            ↓
       Waste Reduction
```

---

# 5. Main Features

## Feature 1 — AI Produce Inspection

A user can upload or capture an image of a fruit or vegetable.

The computer-vision model identifies:

* Produce type
* Ripeness stage
* Visible defects
* Bruising
* Mold/rot indicators
* Surface quality

Example:

```text
Produce: Mango

Ripeness: 82%
Visible Defects: 2
Surface Quality: Good
Visual Quality Score: 86/100
```

---

# 6. Feature 2 — Multimodal Freshness Score

Instead of relying only on the image, Taza combines multiple signals.

Example:

```text
Image Quality          86
Brix                   14.2°
Temperature             8.4°C
Humidity                82%
Days Since Harvest       5
Storage Stress          Medium
```

The model generates:

```text
Freshness Score:       81/100
Spoilage Risk:         18%
```

The score represents an **estimated quality state**, not a laboratory-certified food-safety result.

---

# 7. Feature 3 — Remaining Shelf-Life Prediction

One of Taza's most important features is predicting the **estimated remaining commercially useful shelf life**.

Instead of:

> "This mango is fresh."

the system provides:

> **Estimated remaining shelf life: 3.2 days**

Example:

```text
Batch: MNG-102

Freshness Score       81/100
Estimated Shelf Life  3.2 days
Spoilage Risk         18%
Confidence             Medium
```

This enables businesses to prioritize inventory before it deteriorates.

---

# 8. Feature 4 — Spoilage Risk Prediction

Taza estimates the probability of deterioration based on multiple factors.

For example:

```text
Visual Defect Risk       10%
Temperature Stress       21%
Age Risk                  9%
Storage Risk              8%

Overall Estimated Risk   18%
```

The system can classify batches as:

🟢 **Low Risk**

🟡 **Medium Risk**

🔴 **High Risk**

This helps warehouse and retail operators identify inventory that requires immediate attention.

---

# 9. Feature 5 — Intelligent Decision Engine

This is what makes Taza more than an ML project.

The AI doesn't stop at predicting quality.

It determines:

> **What should happen to this produce?**

The decision engine considers:

* Remaining shelf life
* Quantity
* Current location
* Nearby demand
* Transportation time
* Destination
* Expected spoilage
* Potential value

### Example

A mango batch has:

```text
Shelf Life: 1.8 days
Quantity: 850 kg
Demand nearby: High
Distance to destination: 40 km
```

Taza recommends:

> **PRIORITIZE LOCAL SALE**

Another batch:

```text
Shelf Life: 6 days
Demand in another city: High
Transport time: 5 hours
```

Taza can recommend:

> **SHIP TO HIGH-DEMAND LOCATION**

A batch with extremely short remaining shelf life could be recommended for:

> **Processing / Alternative Buyer / Donation / Other recovery channel**

The exact destination would depend on the business rules and available partners.

---

# 10. Feature 6 — Waste Reduction Engine

Every recommendation is connected to one objective:

## Reduce avoidable produce waste.

The dashboard can estimate:

```text
Total Inventory       12,450 kg

At-Risk Inventory      1,240 kg

Priority Batches            8

Estimated Waste Avoided      84 kg
```

The platform can compare:

**Expected waste without intervention**

vs.

**Expected waste after AI recommendations**

This creates a measurable impact metric for the hackathon.

---

# 11. Feature 7 — Batch Intelligence

Instead of tracking individual fruits only, Taza can operate at the **batch level**, which is more practical for warehouses and supply-chain operations.

Example:

```text
Batch ID: MNG-102

Produce: Mango
Origin: Farm A
Harvest Date: 04 Aug
Quantity: 850 kg

Freshness: 81/100
Shelf Life: 3.2 days
Spoilage Risk: 18%

Recommended Action:
→ Sell locally
→ Prioritize within 48 hours
```

---

# 12. Feature 8 — Digital Batch Passport

Every batch can receive a unique QR code.

Scanning the QR code opens its digital history:

```text
FARM
  ↓
HARVEST
  ↓
PACK HOUSE
  ↓
TRANSPORT
  ↓
WAREHOUSE
  ↓
RETAILER
```

The passport can contain:

* Batch ID
* Produce type
* Harvest date
* Quality inspection
* Freshness score
* Storage history
* Temperature history
* Predicted shelf life
* Current risk
* Recommendations

This creates a traceable digital identity for the produce batch.

---

# 13. Feature 9 — Real-Time Cold-Chain Monitoring

Sensors are **optional for the core MVP**.

For the advanced version, an ESP32-based device can collect:

* Temperature
* Humidity

The data can be transmitted through MQTT.

```text
ESP32
   ↓
Temperature / Humidity
   ↓
MQTT
   ↓
Backend
   ↓
Database
   ↓
AI Model
   ↓
Updated Shelf-Life Prediction
```

For example:

```text
Normal Storage
      ↓
Temperature increases
      ↓
AI detects storage stress
      ↓
Spoilage risk increases
      ↓
Shelf life prediction changes
      ↓
Alert generated
```

This demonstrates how the platform can respond to changing cold-chain conditions.

---

# 14. Feature 10 — AI Operations Agent

Taza can include an AI agent that acts as an operations assistant.

A warehouse manager could ask:

> "Which batches should we sell first?"

The agent checks:

* Inventory
* Freshness
* Shelf life
* Spoilage risk
* Demand
* Location

and responds:

> **Mango Batch MNG-102 should be prioritized because it has 1.8 days of estimated shelf life remaining and high nearby demand.**

The agent can also answer:

* Which inventory is at highest risk?
* Which batches should be moved?
* Which produce should be discounted?
* Which batches can safely travel farther?
* How much produce is at risk?
* What actions could reduce expected waste?

The LLM acts as an **interface and reasoning layer**, while the actual freshness and shelf-life predictions come from dedicated ML models.

---

# 15. Handling the "Inside the Fruit" Problem

A critical limitation is that a normal RGB camera cannot reliably detect every internal defect.

Taza handles this honestly.

Instead of claiming:

> ❌ "Our camera can see whether the fruit is rotten inside."

Taza says:

> ✅ **"Our system estimates deterioration and hidden-spoilage risk using multiple observable signals."**

Future versions can integrate:

* NIR spectroscopy
* Hyperspectral imaging
* VOC/gas sensing
* Laboratory measurements

These can provide additional information about internal quality.

For the hackathon MVP, these technologies are **not required**.

---

# 16. AI/ML Architecture

Taza can use multiple specialized models rather than one model doing everything.

### Computer Vision Model

**Input:**

Produce image

**Output:**

* Produce type
* Ripeness
* Visible defects

Possible technology:

**YOLO + PyTorch + OpenCV**

---

### Freshness Model

**Inputs:**

```text
Visual features
+
Brix
+
Temperature
+
Humidity
+
Age
+
Storage information
```

**Output:**

```text
Freshness Score
```

Possible models:

**XGBoost / LightGBM / Neural Network**

---

### Shelf-Life Model

**Inputs:**

```text
Freshness
+
Temperature history
+
Humidity
+
Age
+
Quality parameters
```

**Output:**

```text
Remaining Shelf Life
```

---

### Spoilage Model

**Output:**

```text
Spoilage Risk Probability
```

---

# 17. Technology Stack

## Frontend

* React
* Vite
* Tailwind CSS
* Recharts
* Axios
* Framer Motion

## Backend

* Node.js
* Express.js
* REST APIs
* WebSockets if real-time updates are required

## Database

* PostgreSQL
* Prisma or Sequelize

## AI/ML

* Python
* PyTorch
* YOLO
* OpenCV
* Scikit-learn
* XGBoost / LightGBM
* Pandas
* NumPy

## AI Agent

* LangGraph
* LLM API
* Tool-based architecture

## IoT — Optional

* ESP32
* Temperature/Humidity sensor
* MQTT

## Infrastructure

* Docker
* Redis
* Git/GitHub
* CI/CD

---

# 18. System Architecture

```text
                    ┌─────────────────────┐
                    │       USERS         │
                    │ Warehouse / Retail  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ React + Vite        │
                    │ Dashboard            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Node.js + Express   │
                    │ Backend API          │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼───────────────────┐
          │                    │                   │
          ▼                    ▼                   ▼
    PostgreSQL              Redis            Python ML
                                                Service
                                                  │
                              ┌───────────────────┼──────────────┐
                              │                   │              │
                              ▼                   ▼              ▼
                         Computer Vision    Freshness ML    Shelf-Life ML
                              │                   │              │
                              └───────────────────┼──────────────┘
                                                  ▼
                                          Spoilage Prediction
                                                  │
                                                  ▼
                                        Decision Engine
                                                  │
                              ┌───────────────────┼──────────────┐
                              ▼                   ▼              ▼
                           Sell                Move          Redirect
                                                  │
                                                  ▼
                                          Waste Reduction
```

---

# 19. Example End-to-End Scenario

A warehouse receives **1,000 kg of mangoes**.

### Step 1 — Inspection

The operator uploads an image.

Computer vision detects:

* High ripeness
* Minor bruising
* No significant visible mold

### Step 2 — Data Collection

The system receives:

```text
Brix: 14.2°
Temperature: 8.5°C
Humidity: 82%
Age: 5 days
Quantity: 1000 kg
```

### Step 3 — AI Prediction

```text
Freshness:        78/100
Spoilage Risk:    31%
Shelf Life:       1.8 days
```

### Step 4 — Supply-Chain Analysis

Taza checks:

```text
Nearby demand: High
Nearby retailer: 40 km
Transport time: 2 hours
```

### Step 5 — Recommendation

```text
🚨 HIGH PRIORITY

Sell this batch locally.

Recommended action:
Move 700 kg to nearby retailers.
Process/redirect remaining quantity if
it cannot be sold within the predicted
quality window.
```

### Step 6 — Impact

The dashboard records:

```text
Potential waste
        ↓
AI intervention
        ↓
Expected waste reduction
        ↓
₹ value preserved
        ↓
kg of produce saved
```

---

# 20. Why Taza Is Different

A typical project might do:

```text
Image → Fresh / Rotten
```

Taza does:

```text
Image
 +
Quality
 +
Storage
 +
Supply Chain
        ↓
AI
        ↓
Freshness
        ↓
Shelf Life
        ↓
Spoilage Risk
        ↓
Business Decision
        ↓
Waste Reduction
```

The product therefore connects **AI prediction with an actual operational decision**.

---

# 21. Hackathon MVP

For the first working version, don't build everything.

### Must Have

1. **Produce image upload**
2. **Computer vision defect/ripeness detection**
3. **Freshness score**
4. **Shelf-life prediction**
5. **Spoilage-risk prediction**
6. **Batch management**
7. **AI recommendation**
8. **Waste-reduction dashboard**

### Nice to Have

9. QR batch passport
10. AI operations agent
11. Demand-based recommendations
12. Route optimization

### Advanced

13. ESP32 sensors
14. Real-time cold-chain monitoring
15. NIR/hyperspectral integration

---

# 22. Final Value Proposition

Taza transforms fresh-produce management from a **reactive inspection process** into a **predictive decision system**.

Instead of discovering that produce has already spoiled, businesses can identify risky batches earlier, estimate how much usable time remains, prioritize inventory intelligently, and redirect produce before it becomes waste.

## Taza's core loop:

**SEE → PREDICT → PRIORITIZE → ACT → SAVE**

> **Taza — Predict freshness. Prevent waste. Save value.**
