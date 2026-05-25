import json
import math
import boto3
from datetime import datetime
from boto3.dynamodb.conditions import Key

dynamo = boto3.resource("dynamodb", region_name="sa-east-1")
table  = dynamo.Table("ApsiCare")

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

def calc_stress_physio(hr, ibi, rmssd, hr_min, hr_max, ibi_min, ibi_max, rmssd_min, rmssd_max):
    hr_n    = normaliza(hr,    hr_min,    hr_max)
    ibi_n   = 1 - normaliza(ibi,   ibi_min,   ibi_max)
    rmssd_n = normaliza(rmssd, rmssd_min, rmssd_max)
    return round(0.40 * hr_n + 0.40 * ibi_n + 0.20 * rmssd_n, 4)

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

    # busca os DAILY_NPS do sujeito WESAD
    resp = table.query(
        KeyConditionExpression=Key("PK").eq(pk_dados) & Key("SK").begins_with("DAILY_NPS#"),
        ScanIndexForward=True
    )
    dias = resp.get("Items", [])

    if not dias:
        return _resp(404, {
            "error": "Nenhum dado diário encontrado",
            "pk_dados": pk_dados,
            "dica": "Salve os itens DAILY_NPS# no DynamoDB para PATIENT#S16_baseline_test"
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
        # Se já existe um insight desta mesma semana, retorna sem salvar novo
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

    hr_min, hr_max       = min(hrs), max(hrs)
    ibi_min, ibi_max     = (min(ibis), max(ibis)) if ibis else (600, 1300)
    rmssd_min, rmssd_max = 0.0, max(rmssd * 2, 1.0)

    sf = calc_stress_physio(hr_mean, ibi_mean, rmssd, hr_min, hr_max, ibi_min, ibi_max, rmssd_min, rmssd_max)

    subject_key = (wesad_id or patient_id).split("_")[0].upper()
    perfil = PERFIS_WESAD.get(subject_key)
    if not perfil:
        if hr_mean > 90 and ibi_mean < 700: perfil = "hiperreativo"
        elif hr_mean > 85 and ibi_mean < 750 and rmssd < 30: perfil = "dissociativo"
        else: perfil = "neutro"

    label_dominante = max(label_counts, key=label_counts.get) if label_counts else "baseline"
    fase_dia        = hora_para_label(datetime.now().hour)
    ss              = 0.30
    sf_adj          = round(sf * 0.9, 4)
    divergence      = round(sf_adj - ss, 4)

    if divergence >= 0.3:    flag = "anxiety_risk"
    elif divergence <= -0.3: flag = "overreported"
    else:                    flag = "aligned"

    insight = gerar_insight_fixo(perfil, fase_dia, flag, divergence)

    ts = datetime.now().isoformat()
    table.put_item(Item={
        "PK": pk, "SK": f"INSIGHT#{ts}", "type": "INSIGHT",
        "data": {
            "title": insight["title"], "body": insight["body"], "category": insight["category"],
            "weekStart": datetime.now().strftime("%Y-%m-%d"), "isRead": False,
            "perfil": perfil, "flag": flag, "divergence": str(divergence),
            "stress_physio": str(sf), "hr_mean": str(round(hr_mean, 1)),
            "ibi_mean": str(round(ibi_mean, 1)), "rmssd": str(round(rmssd, 1)),
            "label": label_dominante, "amostras": n, "wesad_id": wesad_id or "proprio",
        },
        "createdAt": ts
    })

    return _resp(200, {
        "message": "Insight gerado com sucesso", "pk_paciente": pk, "pk_dados": pk_dados,
        "perfil": perfil, "flag": flag, "divergence": divergence, "stress_physio": sf,
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