import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createHash, randomBytes, timingSafeEqual } from "crypto"; // Nativo do Node

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const { clinicianId, currentPassword, newPassword } = JSON.parse(event.body);

    const userResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" }
    }));

    if (!userResult.Item) return response(404, { error: "Profissional não encontrado." });

    // Pega o hash da raiz
    const hashNoBanco = userResult.Item.passwordHash;

    const hashedInput = createHash("sha256").update(currentPassword).digest("hex");
    
    if (hashedInput !== hashNoBanco) {
      return response(401, { error: "A senha atual está incorreta." });
    }

    const newHash = createHash("sha256").update(newPassword).digest("hex");

    // ATUALIZAÇÃO PARA A RAIZ
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" },
      // Removemos o '#data.' da expressão
      UpdateExpression: "SET #pw = :newHash, #updatedAt = :now",
      ExpressionAttributeNames: { 
        "#pw": "passwordHash",
        "#updatedAt": "updatedAt"
      },
      ExpressionAttributeValues: { 
        ":newHash": newHash,
        ":now": new Date().toISOString()
      }
    }));

    return response(200, { message: "Senha alterada com sucesso!" });

// ... (resto do código)

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno." });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});