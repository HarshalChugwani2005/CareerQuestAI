from __future__ import annotations

from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import shap

MODEL_VERSION = "xgb-1.0.0"
ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"

classifier = joblib.load(ARTIFACT_DIR / "placement_classifier.joblib")
regressor = joblib.load(ARTIFACT_DIR / "salary_regressor.joblib")
feature_columns: list[str] = joblib.load(ARTIFACT_DIR / "feature_columns.joblib")

explainer = shap.TreeExplainer(classifier)


def build_feature_row(payload: dict[str, Any]) -> pd.DataFrame:
    filtered = {k: v for k, v in payload.items() if k != "student_id"}
    df = pd.DataFrame([filtered])
    df = pd.get_dummies(df, columns=["course_type"], prefix="course")
    for col in feature_columns:
        if col not in df.columns:
            df[col] = 0
    return df[feature_columns]


def predict(payload: dict[str, Any]) -> dict[str, Any]:
    features = build_feature_row(payload)
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

    return {
        "placement_probability": probability,
        "predicted_salary": salary,
        "top_contributions": top
    }
