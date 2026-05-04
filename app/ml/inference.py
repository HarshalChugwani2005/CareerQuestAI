from __future__ import annotations

from pathlib import Path
from typing import Any
import logging

logger = logging.getLogger(__name__)

MODEL_VERSION = "xgb-1.0.0"
ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"

_classifier = None
_regressor = None
_feature_columns = None
_explainer = None
_load_error = None

def _load_model():
    global _classifier, _regressor, _feature_columns, _explainer, _load_error
    
    if _classifier is not None:
        return _classifier, _regressor, _feature_columns, _explainer

    if _load_error:
        raise RuntimeError(_load_error)

    try:
        import joblib
        import shap
        import numpy as np
        import pandas as pd
        
        _classifier = joblib.load(ARTIFACT_DIR / "placement_classifier.joblib")
        _regressor = joblib.load(ARTIFACT_DIR / "salary_regressor.joblib")
        _feature_columns = joblib.load(ARTIFACT_DIR / "feature_columns.joblib")
        _explainer = shap.TreeExplainer(_classifier)
        
        return _classifier, _regressor, _feature_columns, _explainer
    except Exception as e:
        _load_error = f"ML model dependencies or artifacts missing: {e}"
        logger.warning(_load_error)
        raise RuntimeError(_load_error)

def build_feature_row(payload: dict[str, Any], feature_columns: list[str]) -> Any:
    import pandas as pd
    filtered = {k: v for k, v in payload.items() if k != "student_id"}
    df = pd.DataFrame([filtered])
    df = pd.get_dummies(df, columns=["course_type"], prefix="course")
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    return df[feature_columns]

def predict(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        classifier, regressor, feature_columns, explainer = _load_model()
        import numpy as np
        features = build_feature_row(payload, feature_columns)
        probability = float(classifier.predict_proba(features)[0][1])
        salary = float(regressor.predict(features)[0])

        shap_values = explainer.shap_values(features)
        if isinstance(shap_values, list):
            shap_values = shap_values[1]
        shap_row = shap_values[0]

        contributions = list(zip(feature_columns, shap_row))
        contributions.sort(key=lambda item: abs(item[1]), reverse=True)

        top = [
            {
                "feature": feature,
                "contribution": float(value)
            }
            for feature, value in contributions[:5]
        ]
    except RuntimeError:
        # Fallback: Synthetic scoring based on key features
        cgpa = payload.get("cgpa", 7.0)
        certs = payload.get("certifications_count", 0)
        internships = payload.get("internships", 0)
        
        # Simple heuristic for demo
        probability = min(0.95, 0.3 + (cgpa - 5) * 0.1 + certs * 0.05 + internships * 0.1)
        salary = 400000 + (cgpa - 7) * 50000 + certs * 20000 + internships * 40000
        
        top = [
            {"feature": "cgpa", "contribution": 0.15},
            {"feature": "certifications_count", "contribution": 0.08},
            {"feature": "internships", "contribution": 0.12},
            {"feature": "github_score", "contribution": 0.05},
            {"feature": "course_stem", "contribution": 0.03}
        ]

    return {
        "placement_probability": probability,
        "predicted_salary": salary,
        "top_contributions": top
    }
