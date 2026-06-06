from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pandas as pd

def train_model(df):
    if "heart_rate" not in df.columns or "spo2" not in df.columns:
        return {"error": "Required columns not found"}
    
    X = df[["heart_rate", "spo2"]]
    y = df["label"] if "label" in df.columns else [0]*len(df)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = LogisticRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    return {"accuracy": round(accuracy_score(y_test, y_pred), 2)}
