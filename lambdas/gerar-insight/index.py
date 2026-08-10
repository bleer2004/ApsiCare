import json
import math
import os
import urllib.request
import urllib.error
import boto3
from datetime import datetime, timedelta
from boto3.dynamodb.conditions import Key

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL   = "meta-llama/llama-3.1-8b-instruct"

SYSTEM_PROMPT = """Você é um analisador de bem-estar emocional clínico.
Analise o texto do diário de um paciente em acompanhamento psicológico.
Retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicação."""

def analisar_texto_llm(diary_text):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key or not diary_text:
        return 0.5

    prompt = f"""Analise o texto do diário abaixo e retorne um JSON com exatamente estes campos:
- stress_score: número de 0.0 a 1.0 (0.0 = sem stress, 1.0 = stress máximo)
- sentimento: uma das opções "positivo", "neutro" ou "negativo"
- palavras_chave: lista com até 3 palavras que resumem o estado emocional

Texto do diário: "{diary_text}"

Responda APENAS com o JSON. Exemplo:
{{"stress_score": 0.7, "sentimento": "negativo", "palavras_chave": ["ansiedade", "cansaço", "trabalho"]}}"""

    try:
        payload = json.dumps({
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": prompt},
            ],
            "max_tokens": 120,
            "temperature": 0.1,
        }).encode("utf-8")

        req = urllib.request.Request(
            OPENROUTER_API_URL, data=payload,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read().decode("utf-8"))

        raw = result["choices"][0]["message"]["content"].strip()
        start, end = raw.find("{"), raw.rfind("}") + 1
        parsed = json.loads(raw[start:end])
        score = float(parsed.get("stress_score", 0.5))
        return max(0.0, min(1.0, score))
    except Exception:
        return 0.5

dynamo = boto3.resource("dynamodb", region_name="sa-east-1")
table  = dynamo.Table("ApsiCare")

EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"

def enviar_push(push_token, title, body, data=None):
    if not push_token:
        return {"ok": False}
    try:
        payload = json.dumps({
            "to": push_token, "title": title, "body": body,
            "data": data or {}, "sound": "default", "channelId": "default",
        }).encode("utf-8")
        req = urllib.request.Request(
            EXPO_PUSH_URL, data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode("utf-8"))
        return {"ok": result.get("data", {}).get("status") == "ok"}
    except Exception as e:
        print(f"[push] falha ao enviar: {e}")
        return {"ok": False}

HR_MIN, HR_MAX       = 50, 110
IBI_MIN, IBI_MAX     = 545, 1200
RMSSD_MIN, RMSSD_MAX = 10, 60

PERFIS_WESAD = {
    "S14": "hiperreativo",
    "S16": "dissociativo",
    "S17": "neutro",
}

def normaliza(val, vmin, vmax):
    if vmax == vmin:
        return 0.0
    return max(0.0, min(1.0, (val - vmin) / (vmax - vmin)))

def calc_rmssd(ibis):
    if len(ibis) < 2:
        return 0.0
    diffs = [ibis[i+1] - ibis[i] for i in range(len(ibis)-1)]
    return math.sqrt(sum(d**2 for d in diffs) / len(diffs))

def calc_stress_physio(hr, ibi, rmssd):
    hr_n    = normaliza(hr,    HR_MIN,    HR_MAX)
    ibi_n   = 1 - normaliza(ibi,   IBI_MIN,   IBI_MAX)
    rmssd_n = 1 - normaliza(rmssd, RMSSD_MIN, RMSSD_MAX)
    return round(0.40 * hr_n + 0.40 * ibi_n + 0.20 * rmssd_n, 4)

