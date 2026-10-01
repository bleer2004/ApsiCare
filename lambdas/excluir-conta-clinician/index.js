// POST /clinicians/{clinicianId}/excluir-conta  { password }
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

const senhaConfere = async (senha, hash) => {
  if (/^[a-f0-9]{64}$/.test(hash || "")) {
    return createHash("sha256").update(senha).digest("hex") === hash;
  }
  return bcrypt.compare(senha, hash || "");
};

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;
    const { password } = JSON.parse(event.body || "{}");
    if (!clinicianId || !password) {
      return response(400, { error: "clinicianId e password são obrigatórios" });
    }

    const perfil = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `CLINICIAN#${clinicianId}`, SK: "PROFILE" },
    }));
    if (!perfil.Item) return response(404, { error: "Profissional não encontrado" });

    if (!(await senhaConfere(password, perfil.Item.passwordHash))) {
      return response(401, { error: "Senha incorreta" });
    }

    const itens = [];
    let ExclusiveStartKey;
    do {
      const res = await dynamo.send(new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `CLINICIAN#${clinicianId}` },
        ExclusiveStartKey,
      }));
      itens.push(...(res.Items || []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    const pacientes = itens.filter((i) => i.SK.startsWith("PATIENT#"));
    if (pacientes.length > 0) {
      return response(409, {
        error: `Você ainda tem ${pacientes.length} paciente(s) cadastrado(s). Exclua os pacientes antes de excluir sua conta.`,
        pacientes: pacientes.length,
      });
    }

    const chaves = itens.map(({ PK, SK }) => ({ PK, SK }));
    for (let i = 0; i < chaves.length; i += 25) {
      let pendentes = { [TABLE_NAME]: chaves.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } })) };
      while (pendentes[TABLE_NAME]?.length) {
        const res = await dynamo.send(new BatchWriteCommand({ RequestItems: pendentes }));
        pendentes = res.UnprocessedItems || {};
      }
    }

    return response(200, { message: "Conta excluída com sucesso" });
  } catch (err) {
    console.error("ERRO excluir-conta-clinician:", err);
    return response(500, { error: "Erro interno ao excluir conta" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
