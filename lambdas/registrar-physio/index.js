import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const body = JSON.parse(event.body);

    const { samples, source } = body;

    if (!patientId || !Array.isArray(samples)) {
      return response(400, {
        error: "patientId e samples (array) são obrigatórios"
      });
    }

    const now = new Date().toISOString();

    console.log(`Recebidos ${samples.length} samples`);

    for (const s of samples) {

      const measuredAt = s.time_s || now; // fallback

      const item = {
        PK: `PATIENT#${patientId}`,
        SK: `PHYSIO#${measuredAt}`,

        type: "PHYSIO",
        createdAt: now,

        data: {
          subject: s.subject || patientId,
          time_s: s.time_s ?? null,
          label: s.label ?? null,
          label_nome: s.label_nome ?? null,

          hr: s.hr ?? null,
          ibi: s.ibi ?? null,
          bvp: s.bvp ?? null,
          temp: s.temp ?? null,
          acc_mag: s.acc_mag ?? null,

          source: source || "batch",
          measuredAt: measuredAt
        }
      };

      await dynamo.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item
      }));
    }

    return response(200, {
      message: "Batch processado com sucesso",
      inserted: samples.length
    });

  } catch (err) {
    console.error(err);
    return response(500, {
      error: "Erro interno no servidor",
      details: err.message
    });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  body: JSON.stringify(body)
});