import pandas as pd
from sklearn.preprocessing import StandardScaler

def preprocess_data(df):
    scaler = StandardScaler()
    if "heart_rate" in df.columns and "spo2" in df.columns:
        df[["heart_rate", "spo2"]] = scaler.fit_transform(df[["heart_rate", "spo2"]])
    return df
