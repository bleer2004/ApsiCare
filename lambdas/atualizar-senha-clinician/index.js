import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const { clinicianId, currentPassword, newPassword } = JSON.parse(event.body || "{}");
    if (!clinicianId || !currentPassword || !newPassword) {
      return response(400, { error: "clinicianId, currentPassword e newPassword são obrigatórios" });
    }
    if (newPassword.length < 6) {
      return response(400, { error: "A senha deve ter no mínimo 6 caracteres" });
    }

    const userResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" }
    }));

    if (!userResult.Item) return response(404, { error: "Profissional não encontrado." });

    // Pega o hash da raiz
    const hashNoBanco = userResult.Item.passwordHash;

    if (!(await senhaConfere(currentPassword, hashNoBanco))) {
      return response(401, { error: "A senha atual está incorreta." });
    }

    const newHash = await bcrypt.hash(newPassword, 8);

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

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno." });
  }
};

const isSha256Legado = (hash) => /^[a-f0-9]{64}$/.test(hash || "");

const senhaConfere = async (senha, hash) => {
  if (isSha256Legado(hash)) {
    return createHash("sha256").update(senha).digest("hex") === hash;
  }
  return bcrypt.compare(senha, hash || "");
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});