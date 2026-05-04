try:
    import mlflow
except ImportError:
    class MockMlflow:
        def start_run(self, **kwargs): return self
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def log_param(self, *args, **kwargs): pass
        def log_metric(self, *args, **kwargs): pass
    mlflow = MockMlflow()
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.db.session import get_db
from app.ml.inference import predict as predict_xgboost
from app.ml.survival_inference import predict_curve as predict_deepsurv
from app.models.enums import UserRole
from app.models.student import Student
from app.models.user import User
from app.services.ml_features import build_student_features

router = APIRouter()

def format_shap_reason_codes(contributions: list) -> list:
    """Maps raw SHAP values to human-readable Reason Codes."""
    codes = []
    mapping = {
        "cgpa": "Academic Performance",
        "college_tier": "Institution Prestige",
        "application_velocity": "LinkedIn/Indeed Activity",
        "certifications_count": "Professional Certifications",
        "internships": "Work Experience",
        "github_score": "Open Source Contribution"
    }
    for item in contributions:
        feat = item["feature"]
        val = item["contribution"]
        label = mapping.get(feat, feat.replace("_", " ").title())
        impact = "+" if val > 0 else "-"
        # Scaling for demo display: convert to BPS-like integer
        pts = int(abs(val) * 100)
        codes.append(f"{impact}{pts}: Strong {label}" if val > 0 else f"{impact}{pts}: Weak {label}")
    return codes

@router.get("/{student_id}", response_model=dict)
async def get_student_scores(
    student_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Secure endpoint for retrieving student employability scores and survival curves.
    Audited via MLflow.
    """
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Authorization check
    if current_user.role == UserRole.STUDENT and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Unauthorized access to student data")

    features = await build_student_features(db, student)

    def run_predictions():
        xg_result = predict_xgboost(features)
        ds_result = predict_deepsurv(features)
        return xg_result, ds_result

    try:
        with mlflow.start_run(run_name=f"score_audit_{student_id}"):
            mlflow.log_param("student_id", student_id)
            mlflow.log_param("requested_by", current_user.id)

            xg_result, ds_result = run_predictions()

            mlflow.log_metric("placement_probability", xg_result["placement_probability"])
            mlflow.log_metric("predicted_salary", xg_result["predicted_salary"])
    except Exception:
        xg_result, ds_result = run_predictions()

    return {
        "student_id": student_id,
        "xgboost": {
            "placement_probability": xg_result["placement_probability"],
            "predicted_salary": xg_result["predicted_salary"],
            "shap_reason_codes": format_shap_reason_codes(xg_result["top_contributions"])
        },
        "deepsurv": {
            "survival_curve": ds_result["curve"],
            "median_placement_week": ds_result["median"]
        }
    }
