import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "ApsiCare";

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

    const perfil = { ...(result.Item.data || {}), ...result.Item };

    const CAMPOS_PUBLICOS = [
      "name", "email", "phone", "cellphone", "birthDate", "profession", "councilId",
      "especialidade", "clinica", "enderecoClinica", "notificationsEnabled", "isActive", "createdAt",
    ];
    const finalProfile = { id: clinicianId };
    for (const campo of CAMPOS_PUBLICOS) {
      if (perfil[campo] !== undefined) finalProfile[campo] = perfil[campo];
    }

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