import pickle
import os
import numpy as np
import pandas as pd
from pathlib import Path

DATA_PATH = r"C:\Users\eduar\OneDrive\Desktop\maua26\TCC-Códigos\Git-TCC\PsicoCare\dataset\WESAD"
OUTPUT_PATH = Path("explore_data")
OUTPUT_PATH.mkdir(exist_ok=True)

#s12 excluido pelos pesquisadores originais porque estava corropido
subjects = ["S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S13","S14","S15","S16","S17"]

#Hz de cada frequência
RATES = {"ACC": 32, "BVP": 64, "EDA": 4, "TEMP": 4}
#hz de cada sinal
LABEL_RATE = 700
#queremos padronizar para 4hz
TARGET_RATE = 4

#numero em texto
LABEL_NAMES = {0: "transicao", 1: "baseline", 2: "stress", 3: "amusement", 4: "meditation"}

# labels transicao(0) e desconhecidos(?) são descartados
# porque o estado emocional real nesses momentos é whatever
LABELS_VALIDOS = {"baseline", "stress", "amusement", "meditation"}

def downsample(arr, original_rate, target_rate):
    #calcula de quanto em quanto pular
    step = original_rate // target_rate
    #pega um a cada step vezes
    return arr[::step]

#guarda todo dataframe
all_subjects = []

#loop por pessoa
for subject in subjects:
    #monta o caminho do arquivo
    file = os.path.join(DATA_PATH, subject, f"{subject}.pkl")
    with open(file, "rb") as f:
        #abre o pkl
        data = pickle.load(f, encoding="latin1")

    #pega sinal do smartwatch e a label original (700Hz)
    wrist     = data["signal"]["wrist"]
    label_raw = data["label"]                    # (N,) a 700 Hz

    #desce a label 700Hz → 4Hz
    label_ds = downsample(label_raw, LABEL_RATE, TARGET_RATE)

    signals_ds = {} #dic vazio
    for sig, rate in RATES.items(): #loop nos sinais
        arr = np.array(wrist[sig]) #transforma em array
        ds  = downsample(arr, rate, TARGET_RATE) #reduz pra 4 hz
        if ds.ndim == 1: #trata os sinais simples(EDA, TEMP, BVP)
            signals_ds[sig] = ds
        else: #trata o acc (x,y,z)
            signals_ds[sig] = np.linalg.norm(ds, axis=1)  # ACC → magnitude

    #iguala os tamanhos
    min_len = min(len(label_ds), *(len(v) for v in signals_ds.values()))

    #cria o dataframe
    df_subj = pd.DataFrame({
        "subject":    subject, #id pessoa
        "time_s":     np.arange(min_len) / TARGET_RATE, #tempo em seg
        "label":      label_ds[:min_len], #label numerico
        "label_nome": [LABEL_NAMES.get(int(l), "?") for l in label_ds[:min_len]],
        "EDA":        signals_ds["EDA"][:min_len], #labels em texto |
        "TEMP":       signals_ds["TEMP"][:min_len],
        "BVP":        signals_ds["BVP"][:min_len],
        "ACC_mag":    signals_ds["ACC"][:min_len],
    })

# filtro ANTES do append que remove transicao e ?
    antes = len(df_subj)
    df_subj = df_subj[df_subj["label_nome"].isin(LABELS_VALIDOS)].reset_index(drop=True)
    descartados = antes - len(df_subj)

    # append só uma vez com o filtro aplicado
    all_subjects.append(df_subj)

    print(f"\n{subject} → {len(df_subj)} amostras válidas ({len(df_subj)/TARGET_RATE/60:.1f} min) | descartados: {descartados}")
    for nome, qtd in df_subj["label_nome"].value_counts().items():
        print(f"  {nome:<12} {qtd:>6} amostras  ({qtd/TARGET_RATE/60:.1f} min)")

#  df_all criado aqui, depois do loop
df_all = pd.concat(all_subjects, ignore_index=True)

df_all.to_csv(OUTPUT_PATH / "wesad_wrist_aligned.csv", index=False)
print(f"\nSalvo em explore_data/wesad_wrist_aligned.csv")
print(f"Shape final: {df_all.shape}")
print(f"\nDistribuição geral:")
print(df_all["label_nome"].value_counts())

# resumo por sujeito
resumo_rows = []

for subject in subjects:
    df_s = df_all[df_all["subject"] == subject]
    total = len(df_s)
    row = {
        "subject":        subject,
        "total_amostras": total,
        "total_min":      round(total / TARGET_RATE / 60, 1)
    }
    for nome in LABEL_NAMES.values():
        qtd = (df_s["label_nome"] == nome).sum()
        row[f"min_{nome}"] = round(qtd / TARGET_RATE / 60, 1)
    resumo_rows.append(row)

df_resumo = pd.DataFrame(resumo_rows)
df_resumo.to_csv(OUTPUT_PATH / "wesad_resumo_subjects.csv", index=False)
print("\nResumo salvo em explore_data/wesad_resumo_subjects.csv")
print(df_resumo.to_string(index=False))