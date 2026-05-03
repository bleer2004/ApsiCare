import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;

    if (!clinicianId) {
      return response(400, { error: "clinicianId é obrigatório" });
    }

    const result = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CLINICIAN#${clinicianId}`,
        SK: "PROFILE"
      }
    }));

    if (!result.Item) {
      return response(404, { error: "Clinician não encontrado" });
    }

    const item = result.Item;
    
    // Extraímos o 'data' (se existir), mas tratamos ele como secundário
    const oldNestedData = item.data || {};

    const finalProfile = {
      ...oldNestedData, // Dados antigos (se existirem)
      ...item,          // Dados da raiz (SEMPRE ganham a preferência)
      id: clinicianId   
    };

    // Faxina final: removemos campos que o Front-end não precisa ver
    delete finalProfile.data;
    delete finalProfile.passwordHash; // Nunca envie o hash da senha pro app!

    return response(200, finalProfile);

  } catch (err) {
    console.error("Erro no Lambda GET:", err);
    return response(500, { error: "Erro interno no servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS"
  },
  body: JSON.stringify(body)
});