import pandas as pd

# carregar o dataset
df = pd.read_csv("explore_data/features/wesad_hrv_stats_by_label.csv")

# usar apenas baseline e stress
baseline = df[df["label"] == "baseline"]
stress = df[df["label"] == "stress"]

# unir dados pelo subject
merged = baseline.merge(
    stress,
    on="subject",
    suffixes=("_baseline", "_stress")
)

# calcular deltas
merged["delta_HR"] = (
    merged["HR_mean_stress"] -
    merged["HR_mean_baseline"]
)

merged["delta_IBI"] = (
    merged["IBI_mean_stress"] -
    merged["IBI_mean_baseline"]
)

merged["delta_RMSSD"] = (
    merged["RMSSD_stress"] -
    merged["RMSSD_baseline"]
)

# classificando perfis
def classificar_perfil(row):

    # HIPERREATIVO
    if (
        row["delta_HR"] > 35 and
        row["delta_IBI"] < -250 and
        abs(row["delta_RMSSD"]) < 10
    ):
        return "hiperreativo"

    # DISSOCIATIVO
    elif (
        row["delta_HR"] > 40 and
        row["delta_IBI"] < -300 and
        row["delta_RMSSD"] < -20
    ):
        return "dissociativo"

    # NEUTRO
    elif (
        row["delta_HR"] > 25 and
        row["delta_IBI"] < -200 and
        row["delta_RMSSD"] > 0
    ):
        return "neutro"

    else:
        return "outro"

merged["perfil"] = merged.apply(
    classificar_perfil,
    axis=1
)

# mostrar resultados
resultado = merged[
    [
        "subject",
        "delta_HR",
        "delta_IBI",
        "delta_RMSSD",
        "perfil"
    ]
]

print(resultado)

# usar s14, s16 e s17
perfis_escolhidos = resultado[
    resultado["subject"].isin(["S14", "S16", "S17"])
]

print("\nPerfis escolhidos:\n")
print(perfis_escolhidos)

# output
perfis_escolhidos.to_csv(
    "explore_nps/wesad_profiles.csv",
    index=False
)