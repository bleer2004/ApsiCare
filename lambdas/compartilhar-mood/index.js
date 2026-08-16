import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

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
    const moodId = event.pathParameters?.moodId;

    if (!patientId || !moodId) {
      return response(400, { error: "patientId e moodId são obrigatórios" });
    }

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: `MOOD#${moodId}`,
      },
      UpdateExpression: "SET #data.sharedWithPsychologist = :val",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: { ":val": true },
    }));

    try {
      const patient = await dynamo.send(new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
      }));
      const clinicianId = patient.Item?.clinicianId;

      if (clinicianId) {
        const clinician = await dynamo.send(new GetCommand({
          TableName: TABLE_NAME,
          Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" },
        }));

        if (clinician.Item?.notificationsEnabled !== false) {
          const pushToken = clinician.Item?.pushToken;
          const nomePaciente = patient.Item?.name || "Um paciente";
          const titulo = "Anotação compartilhada";
          const corpo = `${nomePaciente} compartilhou uma anotação do diário com você.`;

          const resultado = await enviarPush(pushToken, titulo, corpo, { category: "share_alert", patientId });

          const agora = new Date().toISOString();
          await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: {
              PK: `CLINICIAN#${clinicianId}`,
              SK: `NOTIFICATION#${agora}`,
              type: "NOTIFICATION",
              createdAt: agora,
              data: {
                category: "share_alert",
                title: titulo,
                body: corpo,
                isRead: false,
                pushSent: resultado.ok,
                relatedId: moodId,
                patientId,
                patientName: nomePaciente,
              },
            },
          }));
        }
      }
    } catch (notifErr) {
      console.error("[notificacao] falha ao notificar clínico, compartilhamento já foi salvo normalmente:", notifErr);
    }

    return response(200, { message: "Anotação compartilhada com sucesso" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});
