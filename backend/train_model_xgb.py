# train_model_xgb.py
import os
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
import xgboost as xgb
import joblib
import json

# ======================================================
# ⚙️ CONFIG
# ======================================================
DATA_DIR = "data"
MODEL_DIR = "model"
os.makedirs(MODEL_DIR, exist_ok=True)

ECG_MODEL_PATH = os.path.join(MODEL_DIR, "sleeplens_xgb_model.pkl")
CHATBOT_MODEL_PATH = os.path.join(MODEL_DIR, "chatbot_model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "vectorizer.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "training_metrics.json")

metrics = {}

# ======================================================
# ⚡ TRAIN ECG MODEL (MITBIH + PTBDB)
# ======================================================
print("🔬 Loading ECG datasets...")

ecg_files = ["mitbih_train.csv", "ptbdb_normal.csv", "ptbdb_abnormal.csv"]
ecg_data = []

for file in ecg_files:
    path = os.path.join(DATA_DIR, file)
    if os.path.exists(path):
        df = pd.read_csv(path, header=None)
        ecg_data.append(df)
        print(f"✅ Loaded {file} ({df.shape})")
    else:
        print(f"⚠️ File not found: {file}")

if len(ecg_data) == 0:
    raise FileNotFoundError("No ECG datasets found in 'data/'")

ecg_df = pd.concat(ecg_data, axis=0).sample(frac=1).reset_index(drop=True)

X = ecg_df.iloc[:, :-1].values
y = ecg_df.iloc[:, -1].values

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("🚀 Training XGBoost ECG model...")
ecg_model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    use_label_encoder=False,
    eval_metric="logloss"
)

ecg_model.fit(X_train, y_train)
y_pred = ecg_model.predict(X_test)
acc = accuracy_score(y_test, y_pred)

metrics["ECG_model_accuracy"] = round(acc, 4)
print(f"✅ ECG Model trained (Accuracy: {acc:.4f})")

joblib.dump(ecg_model, ECG_MODEL_PATH)

# ======================================================
# 💬 TRAIN CHATBOT MODEL (RETRIEVAL-BASED)
# ======================================================
print("\n💬 Preparing Chatbot data (Retrieval-Based)...")

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

qa_files = [
    "sleep-dev.csv", "sleep-train.csv", "sleep-test.csv",
    "open_questions.csv", "pipeline1_open.csv", "pipeline2_open.csv",
    "p1_p2_compare.csv", "p1_p2_final.csv", "label_agreement.csv", "model_agreement.csv"
]

qa_data = []

for file in qa_files:
    path = os.path.join(DATA_DIR, file)
    if not os.path.exists(path):
        continue

    try:
        df = pd.read_csv(path)
    except pd.errors.ParserError:
        df = pd.read_csv(path, on_bad_lines="skip", sep=None, engine="python")

    if df.shape[1] < 2:
        continue

    qa_data.append(df)

if len(qa_data) == 0:
    raise FileNotFoundError("No valid chatbot datasets found in data/")

qa_df = pd.concat(qa_data, axis=0, ignore_index=True)

# Identify question and answer columns
possible_q_cols = [c for c in qa_df.columns if "question" in c.lower() or "prompt" in c.lower()]
possible_a_cols = [c for c in qa_df.columns if "answer" in c.lower() or "response" in c.lower() or "text" in c.lower()]

if not possible_q_cols or not possible_a_cols:
    qa_df = qa_df.iloc[:, :2]
    qa_df.columns = ["question", "answer"]
else:
    question_col = possible_q_cols[0]
    answer_col = possible_a_cols[0]
    qa_df = qa_df[[question_col, answer_col]].rename(columns={question_col: "question", answer_col: "answer"})

qa_df = qa_df.dropna().reset_index(drop=True)

# Build TF-IDF model
vectorizer = TfidfVectorizer(max_features=5000, stop_words="english")
X_vec = vectorizer.fit_transform(qa_df["question"].astype(str))

# Save components
joblib.dump(vectorizer, os.path.join(MODEL_DIR, "chatbot_vectorizer.pkl"))
qa_df.to_csv(os.path.join(MODEL_DIR, "chatbot_qa_pairs.csv"), index=False)

print(f"✅ Chatbot retrieval model trained and saved ({len(qa_df)} Q&A pairs)")
