import base64
import json
import os
import uuid
import urllib.request
import urllib.error

GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
MODELO = "whisper-large-v3-turbo"


def _multipart(campos, arquivo_nome, arquivo_bytes, arquivo_tipo):
    boundary = uuid.uuid4().hex
    partes = []
    for nome, valor in campos.items():
        partes.append(
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"{nome}\"\r\n\r\n{valor}\r\n".encode()
        )
    partes.append(
        (
            f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{arquivo_nome}\"\r\n"
            f"Content-Type: {arquivo_tipo}\r\n\r\n"
        ).encode()
        + arquivo_bytes
        + b"\r\n"
    )
    partes.append(f"--{boundary}--\r\n".encode())
    return b"".join(partes), f"multipart/form-data; boundary={boundary}"


def handler(event, context):
    try:
        body = event.get("body") or "{}"
        body = json.loads(body) if isinstance(body, str) else body

        audio_b64 = body.get("audio_base64")
        if not audio_b64:
            return _resp(400, {"error": "audio_base64 é obrigatório"})

        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return _resp(500, {"error": "GROQ_API_KEY não configurada"})

        audio = base64.b64decode(audio_b64)
        tipo = body.get("mimeType") or "audio/m4a"
        extensao = tipo.split("/")[-1]

        dados, content_type = _multipart(
            {"model": MODELO, "language": "pt"}, f"gravacao.{extensao}", audio, tipo
        )
        req = urllib.request.Request(
            GROQ_URL,
            data=dados,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": content_type, "User-Agent": "ApsiCare/1.0"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=25) as r:
            resultado = json.loads(r.read().decode("utf-8"))

        return _resp(200, {"text": resultado.get("text", "").strip()})

    except urllib.error.HTTPError as e:
        print("Groq HTTPError:", e.code, e.read().decode("utf-8", "ignore"))
        return _resp(502, {"error": "Falha no serviço de transcrição"})
    except Exception as e:
        print("Erro transcrever-voz:", repr(e))
        return _resp(500, {"error": "Erro interno ao transcrever"})


def _resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*"},
        "body": json.dumps(body, ensure_ascii=False),
    }
