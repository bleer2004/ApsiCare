import numpy as np
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta

# caminhos
PROFILES_PATH = Path("explore_nps/wesad_profiles.csv")
FISIO_PATH    = Path("explore_data/features/wesad_hrv_stats_by_label.csv")
OUTPUT_PATH   = Path("explore_nps")

# será a mesma sequência sempre
np.random.seed(42)

# sujeitos
SUJEITOS = ["S14", "S16", "S17"]

# horário fixo definido pelo terapeuta (pode alterar)
THERAPIST_TIME = "14:00"

# número de dias simulados
N_DAYS = 5

# primeiro dia da simulação
BASE_DATE = datetime(2025, 1, 13)

# ─────────────────────────────────────────────
# MAPEAMENTO HORA → CONDIÇÃO WESAD
# define qual fisiológico usar em cada momento do dia
# ─────────────────────────────────────────────
def hora_para_label(hora: int) -> str:
    if 7 <= hora <= 9:
        return "baseline"
    elif 10 <= hora <= 17:
        return "stress"
    elif 18 <= hora <= 20:
        return "amusement"
    else:
        return "meditation"

# EMOJIS
# 😊 bem=5 | 😐 neutro=4 | 😶 entorpecido=3 | 😟 ansioso=2 | 😔 triste=1
EMOJIS     = ["😊", "😐", "😶", "😟", "😔"]
EMOJI_VALS = {"😊": 5, "😐": 4, "😶": 3, "😟": 2, "😔": 1}

# probabilidades por [label][perfil] na ordem: 😊 😐 😶 😟 😔
EMOJI_PROBS = {
    "baseline": {
        "hiperreativo": [0.10, 0.20, 0.25, 0.30, 0.15],
        "dissociativo": [0.20, 0.30, 0.35, 0.10, 0.05],
        "neutro":       [0.30, 0.40, 0.15, 0.10, 0.05],
    },
    "stress": {
        "hiperreativo": [0.02, 0.08, 0.10, 0.40, 0.40],  # sofrimento intenso
        "dissociativo": [0.15, 0.25, 0.40, 0.15, 0.05],  # entorpecimento → anxiety_risk
        "neutro":       [0.05, 0.20, 0.20, 0.35, 0.20],
    },
    "amusement": {
        "hiperreativo": [0.25, 0.30, 0.20, 0.15, 0.10],
        "dissociativo": [0.30, 0.30, 0.28, 0.08, 0.04],
        "neutro":       [0.45, 0.35, 0.10, 0.07, 0.03],
    },
    "meditation": {
        "hiperreativo": [0.15, 0.25, 0.25, 0.20, 0.15],
        "dissociativo": [0.20, 0.30, 0.35, 0.10, 0.05],
        "neutro":       [0.25, 0.40, 0.20, 0.10, 0.05],
    },
}

# ---- DICIONÁRIO DE REGRAS
# HUMOR 1–10
HUMOR_PARAMS = {
    "baseline":   {"hiperreativo": (4.5, 2.0), "dissociativo": (5.5, 1.0), "neutro": (6.5, 1.2)},
    "stress":     {"hiperreativo": (2.0, 1.2), "dissociativo": (5.0, 1.2), "neutro": (3.8, 1.5)},
    #“se a pessoa está em stress e é hiperreativa, o humor dela gira em torno de 2
    "amusement":  {"hiperreativo": (5.5, 1.5), "dissociativo": (6.0, 1.0), "neutro": (7.5, 1.0)},
    "meditation": {"hiperreativo": (4.0, 1.8), "dissociativo": (5.5, 1.0), "neutro": (6.5, 1.0)},
}

# IMPACTO 1–5
#“o quanto esse momento afetou a pessoa”
IMPACTO_PARAMS = {
    "baseline":   {"hiperreativo": (3.5, 1.0), "dissociativo": (2.0, 0.8), "neutro": (2.0, 1.0)},
    "stress":     {"hiperreativo": (4.8, 0.5), "dissociativo": (2.5, 1.0), "neutro": (3.8, 1.0)},
    "amusement":  {"hiperreativo": (2.5, 1.2), "dissociativo": (1.8, 0.7), "neutro": (1.8, 0.8)},
    "meditation": {"hiperreativo": (3.0, 1.2), "dissociativo": (2.0, 0.8), "neutro": (2.0, 0.8)},
}

# ---- CONTEXTO
CONTEXTOS = [
    "working/studying",
    "commuting",
    "socializing",
    "resting/leisure",
    "exercising",
]

PESO_CONTEXTO = {
    "exercising":       0.8,
    "working/studying": 0.3,
    "commuting":        0.2,
    "socializing":      0.1,
    "resting/leisure":  0.0,
}

# % de cada contexto aparecer nos status
CONTEXTO_PROBS = {
    "baseline":   [0.20, 0.10, 0.15, 0.45, 0.10],
    "stress":     [0.55, 0.20, 0.10, 0.10, 0.05],
    "amusement":  [0.10, 0.10, 0.40, 0.35, 0.05],
    "meditation": [0.10, 0.05, 0.10, 0.65, 0.10],
}