def calc_stress_subjetivo(pk):
    resp = table.query(
        KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("MOOD#"),
        ScanIndexForward=False,
        Limit=1
    )
    moods = resp.get("Items", [])
    if not moods:
        return 0.30

    data = moods[0].get("data", {})

    # emocao: valence+arousal já ponderados (0-100 → invertido pra stress)
    ss_emocao = 1 - float(data.get("emotionalScore", 50)) / 100

    # humor: moodScore 1-9, alto humor = baixo stress
    mood_score = float(data.get("moodScore") or 5)
    ss_humor = 1 - (mood_score - 1) / 8

    # impacto: impactScore 1-5, alto impacto = alto stress
    impact_score = float(data.get("impactScore") or 3)
    ss_impacto = (impact_score - 1) / 4

    # texto: LLM analisa o diário e devolve score 0-1
    diary_text = data.get("diaryText") or ""
    ss_texto = analisar_texto_llm(diary_text)

    ss = 0.30 * ss_emocao + 0.20 * ss_humor + 0.20 * ss_impacto + 0.30 * ss_texto
    return round(ss, 4)

def hora_para_label(hora):
    if 7 <= hora <= 9:     return "baseline"
    elif 10 <= hora <= 17: return "stress"
    elif 18 <= hora <= 20: return "amusement"
    else:                  return "meditation"

def gerar_insight_fixo(perfil, fase_dia, flag, divergence):
    momento = {
        "baseline":   "manhã",
        "stress":     "tarde",
        "amusement":  "fim da tarde",
        "meditation": "noite"
    }.get(fase_dia, "dia")

    if flag == "anxiety_risk":
        if perfil == "dissociativo":
            return {"title": "Alerta: Ansiedade Dissociativa", "body": f"[{momento}] Alto estresse fisiológico detectado com baixo relato subjetivo — possível padrão de ansiedade dissociativa. Recomenda-se atenção redobrada na próxima sessão.", "category": "stress"}
        elif perfil == "hiperreativo":
            return {"title": "Alerta: Ansiedade Hiperreativa", "body": f"[{momento}] Sinais fisiológicos elevados com sofrimento não reconhecido — padrão hiperreativo identificado. Considere explorar gatilhos recentes.", "category": "stress"}
        else:
            return {"title": "Alerta: Ansiedade Não Reconhecida", "body": f"[{momento}] O corpo apresentou sinais elevados de estresse enquanto o relato subjetivo foi baixo — possível ansiedade não reconhecida.", "category": "stress"}
    elif flag == "overreported":
        if perfil == "hiperreativo":
            return {"title": "Sofrimento Subjetivo Elevado", "body": f"[{momento}] O sofrimento relatado excedeu a resposta fisiológica — padrão de ansiedade hiperreativa. Pode indicar ruminação ou antecipação de eventos.", "category": "humor"}
        else:
            return {"title": "Sofrimento Subjetivo Elevado", "body": f"[{momento}] O estresse relatado foi maior do que os sinais fisiológicos — possível ansiedade antecipatória ou dificuldade de regulação emocional.", "category": "humor"}
    else:
        if perfil == "dissociativo":
            return {"title": "Estado Estável", "body": f"[{momento}] Percepção subjetiva alinhada com a fisiologia — momento de equilíbrio para o perfil dissociativo. Bom indicador de regulação emocional.", "category": "bem-estar"}
        else:
            return {"title": "Estado Equilibrado", "body": f"[{momento}] A percepção subjetiva está alinhada com o estado fisiológico — sem divergências significativas detectadas.", "category": "bem-estar"}

def resolver_patient_id(event):
    patient_id = None
    path_params = event.get("pathParameters") or {}
    patient_id = path_params.get("patientId")
    if not patient_id:
        qs = event.get("queryStringParameters") or {}
        patient_id = qs.get("patientId")
    if not patient_id:
        body = event.get("body")
        if body:
            try:
                parsed = json.loads(body) if isinstance(body, str) else body
                patient_id = parsed.get("patientId")
            except Exception:
                pass
    if not patient_id:
        patient_id = event.get("patientId")
    if not patient_id:
        return None, None
    if patient_id.startswith("PATIENT#"):
        pk         = patient_id
        patient_id = patient_id[len("PATIENT#"):]
    else:
        pk = f"PATIENT#{patient_id}"
    return pk, patient_id

