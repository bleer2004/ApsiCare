#wesad_exploration
import pickle
import os
import numpy as np
import pandas as pd

# data path
DATA_PATH = r"C:\Users\eduar\OneDrive\Desktop\maua26\TCC-Códigos\Git-TCC\PsicoCare\dataset\WESAD"
# carregamos 5 sujeito para a amostra
subjects = ["S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10","S11","S12","S13","S14","S15","S16","S17"]

rows = []

for subject in subjects:
    file = os.path.join(DATA_PATH, subject, f"{subject}.pkl")
    with open(file, "rb") as f:
        data = pickle.load(f, encoding="latin1")
    for device, signals in data['signal'].items():
        if device != 'wrist':
            continue
        for signal_name, values in signals.items():
            shape = np.array(values).shape
            rows.append({
                "subject": subject,
                "device": device,
                "signal": signal_name,
                "shape": str(shape),
                "n_samples": shape[0],
                "n_axes": shape[1] if len(shape) > 1 else 1
            })

    labels = data['label']
    rows.append({
        "subject": subject,
        "device": "label",
        "signal": "label",
        "shape": str(labels.shape),
        "n_samples": labels.shape[0],
        "n_axes": 1
    })

df = pd.DataFrame(rows)
df.to_csv("wesad_wrist_metadata.csv", index=False)
print(df)
