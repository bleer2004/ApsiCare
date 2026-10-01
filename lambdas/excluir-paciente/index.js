// DELETE /clinicians/{clinicianId}/patients/{patientId}
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand, BatchWriteCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({ region: "sa-east-1" });
const TABLE_NAME = "ApsiCare";
const BUCKET = "apsicare-documentos-23012668";

const buscarTodos = async (params) => {
  const itens = [];
  let ExclusiveStartKey;
  do {
    const res = await dynamo.send(new QueryCommand({ ...params, ExclusiveStartKey }));
    itens.push(...(res.Items || []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return itens;
};

const apagarChaves = async (chaves) => {
  for (let i = 0; i < chaves.length; i += 25) {
    let pendentes = { [TABLE_NAME]: chaves.slice(i, i + 25).map((Key) => ({ DeleteRequest: { Key } })) };
    while (pendentes[TABLE_NAME]?.length) {
      const res = await dynamo.send(new BatchWriteCommand({ RequestItems: pendentes }));
      pendentes = res.UnprocessedItems || {};
    }
  }
};

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;
    const patientId = event.pathParameters?.patientId;
    if (!clinicianId || !patientId) {
      return response(400, { error: "clinicianId e patientId são obrigatórios" });
    }

    const perfil = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
    }));
    if (!perfil.Item) return response(404, { error: "Paciente não encontrado" });
    if (perfil.Item.clinicianId !== clinicianId) {
      return response(403, { error: "Este paciente não pertence a este profissional" });
    }

    const itensPaciente = await buscarTodos({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": `PATIENT#${patientId}` },
    });

    for (const item of itensPaciente) {
      if (item.s3Key) {
        try {
          await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: item.s3Key }));
        } catch (s3err) {
          console.error("Erro ao apagar arquivo no S3:", item.s3Key, s3err);
        }
      }
    }

    const notificacoes = await buscarTodos({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      FilterExpression: "#data.patientId = :patientId",
      ExpressionAttributeNames: { "#data": "data" },
      ExpressionAttributeValues: {
        ":pk": `CLINICIAN#${clinicianId}`,
        ":prefix": "NOTIFICATION#",
        ":patientId": patientId,
      },
    });

    await apagarChaves([
      ...itensPaciente.map(({ PK, SK }) => ({ PK, SK })),
      ...notificacoes.map(({ PK, SK }) => ({ PK, SK })),
      { PK: `CLINICIAN#${clinicianId}`, SK: `PATIENT#${patientId}` },
    ]);

    return response(200, { message: "Paciente e todos os seus dados foram excluídos", itensApagados: itensPaciente.length });
  } catch (err) {
    console.error("ERRO excluir-paciente:", err);
    return response(500, { error: "Erro interno ao excluir paciente" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body),
});
