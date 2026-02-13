from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from datetime import datetime, timedelta

app = FastAPI(
    title="MedReminder AI Engine",
    description="AI-powered features for medication management",
    version="1.0.0"
)

# Request/Response Models
class MedicationInput(BaseModel):
    name: str
    dosage: str
    schedule_type: str
    time_slots: List[str]

class AdherenceData(BaseModel):
    user_id: str
    medication_id: str
    dose_logs: List[dict]
    days_history: int = 30

class AdherencePrediction(BaseModel):
    adherence_score: float
    risk_level: str
    recommendations: List[str]
    predicted_next_dose_time: Optional[str]

class JITIRequest(BaseModel):
    user_id: str
    medication_id: str
    last_dose_time: Optional[str]
    missed_doses_count: int
    current_time: str
    user_context: dict

class JITIResponse(BaseModel):
    intervention_type: str
    message: str
    urgency: str
    suggested_action: str

class DrugInteractionRequest(BaseModel):
    medications: List[MedicationInput]

class InteractionResult(BaseModel):
    drug_a: str
    drug_b: str
    severity: str
    description: str
    recommendation: str

class ChatRequest(BaseModel):
    query: str
    user_context: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    sources: List[str]
    confidence: float

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/predict-adherence", response_model=AdherencePrediction)
async def predict_adherence(data: AdherenceData):
    """
    Predict medication adherence based on historical dose logs.
    """
    try:
        # Calculate basic adherence metrics
        total_doses = len(data.dose_logs)
        if total_doses == 0:
            return AdherencePrediction(
                adherence_score=0.0,
                risk_level="unknown",
                recommendations=["Start tracking your medication to get adherence insights"],
                predicted_next_dose_time=None
            )
        
        taken_doses = sum(1 for log in data.dose_logs if log.get("action") == "taken")
        adherence_score = (taken_doses / total_doses) * 100
        
        # Determine risk level
        if adherence_score >= 90:
            risk_level = "low"
            recommendations = ["Great job! Keep up the good adherence"]
        elif adherence_score >= 70:
            risk_level = "moderate"
            recommendations = [
                "Set up additional reminders",
                "Consider using a pill organizer",
                "Link with a MedFriend for accountability"
            ]
        else:
            risk_level = "high"
            recommendations = [
                "Critical: Low adherence detected",
                "Set up multiple daily reminders",
                "Enable MedFriend notifications",
                "Consider speaking with your healthcare provider"
            ]
        
        # Predict next dose (simplified)
        predicted_next = None
        if data.dose_logs:
            last_dose = max(data.dose_logs, key=lambda x: x.get("scheduled_time", ""))
            if last_dose:
                last_time = datetime.fromisoformat(last_dose["scheduled_time"].replace("Z", "+00:00"))
                predicted_next = (last_time + timedelta(hours=12)).isoformat()
        
        return AdherencePrediction(
            adherence_score=round(adherence_score, 2),
            risk_level=risk_level,
            recommendations=recommendations,
            predicted_next_dose_time=predicted_next
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jiti-intervention", response_model=JITIResponse)
async def generate_jiti_intervention(request: JITIRequest):
    """
    Generate Just-In-Time Intervention based on user context.
    """
    try:
        missed_count = request.missed_doses_count
        
        # Determine intervention based on missed doses and context
        if missed_count == 0:
            return JITIResponse(
                intervention_type="encouragement",
                message="You're doing great! Keep taking your medications on time.",
                urgency="low",
                suggested_action="continue_routine"
            )
        elif missed_count <= 2:
            return JITIResponse(
                intervention_type="nudge",
                message="We noticed you missed a dose. Remember, consistency is key for your health.",
                urgency="medium",
                suggested_action="take_now"
            )
        elif missed_count <= 5:
            return JITIResponse(
                intervention_type="education",
                message="Skipping doses can reduce the effectiveness of your treatment. Let's get back on track!",
                urgency="high",
                suggested_action="schedule_reminder"
            )
        else:
            return JITIResponse(
                intervention_type="alert",
                message="You've missed several doses. This may impact your health. Please contact your healthcare provider.",
                urgency="critical",
                suggested_action="contact_provider"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/check-interactions", response_model=List[InteractionResult])
async def check_drug_interactions(request: DrugInteractionRequest):
    """
    Check for drug interactions between medications.
    """
    try:
        interactions = []
        meds = request.medications
        
        # Simple interaction checking (in production, use a comprehensive drug database)
        for i in range(len(meds)):
            for j in range(i + 1, len(meds)):
                med_a = meds[i].name.lower()
                med_b = meds[j].name.lower()
                
                # Check for known interactions
                if "lisinopril" in med_a and "ibuprofen" in med_b or \
                   "lisinopril" in med_b and "ibuprofen" in med_a:
                    interactions.append(InteractionResult(
                        drug_a=meds[i].name,
                        drug_b=meds[j].name,
                        severity="moderate",
                        description="NSAIDs may reduce the antihypertensive effect of ACE inhibitors",
                        recommendation="Monitor blood pressure closely. Consider alternative pain relievers."
                    ))
                
                if "warfarin" in med_a or "warfarin" in med_b:
                    interactions.append(InteractionResult(
                        drug_a=meds[i].name,
                        drug_b=meds[j].name,
                        severity="major",
                        description="Warfarin has many drug interactions. Monitor INR closely.",
                        recommendation="Regular blood tests required. Report any unusual bleeding."
                    ))
                
                if "metformin" in med_a and ("contrast" in med_b or "iodine" in med_b):
                    interactions.append(InteractionResult(
                        drug_a=meds[i].name,
                        drug_b=meds[j].name,
                        severity="major",
                        description="Metformin should be held before contrast studies",
                        recommendation="Hold metformin 48 hours before and after contrast. Monitor kidney function."
                    ))
        
        return interactions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat", response_model=ChatResponse)
async def drug_info_chat(request: ChatRequest):
    """
    Simple drug information chatbot.
    """
    try:
        query = request.query.lower()
        
        # Simple rule-based responses (in production, use NLP/LLM)
        if "side effect" in query or "adverse" in query:
            response = "Common side effects vary by medication. Always read the medication guide and contact your doctor if you experience severe or persistent side effects."
            sources = ["FDA Medication Guides"]
            confidence = 0.85
        elif "dosage" in query or "dose" in query or "how much" in query:
            response = "Always follow your prescribed dosage. Never change your dose without consulting your healthcare provider."
            sources = ["Prescribing Information"]
            confidence = 0.95
        elif "interaction" in query or "together" in query:
            response = "Drug interactions can be dangerous. Always inform your healthcare provider about all medications and supplements you're taking."
            sources = ["Drug Interaction Database"]
            confidence = 0.90
        elif "food" in query or "meal" in query or "eat" in query:
            response = "Some medications should be taken with food, others on an empty stomach. Check your medication label or ask your pharmacist."
            sources = ["Pharmacy Guidelines"]
            confidence = 0.88
        elif "missed" in query or "forgot" in query:
            response = "If you miss a dose, take it as soon as you remember unless it's close to your next dose. Never double up doses."
            sources = ["Patient Counseling Guidelines"]
            confidence = 0.92
        else:
            response = "I can help answer questions about medication side effects, dosages, interactions, and usage. Please ask a specific question about your medication."
            sources = []
            confidence = 0.70
        
        return ChatResponse(
            response=response,
            sources=sources,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {
        "message": "MedReminder AI Engine",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/predict-adherence",
            "/jiti-intervention",
            "/check-interactions",
            "/chat"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
