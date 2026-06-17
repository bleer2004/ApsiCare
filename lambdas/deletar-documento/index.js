import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({ region: "sa-east-1" });

const BUCKET = "apsicare-documentos-23012668";
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  const patientId = event.pathParameters?.patientId;
  const documentId = event.pathParameters?.documentId;

  console.log("DELETE recebido:", { patientId, documentId });

  if (!patientId || !documentId) {
    return resp(400, { error: "patientId e documentId são obrigatórios" });
  }

  try {
    const decodedId = decodeURIComponent(documentId);
    const sk = `DOCUMENT#${decodedId}`;
    
    console.log("Buscando SK:", sk);

    const getResult = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: sk
      }
    }));

    if (!getResult.Item) {
      console.log("Documento não encontrado");
      return resp(404, { error: "Documento não encontrado" });
    }

    const doc = getResult.Item;
    console.log("Doc encontrado:", doc.nome, "s3Key:", doc.s3Key);

    if (doc.s3Key) {
      try {
        await s3.send(new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: doc.s3Key,
        }));
        console.log("S3 deletado");
      } catch (s3err) {
        console.error("Erro S3:", s3err);
      }
    }

    await dynamo.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PATIENT#${patientId}`,
        SK: sk,
      }
    }));
    console.log("DynamoDB deletado");

    return resp(200, { message: "Documento deletado com sucesso" });

  } catch (err) {
    console.error("ERRO:", err);
    return resp(500, { error: "Erro ao deletar", details: err.message });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});