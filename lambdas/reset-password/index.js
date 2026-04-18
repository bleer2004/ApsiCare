import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { code, newPassword } = body;

    if (!code || !newPassword) {
      return response(400, { error: "Código e nova senha são obrigatórios" });
    }

    if (newPassword.length < 6) {
      return response(400, { error: "A senha deve ter pelo menos 6 caracteres" });
    }

    // Busca o token no DynamoDB
    const tokenResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TOKEN#${code}`,
        SK: "RESET"
      }
    }));

    if (!tokenResult.Item) {
      return response(400, { error: "Código inválido ou expirado" });
    }

    const token = tokenResult.Item;

    // Verifica se já foi usado
    if (token.used) {
      return response(400, { error: "Código já utilizado" });
    }

    // Verifica se expirou (TTL pode demorar até 48h pra apagar no DynamoDB)
    const now = Math.floor(Date.now() / 1000);
    if (token.ttl < now) {
      return response(400, { error: "Código inválido ou expirado" });
    }

    // Gera novo hash da senha
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Determina a PK do usuário
    const userPK = `${token.userType}#${token.userId}`;
    const userSK = token.userType === "CLINICIAN" ? "PROFILE" : undefined;

    // Atualiza a senha do usuário
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: userPK,
        SK: userSK || `PATIENT#${token.userId}`
      },
      UpdateExpression: "SET #data.passwordHash = :hash, #data.mustChangePassword = :false",
      ExpressionAttributeNames: {
        "#data": "data"
      },
      ExpressionAttributeValues: {
        ":hash": passwordHash,
        ":false": false
      }
    }));

    // Marca token como usado
    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `TOKEN#${code}`,
        SK: "RESET"
      },
      UpdateExpression: "SET used = :true",
      ExpressionAttributeValues: {
        ":true": true
      }
    }));

    return response(200, { message: "Senha redefinida com sucesso!" });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
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