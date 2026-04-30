from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
import torchtuples as tt
from pycox.models import CoxPH

ARTIFACT_DIR = Path(__file__).resolve().parent / "artifacts"
ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

COURSE_TYPES = ["stem", "business", "arts"]


def create_synthetic_survival(rows: int = 500, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    cgpa = rng.uniform(5.5, 9.8, rows)
    college_tier = rng.integers(1, 4, rows)
    course_type = rng.choice(COURSE_TYPES, rows)
    city_demand = rng.uniform(30, 95, rows)
    certifications = rng.integers(0, 8, rows)
    internships = rng.integers(0, 4, rows)
    github_score = rng.uniform(10, 95, rows)
    application_velocity = rng.integers(2, 45, rows)

    risk_score = (
        -cgpa * 0.3
        - (4 - college_tier) * 0.4
        - city_demand * 0.01
        - certifications * 0.2
        - internships * 0.25
        - github_score * 0.01
        - application_velocity * 0.02
        + rng.normal(0, 0.5, rows)
    )

    baseline = 30 + risk_score * 10
    time_to_placement = np.clip(rng.normal(baseline, 6, rows), 2, 52).astype(int)
    placed = (rng.random(rows) > 0.2).astype(int)

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
            "time_to_placement": time_to_placement,
            "placed": placed,
        }
    )


def encode_features(df: pd.DataFrame) -> pd.DataFrame:
    encoded = pd.get_dummies(df, columns=["course_type"], prefix="course")
    for course in COURSE_TYPES:
        col = f"course_{course}"
        if col not in encoded:
            encoded[col] = 0
    return encoded


def main() -> None:
    df = create_synthetic_survival()
    features = encode_features(df.drop(columns=["time_to_placement", "placed"]))
    feature_cols = list(features.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        features, df[["time_to_placement", "placed"]], test_size=0.2, random_state=42
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    y_train_tuple = (y_train["time_to_placement"].values, y_train["placed"].values)
    y_test_tuple = (y_test["time_to_placement"].values, y_test["placed"].values)

    net = tt.practical.MLPVanilla(
        input_dim=X_train_scaled.shape[1],
        num_nodes=[32, 16],
        out_features=1,
        batch_norm=True,
        dropout=0.1,
    )

    model = CoxPH(net, tt.optim.Adam)
    model.fit(
        X_train_scaled,
        y_train_tuple,
        batch_size=64,
        epochs=80,
        val_data=(X_test_scaled, y_test_tuple),
        verbose=False,
    )

    model.compute_baseline_hazards()

    joblib.dump(scaler, ARTIFACT_DIR / "survival_scaler.joblib")
    joblib.dump(feature_cols, ARTIFACT_DIR / "survival_features.joblib")
    model.save_net(str(ARTIFACT_DIR / "survival_model.pt"))
    joblib.dump(model.baseline_hazards_, ARTIFACT_DIR / "survival_baseline.joblib")


if __name__ == "__main__":
    main()
