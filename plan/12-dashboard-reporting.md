# Step 12 – Dashboard & Reporting

## Goals
- Patient dashboard with adherence overview, streaks, and quick actions
- Detailed adherence reports (daily / weekly / monthly)
- Provider portal for monitoring patients
- PDF export for sharing with doctors

---

## 1. Patient Dashboard (Mobile Home Screen)

### Layout

```
┌─────────────────────────────────┐
│  Good Morning, Sarah! 🌅        │
│  Adherence streak: 🔥 14 days   │
├─────────────────────────────────┤
│  TODAY'S SCHEDULE                │
│  ┌──────────────────┐           │
│  │ ✅ 8:00am Metformin 500mg   │
│  │ ⏰ 2:00pm Lisinopril 10mg  │
│  │ 🕐 8:00pm Atorvastatin 20mg│
│  └──────────────────┘           │
├─────────────────────────────────┤
│  WEEKLY ADHERENCE    92%        │
│  ████████████░░  (bar chart)    │
├─────────────────────────────────┤
│  ⚠️ Drug Interaction Alert (1)  │
│  📦 Refill needed: Metformin    │
│  💡 AI Insight: "BP improved…"  │
├─────────────────────────────────┤
│  HEALTH SNAPSHOT                │
│  BP: 120/80  Glucose: 95 mg/dL  │
│  Weight: 72 kg  Mood: 😊 8/10   │
└─────────────────────────────────┘
```

### API for Dashboard Data
```
GET /dashboard
Response: {
  greeting: "Good Morning, Sarah!",
  streak: 14,
  todaySchedule: [...],
  weeklyAdherence: 92,
  alerts: [...],
  healthSnapshot: {...},
  aiInsight: "..."
}
```

---

## 2. Adherence Reports

### Report Types

| Period | Content |
|---|---|
| **Daily** | Each medication: taken/missed/skipped with timestamps |
| **Weekly** | Adherence % per medication, trend vs previous week |
| **Monthly** | Overall adherence %, per-medication breakdown, health correlation |

### Report API
```
GET /reports/adherence?period=weekly&from=2025-02-01&to=2025-02-07
```

### Response
```json
{
  "period": "weekly",
  "overallAdherence": 92,
  "byMedication": [
    {
      "medication": "Metformin 500mg",
      "adherence": 100,
      "taken": 14,
      "missed": 0,
      "skipped": 0
    },
    {
      "medication": "Lisinopril 10mg",
      "adherence": 85,
      "taken": 6,
      "missed": 1,
      "skipped": 0
    }
  ],
  "dailyBreakdown": [
    { "date": "2025-02-01", "adherence": 100 },
    { "date": "2025-02-02", "adherence": 75 }
  ]
}
```

---

## 3. PDF Export

- Use **Puppeteer** or **@react-pdf/renderer** to generate PDF reports
- Template includes:
  - Patient info header
  - Date range
  - Adherence chart
  - Medication list with adherence per med
  - Health measurement summary
  - Notes section

### API
```
GET /reports/export/pdf?period=monthly&month=2025-01
→ Returns PDF file (application/pdf)
```

---

## 4. Provider Portal (Web Dashboard)

React web app (`apps/web/`) for healthcare providers:

### Features
| Feature | Description |
|---|---|
| Patient list | All linked patients with adherence overview |
| Patient detail | Full medication schedule & adherence history |
| Alerts | Missed dose alerts across all patients |
| Reports | Generate & download patient reports |
| Messaging | In-app notes to patient |

### Access Control
- Provider must be linked to patient via `medfriend_links` with `role = provider`
- Patient explicitly grants access + selects which data to share
- All provider access logged in `audit_logs`

### Provider Dashboard Layout
```
┌──────────────────────────────────────────┐
│  MedReminder Provider Portal              │
├──────────────┬───────────────────────────┤
│ Patient List │ Patient: Sarah Johnson     │
│              │ Overall Adherence: 92%     │
│ 🟢 Sarah  92%│                            │
│ 🟡 John   78%│ [Adherence Chart]          │
│ 🔴 Mary   45%│                            │
│              │ Medications:               │
│              │ ✅ Metformin – 100%        │
│              │ 🟡 Lisinopril – 85%       │
│              │                            │
│              │ [Download Report] [Message] │
└──────────────┴───────────────────────────┘
```

---

## 5. Analytics & Metrics

Track in the background for dashboard cards:
- **Adherence rate**: total taken / total scheduled
- **Streak**: consecutive days with 100% adherence
- **Best/worst time slot**: which time of day adherence is highest/lowest
- **Refill compliance**: % of refills ordered before running out

---

> **Next →** [Step 13 – Frontend Foundation](./13-frontend-foundation.md)
