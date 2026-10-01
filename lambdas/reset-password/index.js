import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const { code, newPassword } = JSON.parse(event.body || "{}");
    if (!code || !newPassword) {
      return response(400, { error: "code e newPassword são obrigatórios" });
    }
    if (newPassword.length < 6) {
      return response(400, { error: "A senha deve ter no mínimo 6 caracteres" });
    }

    // 1. Busca e valida o token de novo (por segurança)
    const tokenResult = await dynamo.send(new GetCommand({
      TableName: "ApsiCare",
      Key: { PK: `TOKEN#${code}`, SK: "RESET" }
    }));

    const token = tokenResult.Item;
    if (!token || token.used || token.ttl < Math.floor(Date.now() / 1000)) {
      return response(400, { error: "Sessão de redefinição inválida" });
    }

    const newHash = await bcrypt.hash(newPassword, 8);

    // 3. Atualiza o usuário e LIMPA o objeto 'data' antigo (Flat Pattern)
    await dynamo.send(new UpdateCommand({
      TableName: "ApsiCare",
      Key: { PK: `${token.userType}#${token.userId}`, SK: "PROFILE" },
      UpdateExpression: "SET passwordHash = :hash, updatedAt = :now REMOVE #old",
      ExpressionAttributeNames: { "#old": "data" },
      ExpressionAttributeValues: { ":hash": newHash, ":now": new Date().toISOString() }
    }));

    // 4. Invalida o token
    await dynamo.send(new UpdateCommand({
      TableName: "ApsiCare",
      Key: { PK: `TOKEN#${code}`, SK: "RESET" },
      UpdateExpression: "SET used = :true",
      ExpressionAttributeValues: { ":true": true }
    }));

    return response(200, { message: "Senha alterada com sucesso!" });
  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro ao redefinir senha" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
  body: JSON.stringify(body)
});