def resolver_action(event):
    action = event.get("action")
    if not action:
        body = event.get("body")
        if body:
            try:
                parsed = json.loads(body) if isinstance(body, str) else body
                action = parsed.get("action")
            except Exception:
                pass
    if not action:
        path_params = event.get("pathParameters") or {}
        action = path_params.get("action")
    return action or "insight"

# ── RELATÓRIO SEMANAL ────────────────────────────────────────
def gerar_relatorio_semanal(event):
    pk, patient_id = resolver_patient_id(event)
    if not patient_id:
        return _resp(400, {"error": "patientId obrigatório"})

    # busca wesadId do paciente real
    perfil_item = table.get_item(Key={"PK": pk, "SK": pk}).get("Item", {})
    wesad_id    = perfil_item.get("wesadId")
    pk_dados    = f"PATIENT#{wesad_id}" if wesad_id else pk

    if wesad_id:
        # contas demo: busca os DAILY_NPS do sujeito WESAD
        resp = table.query(
            KeyConditionExpression=Key("PK").eq(pk_dados) & Key("SK").begins_with("DAILY_NPS#"),
            ScanIndexForward=True
        )
        dias = resp.get("Items", [])
    else:
        # pacientes reais: agrega os insights diários gerados pelo Health Connect na última semana
        resp = table.query(
            KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("INSIGHT#"),
            ScanIndexForward=True,
            Limit=50
        )
        uma_semana_atras = datetime.now() - timedelta(days=7)
        dias = []
        for item in resp.get("Items", []):
            dados_item = item.get("data", {})
            if "dias" in dados_item:
                continue  # ignora relatórios semanais anteriores
            if datetime.fromisoformat(item["createdAt"]) < uma_semana_atras:
                continue
            stress_subj_dia = float(dados_item.get("stress_subj", 0.30) or 0.30)
            dias.append({
                "timestamp":      item["createdAt"],
                "flag":           dados_item.get("flag", "aligned"),
                "divergence":     dados_item.get("divergence", "0"),
                "HR":             dados_item.get("hr_mean", "0"),
                "IBI":            dados_item.get("ibi_mean", "0"),
                "RMSSD":          dados_item.get("rmssd", "0"),
                "stress_physio":  dados_item.get("stress_physio", "0"),
                "perfil":         dados_item.get("perfil", "neutro"),
                "day":            len(dias) + 1,
                "mood":           round((1 - stress_subj_dia) * 10),
                "emotion_emoji":  "",
                "context":        "",
                "insight":        dados_item.get("body", ""),
            })

    if not dias:
        return _resp(404, {
            "error": "Nenhum dado diário encontrado",
            "pk_dados": pk_dados,
            "dica": "Salve os itens DAILY_NPS# no DynamoDB para PATIENT#S16_baseline_test" if wesad_id
                    else "Sincronize o smartwatch ao menos uma vez na última semana para gerar insights diários"
        })

    # ── CHECAGEM DE DUPLICATA ─────────────────────────────────
    # Usa a data do primeiro dia dos dados como identificador da semana
    week_start = dias[0]["timestamp"][:10]  # ex: "2025-01-13"

    # Busca insights existentes para este paciente
    insights_existentes = table.query(
        KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("INSIGHT#"),
        ScanIndexForward=False,
        Limit=10
    )

    for item in insights_existentes.get("Items", []):
        dados = item.get("data", {})
        # Só conta como duplicata se for um RELATÓRIO SEMANAL anterior (tem campo "dias"),
        # não um insight diário comum — os dois usam a mesma categoria e o mesmo weekStart.
        if "dias" not in dados:
            continue
        # Se já existe um relatório semanal desta mesma semana, retorna sem salvar novo
        if dados.get("weekStart") == week_start and dados.get("category") in ("stress", "humor", "bem-estar"):
            dias_salvos = []
            try:
                dias_salvos = json.loads(dados.get("dias", "[]"))
            except Exception:
                pass
            return _resp(200, {
                "message": "Relatório desta semana já existe",
                "pk_paciente": pk,
                "pk_dados": pk_dados,
                "relatorio": {
                    "titulo":           dados.get("title", ""),
                    "corpo":            dados.get("body", ""),
                    "categoria":        dados.get("category", ""),
                    "perfil":           dados.get("perfil", ""),
                    "flag_dominante":   dados.get("flag", ""),
                    "divergencia_media": float(dados.get("divergence", 0)),
                    "hr_media":         float(dados.get("hr_mean", 0)),
                    "ibi_media":        float(dados.get("ibi_mean", 0)),
                    "rmssd_media":      float(dados.get("rmssd", 0)),
                    "stress_physio":    float(dados.get("stress_physio", 0)),
                    "pct_anxiety_risk": int(dados.get("pct_anxiety_risk", 0)),
                    "pct_aligned":      int(dados.get("pct_aligned", 0)),
                    "pct_overreported": int(dados.get("pct_overreported", 0)),
                    "dias":             dias_salvos,
                }
            })
    # ── FIM CHECAGEM ──────────────────────────────────────────

    # agrega os dias
    flags       = [d["flag"] for d in dias]
    divs        = [float(d["divergence"]) for d in dias]
    hrs         = [float(d["HR"]) for d in dias]
    ibis        = [float(d["IBI"]) for d in dias]
    rmssds      = [float(d["RMSSD"]) for d in dias]
    sfs         = [float(d.get("stress_physio", 0)) for d in dias]
    perfil      = dias[0].get("perfil", "neutro")

    total       = len(flags)
    div_media   = round(sum(divs)   / total, 4)
    hr_media    = round(sum(hrs)    / total, 1)
    ibi_media   = round(sum(ibis)   / total, 1)
    rmssd_media = round(sum(rmssds) / total, 1)
    sf_media    = round(sum(sfs)    / total, 4)
    pct_risk    = round(flags.count("anxiety_risk")  / total * 100)
    pct_over    = round(flags.count("overreported")  / total * 100)
    pct_align   = round(flags.count("aligned")       / total * 100)
    flag_dom    = max(set(flags), key=flags.count)

    if pct_risk >= 40:
        titulo = "⚠️ Atenção: Padrão Dissociativo Recorrente"
        corpo  = (
            f"Em {pct_risk}% dos dias monitorados, o paciente apresentou estresse fisiológico "
            f"elevado (HR média {hr_media} bpm, IBI {ibi_media} ms) com baixo relato subjetivo — "
            f"padrão consistente com perfil {perfil}. "
            f"Divergência média da semana: {div_media:+.4f}. "
            f"Recomenda-se explorar esse padrão na próxima sessão."
        )
        categoria = "stress"
    elif flag_dom == "overreported":
        titulo = "📊 Sofrimento Subjetivo Elevado na Semana"
        corpo  = (
            f"O paciente relatou mais sofrimento do que a fisiologia indicou na maioria dos dias. "
            f"Divergência média: {div_media:+.4f}. "
            f"Possível ansiedade antecipatória ou dificuldade de regulação emocional."
        )
        categoria = "humor"
    else:
        titulo = "✅ Semana com Boa Regulação Emocional"
        corpo  = (
            f"A percepção subjetiva esteve alinhada com os sinais fisiológicos na maior parte da semana. "
            f"HR média: {hr_media} bpm, RMSSD: {rmssd_media} ms. "
            f"Divergência média: {div_media:+.4f}. "
            f"Bom indicador de regulação para o perfil {perfil}."
        )
        categoria = "bem-estar"

    detalhes_dias = [
        {
            "dia":         int(d.get("day", 0)),
            "data":        d["timestamp"],
            "flag":        d["flag"],
            "divergencia": float(d["divergence"]),
            "HR":          float(d["HR"]),
            "IBI":         float(d["IBI"]),
            "RMSSD":       float(d["RMSSD"]),
            "mood":        int(d.get("mood", 0)),
            "emoji":       d.get("emotion_emoji", ""),
            "contexto":    d.get("context", ""),
            "insight":     d.get("insight", ""),
        }
        for d in dias
    ]

    # Salva apenas se não existia ainda
    ts = datetime.now().isoformat()
    table.put_item(Item={
        "PK": pk,
        "SK": f"INSIGHT#{ts}",
        "type": "INSIGHT",
        "data": {
            "title":             titulo,
            "body":              corpo,
            "category":          categoria,
            "weekStart":         week_start,
            "isRead":            False,
            "perfil":            perfil,
            "flag":              flag_dom,
            "divergence":        str(div_media),
            "stress_physio":     str(sf_media),
            "hr_mean":           str(hr_media),
            "ibi_mean":          str(ibi_media),
            "rmssd":             str(rmssd_media),
            "pct_anxiety_risk":  str(pct_risk),
            "pct_aligned":       str(pct_align),
            "pct_overreported":  str(pct_over),
            "dias":              json.dumps(detalhes_dias, ensure_ascii=False),
            "amostras":          total,
        },
        "createdAt": ts
    })

    return _resp(200, {
        "message":     "Relatório semanal gerado com sucesso",
        "pk_paciente": pk,
        "pk_dados":    pk_dados,
        "relatorio": {
            "titulo":           titulo,
            "corpo":            corpo,
            "categoria":        categoria,
            "perfil":           perfil,
            "flag_dominante":   flag_dom,
            "divergencia_media": div_media,
            "hr_media":         hr_media,
            "ibi_media":        ibi_media,
            "rmssd_media":      rmssd_media,
            "stress_physio":    sf_media,
            "pct_anxiety_risk": pct_risk,
            "pct_aligned":      pct_align,
            "pct_overreported": pct_over,
            "dias":             detalhes_dias,
        }
    })

