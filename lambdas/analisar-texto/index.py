import json
import os
import urllib.request
import urllib.error

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL   = "meta-llama/llama-3.1-8b-instruct"

SYSTEM_PROMPT = """
Você é um assistente utilizado em um projeto acadêmico de apoio à saúde mental.

IMPORTANTE
 
- Não faça diagnóstico.
- Não invente sintomas.
- Considere apenas o texto informado.
- Não interprete informações implícitas.
- Caso o texto seja muito curto ou não contenha informações suficientes, utilize apenas as evidências disponíveis e evite superestimar o nível de estresse.

Avalie tanto sinais de estresse quanto sinais de bem-estar:

1. intensidade do estresse percebido
2. intensidade emocional (positiva ou negativa)
3. eventos negativos descritos
4. fatores de recuperação, alívio ou coisas boas descritas
5. contexto

Se o relato descrever um dia bom, tranquilo ou positivo, sem sinais de estresse, o stress_score deve ficar baixo (perto de 0.0) e o sentimento deve ser "positivo". Não assuma estresse quando o texto não descreve nenhum.

Retorne APENAS JSON, sempre incluindo os três campos: stress_score, sentimento, palavras_chave.

"""

def montar_prompt(diary_text):
    return f"""
Analise o autorrelato abaixo.

Avalie EXCLUSIVAMENTE as informações presentes no texto.

Critérios para avaliação:

1. stress_score
- Valor entre   0.0 e 1.0
- 0.0 = ausência de estresse.
- 0.5 = presença moderada de estresse.
- 1.0 = estresse intenso claramente descrito pelo autorrelato.

Considere:
- intensidade emocional;
- sensação de sobrecarga;
- preocupação ou ansiedade;
- eventos negativos descritos;
- sinais físicos relacionados ao estresse (quando mencionados);
- fatores de recuperação ou melhora.

2. sentimento
Escolha apenas um:
- positivo
- neutro
- negativo

3. palavras_chave
Retorne até 3 palavras que melhor resumam o estado emocional descrito.

Autorrelato:
"{diary_text}"

Responda APENAS com um JSON válido no formato abaixo, substituindo os valores pelos que você calculou para ESTE autorrelato específico (não copie os exemplos):

{{
    "stress_score": <número entre 0.0 e 1.0 calculado agora>,
    "sentimento": "<positivo, neutro ou negativo>",
    "palavras_chave": [
        "<palavra 1>",
        "<palavra 2>",
        "<palavra 3>"
    ]
}}

"""

def _montar_payload(diary_text, exigir_zdr):
    """
    exigir_zdr=True  -> só roteia para endpoints com política de Zero Data Retention.
                         Se nenhum existir para o modelo/provedor, o OpenRouter retorna erro.
    exigir_zdr=False -> roteamento normal, sem restrição de ZDR (fallback).
    """
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": montar_prompt(diary_text)},
        ],
        "max_tokens": 200,
        "temperature": 0.2,
    }
    if exigir_zdr:
        payload["provider"] = {"zdr": True}
    return json.dumps(payload).encode("utf-8")


def _fazer_requisicao(api_key, diary_text, exigir_zdr):
    req = urllib.request.Request(
        OPENROUTER_API_URL,
        data=_montar_payload(diary_text, exigir_zdr),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def chamar_llm(diary_text):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY não configurado nas variáveis de ambiente do Lambda")

    zdr_aplicado = True
    try:
        # Tentativa 1: exige ZDR (melhor caso de privacidade)
        result = _fazer_requisicao(api_key, diary_text, exigir_zdr=True)
    except urllib.error.HTTPError as e:
        corpo_erro = e.read().decode("utf-8", errors="ignore")
        print(f"[ZDR] Requisição com zdr=true falhou ({e.code}): {corpo_erro}")

        # Erro típico quando não há endpoint elegível com ZDR para o modelo/provedor.
        # Nesse caso, registramos e decidimos explicitamente seguir sem ZDR,
        # em vez de deixar a exceção estourar como 500 genérico.
        zdr_aplicado = False
        result = _fazer_requisicao(api_key, diary_text, exigir_zdr=False)

    raw = result["choices"][0]["message"]["content"].strip()

    # extrai o JSON mesmo se o modelo adicionou texto em volta
    start = raw.find("{")
    end   = raw.rfind("}") + 1
    parsed = json.loads(raw[start:end])

    stress_score = float(parsed.get("stress_score", 0.5))
    stress_score = max(0.0, min(1.0, stress_score))

    return {
        "stress_score":   round(stress_score, 4),
        "sentimento":     parsed.get("sentimento", "neutro"),
        "palavras_chave": parsed.get("palavras_chave", []),
        "zdr_aplicado":   zdr_aplicado,  # útil para logging/auditoria e para o TCC
    }

def handler(event, context):
    try:
        body = event.get("body")
        if body:
            body = json.loads(body) if isinstance(body, str) else body
        else:
            body = event

        diary_text = body.get("diaryText", "").strip()
        if not diary_text:
            return _resp(400, {"error": "diaryText é obrigatório"})

        resultado = chamar_llm(diary_text)
        return _resp(200, resultado)

    except urllib.error.HTTPError as e:
        corpo_erro = e.read().decode("utf-8", errors="ignore")
        print(f"[OpenRouter] HTTPError {e.code}: {corpo_erro}")
        return _resp(502, {"error": f"Erro na OpenRouter API: {e.code} {e.reason}"})
    except (KeyError, ValueError, json.JSONDecodeError) as e:
        print(f"[Parsing] Erro ao interpretar resposta: {str(e)}")
        return _resp(502, {"error": f"Resposta inesperada do modelo: {str(e)}"})
    except Exception as e:
        print(f"[Erro inesperado] {str(e)}")
        return _resp(500, {"error": str(e)})

def _resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, ensure_ascii=False),
    }