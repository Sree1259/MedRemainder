# Step 05 – Medication Management

## Goals
- Full CRUD for medications with complex scheduling
- Visual identification (shape, color, photo)
- Quantity tracking with refill alerts
- Schedule builder supporting all MediSafe schedule types

---

## 1. API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/medications` | List user's medications (filterable, paginated) |
| POST | `/medications` | Create medication + schedule |
| GET | `/medications/:id` | Get medication detail |
| PATCH | `/medications/:id` | Update medication |
| DELETE | `/medications/:id` | Soft-delete (set `is_active = false`) |
| POST | `/medications/:id/photo` | Upload medication photo |
| GET | `/medications/:id/history` | Dose history for this medication |
| POST | `/medications/:id/take` | Log dose as taken |
| POST | `/medications/:id/skip` | Log dose as skipped |
| PATCH | `/medications/:id/refill` | Reset quantity after refill |

---

## 2. Schedule Builder (Strategy Pattern)

The schedule system must handle all MediSafe schedule types:

```typescript
interface IScheduleStrategy {
  getNextDoses(from: Date, count: number): Date[];
  isDueOn(date: Date): boolean;
}

class DailySchedule implements IScheduleStrategy { /* ... */ }
class SpecificDaysSchedule implements IScheduleStrategy { /* ... */ }
class IntervalSchedule implements IScheduleStrategy { /* ... */ }
class CycleSchedule implements IScheduleStrategy { /* ... */ }
class AsNeededSchedule implements IScheduleStrategy { /* ... */ }
```

### Schedule Types

| Type | Example | Config |
|---|---|---|
| **Daily** | Every day at 8am, 2pm, 8pm | `timeSlots: ["08:00","14:00","20:00"]` |
| **Specific days** | Mon, Wed, Fri at 9am | `daysOfWeek: [1,3,5], timeSlots: ["09:00"]` |
| **Interval** | Every 3 days | `intervalDays: 3, timeSlots: ["10:00"]` |
| **Cycle** | 21 days on, 7 days off | `cycleDaysOn: 21, cycleDaysOff: 7` |
| **As-needed** | Take when pain occurs | `isAsNeeded: true` (no schedule, manual logging) |

---

## 3. Photo Upload Flow

1. Client sends `multipart/form-data` with image file
2. Backend validates file type (JPEG, PNG, WebP) and size (< 5MB)
3. Generate unique key: `medications/{userId}/{medId}/{uuid}.webp`
4. Resize to max 800×800px (sharp library)
5. Upload to MinIO/S3
6. Save URL in `medications.photo_url`

---

## 4. Refill Tracking

### Automatic countdown
```
On each "dose taken" event:
  medication.quantity_remaining -= dosage_units
  if (quantity_remaining <= refill_threshold):
    → Emit RefillNeeded event
    → Queue refill reminder notification
```

### Refill reset
```
PATCH /medications/:id/refill
Body: { quantity: 90 }
→ Reset quantity_remaining to 90
```

---

## 5. Medication Info (enrichment)

When a user adds a medication by name:
1. Search the **RxNorm API** (`rxnav.nlm.nih.gov`) for matching drugs
2. Auto-fill generic name, common dosages, form
3. Retrieve `rxcui` (RxNorm Concept Unique Identifier) for drug interaction checks
4. Cache results in Redis (TTL: 24h)

---

## 6. Validation Schema (Zod)

```typescript
const createMedicationSchema = z.object({
  name: z.string().min(1).max(255),
  genericName: z.string().max(255).optional(),
  dosage: z.string().min(1).max(100),
  form: z.enum(['pill','capsule','liquid','injection','patch','inhaler','drops','cream','other']),
  instructions: z.string().max(1000).optional(),
  quantityTotal: z.number().int().positive().optional(),
  refillThreshold: z.number().int().min(0).optional(),
  isAsNeeded: z.boolean().default(false),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  schedule: z.object({
    type: z.enum(['daily','specific_days','interval','cycle']),
    timeSlots: z.array(z.string().regex(/^\d{2}:\d{2}$/)).min(1),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    intervalDays: z.number().int().positive().optional(),
    cycleDaysOn: z.number().int().positive().optional(),
    cycleDaysOff: z.number().int().positive().optional(),
  }).optional(),
});
```

---

> **Next →** [Step 06 – Reminders & Notifications](./06-reminders-notifications.md)
