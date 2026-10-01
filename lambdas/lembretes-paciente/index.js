// GET    /patients/{patientId}/lembretes
// POST   /patients/{patientId}/lembretes              { texto, dia }
// DELETE /patients/{patientId}/lembretes/{lembreteId}
// POST   /patients/{patientId}/lembretes/enviar       { lembreteIds: [...] }
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

async function enviarPush(pushToken, title, body, data = {}) {
  if (!pushToken) return { ok: false };
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: pushToken, title, body, data, sound: "default", channelId: "default" }),
    });
    const json = await res.json();
    return { ok: json?.data?.status === "ok" };
  } catch (err) {
    console.error("[push] falha ao enviar:", err);
    return { ok: false };
  }
}

const listar = async (patientId) => {
  const result = await dynamo.send(new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: { ":pk": `PATIENT#${patientId}`, ":prefix": "LEMBRETE#" },
    ScanIndexForward: false,
  }));
  return (result.Items || []).map((item) => ({
    id: item.lembreteId,
    texto: item.texto,
    dia: item.dia,
    enviado: item.enviado || false,
    enviadoEm: item.enviadoEm || null,
    createdAt: item.createdAt,
  }));
};

const enviar = async (patientId, lembreteIds) => {
  const patient = await dynamo.send(new GetCommand({
    TableName: TABLE_NAME,
    Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
  }));
  if (!patient.Item) return response(404, { error: "Paciente não encontrado" });

  const lembretes = (await listar(patientId)).filter((l) => lembreteIds.includes(l.id));
  if (lembretes.length === 0) return response(404, { error: "Nenhum lembrete encontrado" });

  const titulo = "Lembrete do seu psicólogo";
  const corpo = lembretes.length === 1
    ? lembretes[0].texto
    : lembretes.map((l) => `• ${l.texto}`).join("\n");

  const agora = new Date().toISOString();
  const push = await enviarPush(patient.Item.pushToken, titulo, corpo, { category: "lembrete" });

  await dynamo.send(new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      PK: `PATIENT#${patientId}`,
      SK: `NOTIFICATION#${agora}`,
      type: "NOTIFICATION",
      createdAt: agora,
      data: { category: "lembrete", title: titulo, body: corpo, isRead: false, pushSent: push.ok },
    },
  }));

  for (const l of lembretes) {
    const item = (await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression: "lembreteId = :id",
      ExpressionAttributeValues: { ":pk": `PATIENT#${patientId}`, ":prefix": "LEMBRETE#", ":id": l.id },
    }))).Items?.[0];
    if (!item) continue;
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: item.PK, SK: item.SK },
      UpdateExpression: "SET enviado = :true, enviadoEm = :agora",
      ExpressionAttributeValues: { ":true": true, ":agora": agora },
    }));
  }

  return response(200, { message: "Lembrete enviado", pushSent: push.ok, enviados: lembretes.length });
};

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const lembreteId = event.pathParameters?.lembreteId;
    const method = event.requestContext?.http?.method || event.httpMethod || "GET";
    const path = event.rawPath || event.path || "";
    if (!patientId) return response(400, { error: "patientId é obrigatório" });

    const body = JSON.parse(event.body || "{}");

    if (method === "GET") {
      return response(200, { lembretes: await listar(patientId) });
    }

    if (method === "POST" && path.endsWith("/enviar")) {
      const ids = Array.isArray(body.lembreteIds) ? body.lembreteIds : [];
      if (ids.length === 0) return response(400, { error: "lembreteIds é obrigatório" });
      return await enviar(patientId, ids);
    }

    if (method === "POST") {
      const texto = (body.texto || "").trim();
      if (!texto) return response(400, { error: "texto é obrigatório" });
      const id = randomUUID();
      const agora = new Date().toISOString();
      const lembrete = { id, texto, dia: body.dia || null, enviado: false, enviadoEm: null, createdAt: agora };
      await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `PATIENT#${patientId}`,
          SK: `LEMBRETE#${agora}#${id}`,
          type: "LEMBRETE",
          lembreteId: id,
          texto,
          dia: lembrete.dia,
          enviado: false,
          createdAt: agora,
        },
      }));
      return response(201, { lembrete });
    }

    if (method === "DELETE" && lembreteId) {
      const item = (await dynamo.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
        FilterExpression: "lembreteId = :id",
        ExpressionAttributeValues: { ":pk": `PATIENT#${patientId}`, ":prefix": "LEMBRETE#", ":id": lembreteId },
      }))).Items?.[0];
      if (item) {
        await dynamo.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { PK: item.PK, SK: item.SK } }));
      }
      return response(200, { message: "Lembrete removido" });
    }

    return response(405, { error: "Método não suportado" });
  } catch (err) {
    console.error("ERRO lembretes-paciente:", err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
