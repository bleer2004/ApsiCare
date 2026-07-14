# Pipeline de Dados — PsicoCare

## 1. Como os dados saem do smartwatch

O smartwatch **não fala direto com o app**. O fluxo é:

```
smartwatch → Health Connect (Android) → app → backend (AWS Lambda)
```

- O relógio sincroniza automaticamente com o **Health Connect** (banco de saúde nativo do Android)
- O Health Connect só expõe **BPM** — não expõe IBI real (intervalo entre batimentos)
- O app lê os `HeartRateRecord` das últimas 24h e calcula a aproximação:

```
ibi = 60000 / bpm
```

---

## 2. O que o app manda pro backend

```
POST /health
```

```json
{
  "userId": "abc123",
  "samples": [
    { "hr": 72, "ibi": 833.3, "time_s": "2026-07-01T08:00:00Z" },
    { "hr": 75, "ibi": 800.0, "time_s": "2026-07-01T08:05:00Z" },
    { "hr": 68, "ibi": 882.4, "time_s": "2026-07-01T08:10:00Z" },
    { "hr": 80, "ibi": 750.0, "time_s": "2026-07-01T08:15:00Z" }
  ]
}
```

Cada sample tem:
- `hr` — batimentos por minuto (vem direto do Health Connect)
- `ibi` — intervalo entre batimentos em ms (calculado: 60000/hr)
- `time_s` — timestamp da medição

---

## 3. O que o backend calcula

A partir dos samples, o backend calcula:

**RMSSD** — raiz quadrada da média das diferenças ao quadrado entre IBIs consecutivos:
1. Pega a lista de IBIs: `[833, 800, 882, 750]`
2. Calcula diferenças consecutivas: `[-33, +82, -132]`
3. Eleva ao quadrado: `[1089, 6724, 17424]`
4. Tira a média: `8412`
5. Raiz quadrada: `≈ 91.7 ms`

RMSSD alto = coração variando bastante = relaxamento (parassimpático ativo)
RMSSD baixo = pouca variação = stress (simpático ativo)

**Stress fisiológico** (0 a 1):
```
sf = 0.40 × hr_normalizado + 0.40 × ibi_normalizado + 0.20 × rmssd_normalizado
```

**Stress subjetivo** (0 a 1) — vem do humor do diário do paciente (emoji + slider):
```
ss = 1 - (emotionalScore / 100)
```

**Divergência:**
```
divergência = sf - ss
```

---

## 4. Labels — o que vamos usar e por quê

### O problema com os labels do WESAD
O WESAD tem labels (`baseline`, `stress`, `amusement`, `meditation`) porque pesquisadores induziram stress num laboratório controlado (Trier Social Stress Test) e rotularam manualmente. Não tem fórmula que gere esses labels — vieram do protocolo. Nos dados reais do relógio, esse protocolo não existe.

### Os labels que usaremos

Em vez de replicar o WESAD, usamos labels clínicos baseados na **divergência** entre stress fisiológico e subjetivo:

| Label | Condição | Significado clínico |
|---|---|---|
| `anxiety_risk` | divergência ≥ +0.3 | corpo estressado, paciente não percebe |
| `overreported` | divergência ≤ −0.3 | paciente sente mais do que o corpo mostra |
| `aligned` | entre −0.3 e +0.3 | percepção alinhada com fisiologia |

Esses labels são mais úteis pro psicólogo do que os do WESAD.

### Por que esses thresholds? (referência científica)

O threshold do stress fisiológico será baseado em valores absolutos de RMSSD, conforme **Shaffer & Ginsberg (2017)**:

| RMSSD | Interpretação |
|---|---|
| > 40 ms | relaxamento / parassimpático ativo |
| 20–40 ms | moderado |
| < 20 ms | stress significativo / supressão autonômica |

Referência: Shaffer, F. & Ginsberg, J.P. (2017). *An Overview of Heart Rate Variability Metrics and Norms*. Frontiers in Public Health, 5, 258.

### Para o LLM

O input do LLM serão os números calculados:
```json
{
  "perfil": "hiperreativo",
  "flag": "anxiety_risk",
  "divergencia": 0.42,
  "hr_mean": 94,
  "rmssd": 18,
  "stress_physio": 0.71,
  "stress_subj": 0.29
}
```

O output será o texto clínico do insight — substituindo os textos fixos que existem hoje no código.
