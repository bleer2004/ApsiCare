import json
import os
import urllib.request
import urllib.error

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL   = "meta-llama/llama-3.2-1b-instruct"

SYSTEM_PROMPT = """Você é um analisador de bem-estar emocional clínico.
Analise o texto do diário de um paciente em acompanhamento psicológico.
Retorne APENAS um JSON válido, sem texto adicional, sem markdown, sem explicação."""

def montar_prompt(diary_text):
    return f"""Analise o texto do diário abaixo e retorne um JSON com exatamente estes campos:
- stress_score: número de 0.0 a 1.0 (0.0 = sem stress, 1.0 = stress máximo)
- sentimento: uma das opções "positivo", "neutro" ou "negativo"
- palavras_chave: lista com até 3 palavras que resumem o estado emocional

Texto do diário: "{diary_text}"

Responda APENAS com o JSON. Exemplo:
{{"stress_score": 0.7, "sentimento": "negativo", "palavras_chave": ["ansiedade", "cansaço", "trabalho"]}}"""

def chamar_llm(diary_text):
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("OPENROUTER_API_KEY não configurado nas variáveis de ambiente do Lambda")

    payload = json.dumps({
        "model": OPENROUTER_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",   "content": montar_prompt(diary_text)},
        ],
        "max_tokens": 120,
        "temperature": 0.1,
    }).encode("utf-8")

    req = urllib.request.Request(
        OPENROUTER_API_URL,
        data=payload,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    with urllib.request.urlopen(req, timeout=15) as resp:
        result = json.loads(resp.read().decode("utf-8"))

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
        return _resp(502, {"error": f"Erro na OpenRouter API: {e.code} {e.reason}"})
    except (KeyError, ValueError, json.JSONDecodeError) as e:
        return _resp(502, {"error": f"Resposta inesperada do modelo: {str(e)}"})
    except Exception as e:
        return _resp(500, {"error": str(e)})

def _resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, ensure_ascii=False),
    }
