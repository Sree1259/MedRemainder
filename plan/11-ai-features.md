# Step 11 – AI-Powered Features

## Goals
- JITI (Just-In-Time Intervention) – smart nudges based on behaviour
- Predictive adherence scoring
- Natural-language drug info chatbot
- Prescription label OCR
- Health correlation insights

---

## 1. AI Engine Architecture

The AI features run as a separate **Python FastAPI micro-service**, communicating with the main Node.js API via REST.

```
services/ai-engine/
├── app/
│   ├── main.py               # FastAPI entry point
│   ├── config.py              # Settings
│   ├── routers/
│   │   ├── jiti.py            # JITI intervention endpoints
│   │   ├── adherence.py       # Adherence prediction
│   │   ├── chatbot.py         # Drug info chatbot
│   │   ├── ocr.py             # Prescription scanning
│   │   └── insights.py        # Health correlation
│   ├── models/
│   │   ├── adherence_model.py # ML model wrapper
│   │   └── schemas.py         # Pydantic schemas
│   └── services/
│       ├── jiti_engine.py     # JITI logic
│       ├── prediction.py      # Adherence prediction
│       ├── nlp.py             # Chatbot NLP
│       └── vision.py          # OCR processing
├── ml_models/                 # Serialised model files
├── requirements.txt
└── tests/
```

---

## 2. JITI – Just-In-Time Intervention

### Concept
Analyse user behaviour patterns to deliver the **right message at the right time** to improve adherence.

### Triggers & Responses

| Trigger | JITI Response |
|---|---|
| User frequently misses 8am dose | "We noticed you often miss your morning dose. Would you like to shift it to 9am?" |
| 3 consecutive missed doses | "Staying on schedule matters! Your streak was 14 days — let's get it back! 💪" |
| User opens app near dose time but doesn't confirm | "Looks like it's time for your Metformin. Tap to confirm you've taken it." |
| Upcoming refill date | "You'll run out of Lisinopril in 3 days. Want us to send a refill reminder?" |
| Health metric trend worsening | "Your blood glucose has been trending up. This could be related to missed doses last week." |

### Implementation
```python
class JITIEngine:
    def evaluate(self, user_id: str) -> Optional[Intervention]:
        """Evaluate all JITI rules for a user and return the highest-priority intervention."""
        context = self._build_context(user_id)  # recent adherence, health, time, patterns
        interventions = []
        for rule in self.rules:
            result = rule.evaluate(context)
            if result:
                interventions.append(result)
        return self._prioritize(interventions)
```

### Rule Engine (Strategy Pattern)
```python
class JITIRule(ABC):
    @abstractmethod
    def evaluate(self, context: UserContext) -> Optional[Intervention]: ...

class MissedDoseStreakRule(JITIRule): ...
class TimeShiftSuggestionRule(JITIRule): ...
class RefillPredictionRule(JITIRule): ...
class HealthCorrelationRule(JITIRule): ...
class EncouragementRule(JITIRule): ...
```

---

## 3. Predictive Adherence Scoring

### Model
- **Input features**: dose history (last 30 days), time-of-day patterns, day-of-week patterns, streak length, refill frequency, number of medications
- **Output**: Adherence risk score (0–100, higher = more likely to miss next dose)
- **Algorithm**: Gradient Boosted Trees (XGBoost) or simple logistic regression for MVP

### Training Data
- Generated from `dose_logs` table (taken vs missed)
- Retrained weekly in batch job

### API
```
POST /ai/adherence/predict
Body: { "userId": "uuid" }
Response: { "score": 73, "risk": "medium", "factors": ["frequent_evening_misses", "weekend_drops"] }
```

---

## 4. Drug Info Chatbot

### Powered by LLM (OpenAI GPT-4 or local model)

Users can ask natural-language questions about their medications:
- "Can I take Ibuprofen with my current medications?"
- "What are the side effects of Metformin?"
- "Can I drink alcohol while on Warfarin?"

### Implementation
```python
@router.post("/chatbot/ask")
async def ask_chatbot(request: ChatRequest):
    # 1. Build context from user's medication list
    context = build_medication_context(request.user_id)

    # 2. Call LLM with system prompt + context + user question
    response = await llm_client.chat(
        system_prompt=DRUG_INFO_SYSTEM_PROMPT,
        context=context,
        question=request.question
    )

    # 3. Add safety disclaimer
    return ChatResponse(
        answer=response,
        disclaimer="This is not medical advice. Always consult your healthcare provider."
    )
```

### Safety Guardrails
- Always append medical disclaimer
- Refuse to provide dosage recommendations
- Flag questions about self-harm or emergency symptoms → redirect to emergency services
- Log all interactions for audit

---

## 5. Prescription Label OCR

### Flow
1. User captures photo of prescription label
2. Image sent to AI engine
3. OCR extracts: drug name, dosage, frequency, prescriber, Rx#, refill count
4. Structured data returned to pre-fill medication form

### Tech
- **Google Vision API** or **Tesseract OCR** for text extraction
- **GPT-4 Vision** or custom NER model for field extraction from raw text
- Confidence scores for each extracted field

```python
@router.post("/ocr/prescription")
async def scan_prescription(file: UploadFile):
    image = await file.read()
    raw_text = await ocr_service.extract_text(image)
    fields = await nlp_service.extract_medication_fields(raw_text)
    return PrescriptionScanResult(
        drugName=fields.drug_name,
        dosage=fields.dosage,
        frequency=fields.frequency,
        prescriber=fields.prescriber,
        rxNumber=fields.rx_number,
        confidence=fields.confidence_scores
    )
```

---

## 6. Health Correlation Insights

Analyse correlations between medication adherence and health metrics:

```python
def generate_insights(user_id: str) -> List[Insight]:
    adherence_data = get_adherence_timeseries(user_id)
    health_data = get_health_timeseries(user_id)

    insights = []
    for metric in health_data:
        correlation = compute_correlation(adherence_data, metric)
        if abs(correlation.coefficient) > 0.3:
            insights.append(Insight(
                metric=metric.type,
                correlation=correlation.coefficient,
                summary=generate_summary(metric, correlation)
            ))
    return insights
```

Example output:
> "Your blood pressure readings are on average 8mmHg lower on days you take Lisinopril on time (correlation: 0.72)."

---

## 7. API Endpoints Summary

| Method | Path | Description |
|---|---|---|
| POST | `/ai/jiti/evaluate` | Get JITI intervention for user |
| POST | `/ai/adherence/predict` | Adherence risk prediction |
| POST | `/ai/chatbot/ask` | Drug info chatbot |
| POST | `/ai/ocr/prescription` | Prescription label scan |
| GET | `/ai/insights/:userId` | Health correlation insights |

---

> **Next →** [Step 12 – Dashboard & Reporting](./12-dashboard-reporting.md)
