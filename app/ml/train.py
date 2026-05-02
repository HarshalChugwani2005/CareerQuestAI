from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier, XGBRegressor

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

COURSE_TYPES = ["stem", "business", "arts"]


def create_synthetic_data(rows: int = 500, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    cgpa = rng.uniform(5.5, 9.8, rows)
    college_tier = rng.integers(1, 4, rows)
    course_type = rng.choice(COURSE_TYPES, rows)
    city_demand = rng.uniform(30, 95, rows)
    certifications = rng.integers(0, 8, rows)
    internships = rng.integers(0, 4, rows)
    github_score = rng.uniform(10, 95, rows)
    application_velocity = rng.integers(2, 45, rows)

    raw_score = (
        (cgpa - 5) * 8
        + (4 - college_tier) * 5
        + city_demand * 0.4
        + certifications * 4
        + internships * 6
        + github_score * 0.3
        + application_velocity * 0.5
        + rng.normal(0, 8, rows)
    )
    probability = 1 / (1 + np.exp(-(raw_score - 50) / 10))
    placement = (probability > 0.5).astype(int)

    salary = (
        300000
        + cgpa * 20000
        + (4 - college_tier) * 25000
        + certifications * 12000
        + internships * 20000
        + github_score * 900
        + application_velocity * 1500
        + rng.normal(0, 40000, rows)
    )

    return pd.DataFrame(
        {
            "cgpa": cgpa,
            "college_tier": college_tier,
            "course_type": course_type,
            "city_demand_index": city_demand,
            "certifications_count": certifications,
            "internships": internships,
            "github_score": github_score,
            "application_velocity": application_velocity,
            "placement": placement,
            "salary": salary,
        }
    )


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    encoded = pd.get_dummies(df, columns=["course_type"], prefix="course")
    for course in COURSE_TYPES:
        col = f"course_{course}"
        if col not in encoded:
            encoded[col] = 0
    return encoded


def train_models(df: pd.DataFrame) -> tuple[XGBClassifier, XGBRegressor, list[str]]:
    features = df.drop(columns=["placement", "salary"])
    features = encode_features(features)
    feature_cols = list(features.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        features, df["placement"], test_size=0.2, random_state=42
    )

    classifier = XGBClassifier(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="binary:logistic",
        eval_metric="logloss",
        random_state=42,
    )
    classifier.fit(X_train, y_train)

    X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(
        features, df["salary"], test_size=0.2, random_state=42
    )

    regressor = XGBRegressor(
        n_estimators=220,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=42,
    )
    regressor.fit(X_train_reg, y_train_reg)

    return classifier, regressor, feature_cols


def main() -> None:
    df = create_synthetic_data()
    classifier, regressor, feature_cols = train_models(df)

    joblib.dump(classifier, ARTIFACT_DIR / "placement_classifier.joblib")
    joblib.dump(regressor, ARTIFACT_DIR / "salary_regressor.joblib")
    joblib.dump(feature_cols, ARTIFACT_DIR / "feature_columns.joblib")


if __name__ == "__main__":
    main()