# ─────────────────────────────────────────────
# FUNÇÕES DE CÁLCULO
# ─────────────────────────────────────────────

# transforma qualquer valor em escala de 0 a 1
def normaliza(val, vmin, vmax):
    return float(np.clip((val - vmin) / (vmax - vmin), 0.0, 1.0))

# stress fisiológico
def calc_stress_physio(hr, ibi, rmssd, hr_min, hr_max, ibi_min, ibi_max, rmssd_min, rmssd_max):
    hr_n    = normaliza(hr,    hr_min,    hr_max)
    ibi_n   = 1 - normaliza(ibi,   ibi_min,   ibi_max)   # invertido: IBI alto = calmo
    rmssd_n = normaliza(rmssd, rmssd_min, rmssd_max)
    return round(0.40 * hr_n + 0.40 * ibi_n + 0.20 * rmssd_n, 4)

def calc_stress_subj(humor, emoji_val, impacto):
    h = 1 - normaliza(humor,     1, 10)   # humor invertido: 10=bem → stress baixo
    e = 1 - normaliza(emoji_val, 1,  5)   # emoji invertido: 5=😊 → stress baixo
    i = normaliza(impacto,       1,  5)   # impacto direto: 5=muito afetado
    return round(0.40 * h + 0.35 * e + 0.25 * i, 4)

# ─────────────────────────────────────────────
# FUNÇÕES DE GERAÇÃO
# ─────────────────────────────────────────────
def gera_humor(label, perfil):
    mu, sigma = HUMOR_PARAMS[label][perfil]
    return int(np.clip(round(np.random.normal(mu, sigma)), 1, 10))

def gera_emoji(label, perfil):
    probs = EMOJI_PROBS[label][perfil]
    emoji = np.random.choice(EMOJIS, p=probs)
    return emoji, EMOJI_VALS[emoji]

def gera_impacto(label, perfil):
    mu, sigma = IMPACTO_PARAMS[label][perfil]
    return int(np.clip(round(np.random.normal(mu, sigma)), 1, 5))

def gera_contexto(label):
    ctx  = np.random.choice(CONTEXTOS, p=CONTEXTO_PROBS[label])
    peso = PESO_CONTEXTO[ctx]
    return ctx, peso


def gera_ruido_fisio(fisio_base: dict, seed_day: int) -> dict:
    """
    Adiciona ruído gaussiano pequeno aos sinais fisiológicos
    para simular variação natural entre os dias.
    Ruído: ±3% do valor base.
    """
    rng = np.random.default_rng(seed_day)
    return {
        "HR":   round(fisio_base["HR"]   * rng.normal(1.0, 0.03), 2),
        #média é 1, variação 0.03
        "IBI":  round(fisio_base["IBI"]  * rng.normal(1.0, 0.03), 2),
        "RMSSD":round(fisio_base["RMSSD"]* rng.normal(1.0, 0.03), 2),
        "TEMP": round(fisio_base["TEMP"] * rng.normal(1.0, 0.01), 2),
    }

def gera_insight(perfil, label, divergence, flag):
    hora_label = {
        "baseline":   "manhã",
        "stress":     "tarde",
        "amusement":  "fim da tarde",
        "meditation": "noite",
    }
    momento = hora_label[label]

    if flag == "anxiety_risk":
        if perfil == "dissociativo":
            return f"[{momento}] Alto estresse fisiológico detectado, mas baixo relato subjetivo: possível padrão de ansiedade dissociativa."
        else:
            return f"[{momento}] O corpo apresentou sinais elevados de estresse, enquanto o relato subjetivo foi baixo: possível ansiedade não reconhecida."
    elif flag == "overreported":
        if perfil == "hiperreativo":
            return f"[{momento}] O sofrimento subjetivo excedeu a resposta fisiológica: padrão de ansiedade hiperreativa."
        else:
            return f"[{momento}] O estresse relatado foi maior do que os sinais fisiológicos: possível ansiedade antecipatória."
    else:
        return f"[{momento}] A percepção está alinhada com o estado fisiológico."

# ─────────────────────────────────────────────
# LEITURA DOS DADOS
# ─────────────────────────────────────────────
df_fisio    = pd.read_csv(FISIO_PATH)
df_profiles = pd.read_csv(PROFILES_PATH)

df_fisio    = df_fisio[df_fisio["subject"].isin(SUJEITOS)]
df_profiles = df_profiles[df_profiles["subject"].isin(SUJEITOS)]

# normalização global com base nos 3 sujeitos
HR_MIN,    HR_MAX    = df_fisio["HR_mean"].min(),  df_fisio["HR_mean"].max()
IBI_MIN,   IBI_MAX   = df_fisio["IBI_mean"].min(), df_fisio["IBI_mean"].max()
RMSSD_MIN, RMSSD_MAX = df_fisio["RMSSD"].min(),    df_fisio["RMSSD"].max()

