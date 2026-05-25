import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    if (!patientId) return response(400, { error: "patientId é obrigatório" });

    const method = event.requestContext?.http?.method || event.httpMethod || "GET";

    // ── DELETE /patients/{patientId}/insights/{timestamp} ──
    if (method === "DELETE") {
      const timestamp = event.pathParameters?.timestamp;
      if (!timestamp) return response(400, { error: "timestamp é obrigatório" });

      await dynamo.send(new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PATIENT#${patientId}`,
          SK: `INSIGHT#${timestamp}`,
        },
      }));

      return response(200, { message: "Insight deletado com sucesso" });
    }

    // ── GET /patients/{patientId}/insights ──
    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": `PATIENT#${patientId}`,
        ":prefix": "INSIGHT#",
      },
      ScanIndexForward: false,
    }));

    const insights = result.Items.map(item => ({
      timestamp: item.SK.split("#")[1],
      sk: item.SK, // para deletar
      title: item.data?.title,
      body: item.data?.body,
      category: item.data?.category,
      weekStart: item.data?.weekStart,
      isRead: item.data?.isRead,
      // campos fisiológicos
      flag: item.data?.flag,
      hr_mean: item.data?.hr_mean,
      ibi_mean: item.data?.ibi_mean,
      rmssd: item.data?.rmssd,
      perfil: item.data?.perfil,
      stress_physio: item.data?.stress_physio,
      pct_anxiety_risk: item.data?.pct_anxiety_risk,
      pct_aligned: item.data?.pct_aligned,
      divergence: item.data?.divergence,
    }));

    return response(200, { insights });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});