def encontrar_insight_diario_de_hoje(pk):
    hoje = datetime.now().strftime("%Y-%m-%d")
    resp = table.query(
        KeyConditionExpression=Key("PK").eq(pk) & Key("SK").begins_with("INSIGHT#"),
        ScanIndexForward=False,
        Limit=10
    )
    for item in resp.get("Items", []):
        dados = item.get("data", {})
        if "dias" in dados:
            continue  # ignora relatórios semanais
        if item.get("createdAt", "")[:10] == hoje:
            return item
    return None

# ── INSIGHT DIÁRIO ───────────────────────────────────────────
def gerar_insight_handler(event):
    pk, patient_id = resolver_patient_id(event)
    if not patient_id:
        return _resp(400, {"error": "patientId é obrigatório"})

    perfil_item = table.get_item(Key={"PK": pk, "SK": pk}).get("Item", {})
    wesad_id    = perfil_item.get("wesadId")
    pk_dados    = f"PATIENT#{wesad_id}" if wesad_id else pk

    resp = table.query(
        KeyConditionExpression=Key("PK").eq(pk_dados) & Key("SK").begins_with("HEALTH_BATCH#"),
        ScanIndexForward=False,
        Limit=10
    )
    batches = resp.get("Items", [])

    if not batches:
        return _resp(404, {"error": f"Sem dados fisiológicos para {pk_dados}", "pk_dados": pk_dados, "wesad_id": wesad_id})

    hrs, ibis, temps = [], [], []
    label_counts = {}
    for batch in batches:
        for dp in batch.get("dataPoints", []):
            hr   = float(dp.get("hr",   dp.get("HR",   0)) or 0)
            ibi  = float(dp.get("ibi",  dp.get("IBI",  0)) or 0)
            temp = float(dp.get("temp", dp.get("TEMP", 0)) or 0)
            lbl  = dp.get("label_nome", dp.get("label", "desconhecido"))
            if hr  > 0: hrs.append(hr)
            if ibi > 0: ibis.append(ibi)
            if temp > 0: temps.append(temp)
            label_counts[lbl] = label_counts.get(lbl, 0) + 1

    if not hrs:
        return _resp(400, {"error": "dataPoints sem valores de HR válidos"})

    n        = len(hrs)
    hr_mean  = sum(hrs) / n
    ibi_mean = sum(ibis) / len(ibis) if ibis else 850.0
    rmssd    = calc_rmssd(ibis) if len(ibis) >= 2 else 0.0

    sf = calc_stress_physio(hr_mean, ibi_mean, rmssd)

    subject_key = (wesad_id or patient_id).split("_")[0].upper()
    perfil = PERFIS_WESAD.get(subject_key)
    if not perfil:
        if hr_mean > 90 and ibi_mean < 700: perfil = "hiperreativo"
        elif hr_mean > 85 and ibi_mean < 750 and rmssd < 30: perfil = "dissociativo"
        else: perfil = "neutro"

    label_dominante = max(label_counts, key=label_counts.get) if label_counts else "baseline"
    fase_dia        = hora_para_label(datetime.now().hour)
    ss              = calc_stress_subjetivo(pk)
    sf_adj          = round(sf * 0.9, 4)
    divergence      = round(sf_adj - ss, 4)

    if divergence >= 0.3:    flag = "anxiety_risk"
    elif divergence <= -0.3: flag = "overreported"
    else:                    flag = "aligned"

    insight = gerar_insight_fixo(perfil, fase_dia, flag, divergence)

    agora = datetime.now().isoformat()
    insight_de_hoje = encontrar_insight_diario_de_hoje(pk)
    # Reaproveita a SK do insight de hoje (se já existir) pra ATUALIZAR em vez de criar um novo —
    # faz mais sentido pra acompanhamento psicológico ter 1 registro por dia, sempre atualizado.
    ts = insight_de_hoje["SK"].split("#", 1)[1] if insight_de_hoje else agora
    table.put_item(Item={
        "PK": pk, "SK": f"INSIGHT#{ts}", "type": "INSIGHT",
        "data": {
            "title": insight["title"], "body": insight["body"], "category": insight["category"],
            "weekStart": datetime.now().strftime("%Y-%m-%d"), "isRead": False,
            "perfil": perfil, "flag": flag, "divergence": str(divergence),
            "stress_physio": str(sf), "stress_subj": str(ss), "hr_mean": str(round(hr_mean, 1)),
            "ibi_mean": str(round(ibi_mean, 1)), "rmssd": str(round(rmssd, 1)),
            "label": label_dominante, "amostras": n, "wesad_id": wesad_id or "proprio",
        },
        "createdAt": agora
    })

    flag_anterior = insight_de_hoje.get("data", {}).get("flag") if insight_de_hoje else None
    if flag == "anxiety_risk" and flag_anterior != "anxiety_risk":
        clinician_id = perfil_item.get("clinicianId")
        if clinician_id:
            clinician_item = table.get_item(Key={"PK": f"CLINICIAN#{clinician_id}", "SK": "PROFILE"}).get("Item", {})
            push_token = clinician_item.get("pushToken")
            nome_paciente = perfil_item.get("name", "Um paciente")
            titulo_push = "Alerta de risco"
            corpo_push = f"{nome_paciente} pode estar com sinais de ansiedade elevados hoje."
            resultado_push = enviar_push(push_token, titulo_push, corpo_push, {"category": "risk_alert", "patientId": patient_id})
            table.put_item(Item={
                "PK": f"CLINICIAN#{clinician_id}", "SK": f"NOTIFICATION#{agora}", "type": "NOTIFICATION",
                "createdAt": agora,
                "data": {
                    "category": "risk_alert", "title": titulo_push, "body": corpo_push,
                    "isRead": False, "pushSent": resultado_push["ok"], "relatedId": ts,
                },
            })

    return _resp(200, {
        "message": "Insight gerado com sucesso", "pk_paciente": pk, "pk_dados": pk_dados,
        "perfil": perfil, "flag": flag, "divergence": divergence, "stress_physio": sf, "stress_subj": ss,
        "hr_mean": round(hr_mean, 1), "ibi_mean": round(ibi_mean, 1), "rmssd": round(rmssd, 1),
        "amostras": n, "insight": insight
    })

# ── HANDLER PRINCIPAL ────────────────────────────────────────
def handler(event, context):
    action = resolver_action(event)
    if action == "weekly-report":
        return gerar_relatorio_semanal(event)
    return gerar_insight_handler(event)

def _resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, ensure_ascii=False)
    }