# dicionário fisiológico: subject → label → valores base
fisio_dict = {}
for _, row in df_fisio.iterrows():
    s, l = row["subject"], row["label"]
    if s not in fisio_dict:
        fisio_dict[s] = {}
    fisio_dict[s][l] = {
        "HR":   row["HR_mean"],
        "IBI":  row["IBI_mean"],
        "RMSSD":row["RMSSD"],
        "TEMP": row["TEMP_mean"],
    }

# dicionário de perfis: subject → perfil
perfil_dict = dict(zip(df_profiles["subject"], df_profiles["perfil"]))


# GERAÇÃO DOS 5 DIAS
hora_fixa = int(THERAPIST_TIME.split(":")[0])
rows      = []

for day_offset in range(N_DAYS):
    current_date = BASE_DATE + timedelta(days=day_offset)
    label        = hora_para_label(hora_fixa)

    for subject in SUJEITOS:
        perfil     = perfil_dict.get(subject, "neutro")
        fisio_base = fisio_dict[subject][label]

        # ruído diário — seed único por sujeito+dia para reprodutibilidade
        seed_day = day_offset * 100 + SUJEITOS.index(subject)
        fisio    = gera_ruido_fisio(fisio_base, seed_day)

        # fisiológico
        sf = calc_stress_physio(
            fisio["HR"], fisio["IBI"], fisio["RMSSD"],
            HR_MIN, HR_MAX, IBI_MIN, IBI_MAX, RMSSD_MIN, RMSSD_MAX
        )

        # subjetivo sintético
        humor            = gera_humor(label, perfil)
        emoji, emoji_val = gera_emoji(label, perfil)
        impacto          = gera_impacto(label, perfil)
        contexto, peso   = gera_contexto(label)

        ss = calc_stress_subj(humor, emoji_val, impacto)

        # DIVERGÊNCIA
        sf_adj     = round(sf * (1 - peso), 4)
        divergence = round(sf_adj - ss, 4)

        if divergence >= 0.3:
            flag = "anxiety_risk"
        elif divergence <= -0.3:
            flag = "overreported"
        else:
            flag = "aligned"

        insight = gera_insight(perfil, label, divergence, flag)

        rows.append({
            "day":              day_offset + 1,
            "subject":          subject,
            "profile":          perfil,
            "timestamp":        current_date.replace(hour=hora_fixa, minute=0).strftime("%Y-%m-%d %H:%M"),
            "notification":     "therapist_scheduled",
            "physio_reference": label,
            "HR":               fisio["HR"],
            "IBI":              fisio["IBI"],
            "RMSSD":            fisio["RMSSD"],
            "TEMP":             fisio["TEMP"],
            "mood":             humor,
            "emotion_emoji":    emoji,
            "emotion_value":    emoji_val,
            "impact":           impacto,
            "context":          contexto,
            "context_weight":   peso,
            "stress_physio":    sf,
            "stress_subj":      ss,
            "stress_physio_adj":sf_adj,
            "divergence":       divergence,
            "flag":             flag,
            "insight":          insight,
        })

# salva CSV completo
df_out = pd.DataFrame(rows)
df_out.to_csv(OUTPUT_PATH / "subjective_5days.csv", index=False)

# RELATÓRIO DOS 5 DIAS
print(f"\n{'='*65}")
print(f"  WEEKLY ANXIETY REPORT — {N_DAYS} dias")
print(f"  Período: {BASE_DATE.strftime('%d/%m/%Y')} a {(BASE_DATE + timedelta(days=N_DAYS-1)).strftime('%d/%m/%Y')}")
print(f"  Horário da notificação: {THERAPIST_TIME}")
print(f"{'='*65}")

for subject in SUJEITOS:
    df_s   = df_out[df_out["subject"] == subject]
    perfil = perfil_dict[subject]

    flags  = df_s["flag"].tolist()
    divs   = df_s["divergence"].tolist()
    total  = len(flags)

    avg_div  = round(sum(divs) / total, 3)
    dom_flag = max(set(flags), key=flags.count)

    pct_risk  = round(flags.count("anxiety_risk") / total * 100)
    pct_over  = round(flags.count("overreported") / total * 100)
    pct_align = round(flags.count("aligned")      / total * 100)

    print(f"\n  {'─'*55}")
    print(f"  {subject} — perfil: {perfil.upper()}")
    print(f"  {'─'*55}")
    print(f"  Respostas no período:    {total}")
    print(f"  Divergência média:       {avg_div:+.3f}")
    print(f"  Classificação dominante: {dom_flag}")
    print(f"  Alinhado:                {pct_align}%")
    print(f"  Risco de ansiedade:      {pct_risk}%")
    print(f"  Overreported:            {pct_over}%")

    print(f"\n  Detalhamento por dia:")
    for _, row in df_s.iterrows():
        print(f"    Dia {int(row['day'])} [{row['timestamp']}]  divergência: {row['divergence']:+.3f}  →  {row['flag']}")
        print(f"      {row['insight']}")

print(f"\n{'='*65}")
print(f"  Salvo: explore_nps/subjective_5days.csv")
print(f"{'='*65}\n")