# Step 08 – Health Tracking & Measurements

## Goals
- Support 25+ health metrics with flexible data model
- Charting and trend analysis
- Apple Health / Google Fit bidirectional sync
- Correlate health data with medication adherence

---

## 1. Supported Metrics

| Category | Metrics | Unit(s) |
|---|---|---|
| **Cardiovascular** | Blood Pressure (systolic/diastolic), Pulse | mmHg, bpm |
| **Diabetes** | Blood Glucose, A1C, Insulin dose | mg/dL, %, units |
| **Cholesterol** | Total, HDL, LDL, Triglycerides | mg/dL |
| **Body** | Weight, BMI, Body Fat %, Waist circumference | kg/lb, %, cm/in |
| **Respiratory** | Peak Flow, SpO2 | L/min, % |
| **Mental Health** | Mood (1-10 scale), Anxiety (1-10), Sleep quality (1-10) | score |
| **Pain** | Pain level (1-10), Pain location | score, text |
| **Temperature** | Body temperature | °F / °C |
| **Nutrition** | Water intake, Calorie count | ml/oz, kcal |
| **Exercise** | Steps, Active minutes | count, min |

---

## 2. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health/metrics` | List available metric types |
| POST | `/health/measurements` | Record a measurement |
| GET | `/health/measurements` | List measurements (filterable by type, date range) |
| GET | `/health/measurements/latest` | Latest value for each tracked metric |
| GET | `/health/trends/:metricType` | Aggregated trend data for charting |
| DELETE | `/health/measurements/:id` | Delete a measurement |
| POST | `/health/sync/apple` | Sync from Apple Health |
| POST | `/health/sync/google-fit` | Sync from Google Fit |

---

## 3. Flexible Measurement Storage

The `health_measurements` table uses a **EAV-like** approach with typed columns:

```sql
-- Single-value metrics (weight, glucose, mood)
value: 120.5, value_secondary: NULL

-- Dual-value metrics (blood pressure: systolic/diastolic)
value: 120.0, value_secondary: 80.0
```

This avoids creating separate tables for each metric type while keeping queries efficient.

---

## 4. Trend Aggregation

```typescript
// GET /health/trends/blood_glucose?period=weekly&range=30d
interface TrendDataPoint {
  date: string;      // "2025-02-10"
  avg: number;
  min: number;
  max: number;
  count: number;
}
```

Backend aggregation query:
```sql
SELECT
  DATE(measured_at AT TIME ZONE user_tz) AS date,
  AVG(value) AS avg,
  MIN(value) AS min,
  MAX(value) AS max,
  COUNT(*) AS count
FROM health_measurements
WHERE user_id = $1
  AND metric_type = $2
  AND measured_at >= NOW() - INTERVAL '30 days'
GROUP BY date
ORDER BY date;
```

---

## 5. Apple Health / Google Fit Sync

### Apple Health (iOS)
- Use `react-native-health` library
- Request read permissions for relevant HKQuantityTypes
- On app open / background fetch: pull new samples since last sync
- Write MedReminder data back to HealthKit

### Google Fit (Android)
- Use `react-native-google-fit` library
- Request OAuth scopes for fitness data
- Bidirectional sync on schedule

### Sync deduplication
- Store `source` field on each measurement
- Prevent duplicate entries by checking `(user_id, metric_type, measured_at, source)` uniqueness

---

## 6. Correlation Analysis (AI-enhanced, see Step 11)

- Track medication adherence alongside health metrics
- Example insight: "Your blood glucose averages 15mg/dL lower on days you take Metformin on time"
- Displayed on dashboard as correlation cards

---

## 7. Premium Gating

| Feature | Free | Premium |
|---|---|---|
| Number of tracked metrics | 3 | Unlimited |
| Historical data | 30 days | Unlimited |
| Trend charts | Basic (7 days) | Advanced (all time) |
| Apple Health / Google Fit sync | ❌ | ✅ |

---

> **Next →** [Step 09 – Medfriend / Caregivers](./09-medfriend-caregivers.md)
