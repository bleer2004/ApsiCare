// POST /patients/{patientId}/solicitar-exclusao
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    if (!patientId) return response(400, { error: "patientId é obrigatório" });

    const patient = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
    }));
    if (!patient.Item) return response(404, { error: "Paciente não encontrado" });

    const agora = new Date().toISOString();
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
      UpdateExpression: "SET deletionRequestedAt = :agora",
      ExpressionAttributeValues: { ":agora": agora },
    }));

    const clinicianId = patient.Item.clinicianId;
    if (clinicianId) {
      const clinician = await dynamo.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" },
      }));
      const nomePaciente = patient.Item.name || "Um paciente";
      const titulo = "Pedido de exclusão de dados";
      const corpo = `${nomePaciente} pediu a exclusão da conta e dos dados no ApsiCare.`;

      let pushSent = false;
      try {
        pushSent = (await enviarPush(clinician.Item?.pushToken, titulo, corpo, { category: "deletion_request", patientId })).ok;
      } catch (pushErr) {
        console.error("[push] falha:", pushErr);
      }

      await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `CLINICIAN#${clinicianId}`,
          SK: `NOTIFICATION#${agora}`,
          type: "NOTIFICATION",
          createdAt: agora,
          data: {
            category: "deletion_request",
            title: titulo,
            body: corpo,
            isRead: false,
            pushSent,
            relatedId: patientId,
            patientId,
            patientName: nomePaciente,
          },
        },
      }));
    }

    return response(200, { message: "Pedido de exclusão enviado ao seu psicólogo" });
  } catch (err) {
    console.error("ERRO solicitar-exclusao-paciente:", err);
    return response(500, { error: "Erro interno ao registrar pedido" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
