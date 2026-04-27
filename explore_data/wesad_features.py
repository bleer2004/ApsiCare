import pickle
import os
import numpy as np
import pandas as pd
from pathlib import Path
from scipy.signal import find_peaks

#----------------
# CONFIG
DATA_PATH   = r"C:\Users\eduar\OneDrive\Desktop\maua26\TCC-Códigos\Git-TCC\PsicoCare\dataset\WESAD"
OUTPUT_PATH = Path("explore_hr")
OUTPUT_PATH.mkdir(exist_ok=True)

subjects = ["S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S13","S14","S15","S16","S17"]

RATES      = {"ACC": 32, "BVP": 64, "EDA": 4, "TEMP": 4}
LABEL_RATE = 700
TARGET_RATE = 4  # Hz final para sinais lentos

LABEL_NAMES   = {0: "transicao", 1: "baseline", 2: "stress", 3: "amusement", 4: "meditation"}
LABELS_VALIDOS = {"baseline", "stress", "amusement", "meditation"}

#--------------------------
# FUNÇÕES AUXILIARES
# reduz freq do sinal
def downsample(arr, original_rate, target_rate):
    step = original_rate // target_rate
    return arr[::step]


def bvp_to_ibi_hr(bvp_signal, fs=64):
    """
    Deriva IBI e HR a partir do sinal BVP bruto (64Hz).
    OBS: 
        no bvp, peak é o batimento (ponto mais alto da onda)
        hr é batimento por minuto
        ibi é o intervalo entre os batimentos(peak)

    Estratégia:
      1. Detecta picos sistólicos no BVP via find_peaks
      2. IBI[i] = tempo entre pico i e pico i+1 (em ms)
      3. HR[i]  = 60000 / IBI[i]  (bpm)
    
    Retorna arrays alinhados ao tempo original (64Hz),
    preenchendo com NaN onde não há pico precedente.
    """
    bvp = np.array(bvp_signal, dtype=float)

    # detecta picos — distância mínima de 0.4s = 24 amostras a 64Hz (≈150bpm max)
    peaks, _ = find_peaks(bvp, distance=int(fs * 0.4))

    # arrays de saída inicializados com NaN
    ibi_arr = np.full(len(bvp), np.nan)
    hr_arr  = np.full(len(bvp), np.nan)

#calcula o hr (batimentos por minuto)
    for i in range(1, len(peaks)):
        ibi_ms = (peaks[i] - peaks[i - 1]) / fs * 1000  # ms
        hr_bpm = 60_000 / ibi_ms

        # filtra IBIs fisiologicamente plausíveis (40–200 bpm)
        if 300 < ibi_ms < 1500:
            # propaga o valor do intervalo inteiro entre picos
            ibi_arr[peaks[i - 1]:peaks[i]] = ibi_ms
            hr_arr[peaks[i - 1]:peaks[i]]  = hr_bpm

    return ibi_arr, hr_arr

#calcula o hrv usando rmssd
def ibi_to_hrv_rmssd(ibi_array_ms):

    """
    RMSSD simples: raiz quadrada da média dos quadrados
    das diferenças sucessivas de IBI (em ms).

    é usado pra medir se o IBI muda muito
    Como?
    1. pega diferenças entre IBIs consecutivos
    2. eleva ao quadrado
    3. tira média
    4. tira raiz (volta pra ms)

    Só considera valores não-NaN.
    """
    valid = ibi_array_ms[~np.isnan(ibi_array_ms)]
    if len(valid) < 2:
        return np.nan
    diffs = np.diff(valid)
    return np.sqrt(np.mean(diffs ** 2))


# ----------------
# LOOP PRINCIPAL

all_subjects   = []
resumo_rows    = []
hrv_stats_rows = []

for subject in subjects:
    file = os.path.join(DATA_PATH, subject, f"{subject}.pkl")
    with open(file, "rb") as f:
        data = pickle.load(f, encoding="latin1")

    wrist     = data["signal"]["wrist"]
    label_raw = data["label"]

    # ── 1. Label → 4Hz ──────────────────────────────
    label_ds = downsample(label_raw, LABEL_RATE, TARGET_RATE)

    # ── 2. Sinais lentos → 4Hz ───────────────────────
    signals_ds = {}
    for sig, rate in RATES.items():
        if sig == "BVP":
            continue  # BVP tratado separado (64Hz)
        arr = np.array(wrist[sig])
        ds  = downsample(arr, rate, TARGET_RATE)
        signals_ds[sig] = ds if ds.ndim == 1 else np.linalg.norm(ds, axis=1)

    # ── 3. BVP → IBI e HR (64Hz) → depois → 4Hz ─────
    bvp_raw        = np.array(wrist["BVP"]).flatten()
    ibi_64, hr_64  = bvp_to_ibi_hr(bvp_raw, fs=64)

    # downsample IBI e HR de 64Hz → 4Hz (média da janela em vez de pular)
    step = 64 // TARGET_RATE  # = 16 amostras por bloco
    n_blocks = len(ibi_64) // step
    ibi_4hz = np.array([np.nanmean(ibi_64[i*step:(i+1)*step]) for i in range(n_blocks)])
    hr_4hz  = np.array([np.nanmean(hr_64[i*step:(i+1)*step])  for i in range(n_blocks)])

    # BVP bruto → 4Hz (simples skip, para manter coluna de referência)
    bvp_ds = downsample(bvp_raw, 64, TARGET_RATE)

    # ── 4. Iguala tamanhos ───────────────────────────
    min_len = min(
        len(label_ds),
        len(signals_ds["EDA"]),
        len(signals_ds["TEMP"]),
        len(signals_ds["ACC"]),
        len(bvp_ds),
        len(ibi_4hz),
        len(hr_4hz),
    )

    # ── 5. Monta DataFrame ───────────────────────────
    df_subj = pd.DataFrame({
        "subject":    subject,
        "time_s":     np.arange(min_len) / TARGET_RATE,
        "label":      label_ds[:min_len],
        "label_nome": [LABEL_NAMES.get(int(l), "?") for l in label_ds[:min_len]],
        # sinais equivalentes ao Samsung Watch 7
        "HR":         hr_4hz[:min_len],       # bpm  (derivado)
        "IBI":        ibi_4hz[:min_len],      # ms   (derivado)
        "BVP":        bvp_ds[:min_len],       # raw  (direto)
        "TEMP":       signals_ds["TEMP"][:min_len],
        "ACC_mag":    signals_ds["ACC"][:min_len],
        # mantém EDA para análise interna (Watch 7 não tem)
        "EDA":        signals_ds["EDA"][:min_len],
    })

    # filtra labels inválidos
    df_subj = df_subj[df_subj["label_nome"].isin(LABELS_VALIDOS)].reset_index(drop=True)
    all_subjects.append(df_subj)

    # ── 6. Estatísticas por label ────────────────────
    print(f"\n{'='*55}")
    print(f"  {subject}  —  {len(df_subj)} amostras válidas ({len(df_subj)/TARGET_RATE/60:.1f} min)")
    print(f"{'='*55}")

    stats_cols = ["HR", "IBI", "TEMP", "ACC_mag", "EDA"]
    for label in ["baseline", "stress", "amusement", "meditation"]:
        mask = df_subj["label_nome"] == label
        if mask.sum() == 0:
            continue
        seg = df_subj[mask]
        print(f"\n  [{label.upper()}]  {mask.sum()} amostras  ({mask.sum()/TARGET_RATE/60:.1f} min)")
        for col in stats_cols:
            vals = seg[col].dropna()
            if len(vals) == 0:
                continue
            print(f"    {col:<8}  média={vals.mean():.2f}  std={vals.std():.2f}"
                  f"  min={vals.min():.2f}  max={vals.max():.2f}")

        # HRV RMSSD do segmento
        rmssd = ibi_to_hrv_rmssd(seg["IBI"].values)
        hrv_stats_rows.append({
            "subject": subject,
            "label":   label,
            "n_amostras": mask.sum(),
            "HR_mean":  seg["HR"].mean(),
            "HR_std":   seg["HR"].std(),
            "IBI_mean": seg["IBI"].mean(),
            "RMSSD":    rmssd,
            "TEMP_mean":seg["TEMP"].mean(),
            "EDA_mean": seg["EDA"].mean(),
        })
        print(f"    {'HRV_RMSSD':<8}  {rmssd:.2f} ms")

    # resumo geral por sujeito
    row = {"subject": subject, "total_min": round(len(df_subj)/TARGET_RATE/60, 1)}
    for nome in LABELS_VALIDOS:
        qtd = (df_subj["label_nome"] == nome).sum()
        row[f"min_{nome}"] = round(qtd/TARGET_RATE/60, 1)
    resumo_rows.append(row)

# ─────────────────────────────────────────────
# SALVA OUTPUTS
# ─────────────────────────────────────────────

df_all = pd.concat(all_subjects, ignore_index=True)
df_all.to_csv(OUTPUT_PATH / "wesad_samsung_signals.csv", index=False)

df_hrv = pd.DataFrame(hrv_stats_rows)
df_hrv.to_csv(OUTPUT_PATH / "wesad_hrv_stats_by_label.csv", index=False)

df_resumo = pd.DataFrame(resumo_rows)
df_resumo.to_csv(OUTPUT_PATH / "wesad_resumo_subjects.csv", index=False)

# ── Resumo final no terminal ─────────────────
print(f"\n{'='*55}")
print(f"  DATASET COMPLETO  —  shape: {df_all.shape}")
print(f"{'='*55}")
print(df_all["label_nome"].value_counts().rename("amostras").to_string())

print(f"\n\n  MÉDIAS GLOBAIS POR LABEL (todos os sujeitos)")
print(f"  {'-'*50}")
for label in ["baseline", "stress", "amusement", "meditation"]:
    seg = df_all[df_all["label_nome"] == label]
    print(f"\n  [{label.upper()}]")
    for col in ["HR", "IBI", "TEMP", "ACC_mag", "EDA"]:
        vals = seg[col].dropna()
        print(f"    {col:<8}  média={vals.mean():.2f}  std={vals.std():.2f}")
    rmssd_global = ibi_to_hrv_rmssd(seg["IBI"].values)
    print(f"    {'RMSSD':<8}  {rmssd_global:.2f} ms")

print(f"\n\nOutputs salvos em: {OUTPUT_PATH.resolve()}")
print("  → wesad_samsung_signals.csv      (dataset completo)")
print("  → wesad_hrv_stats_by_label.csv   (stats HRV por label/sujeito)")
print("  → wesad_resumo_subjects.csv      (resumo por sujeito)")