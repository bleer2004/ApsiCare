import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({ region: "sa-east-1" });

const BUCKET = "apsicare-documentos-23012668";
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  const patientId = event.pathParameters?.patientId;
  if (!patientId) return resp(400, { error: "patientId obrigatório" });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return resp(400, { error: "Body inválido" });
  }

  const { nome, tipo, tamanho, uploadedBy } = body;

  if (!nome || !tipo) {
    return resp(400, { error: "nome e tipo são obrigatórios" });
  }

  try {
    const ts = new Date().toISOString();
    const s3Key = `patients/${patientId}/documents/${ts}-${nome}`;

    // gera URL assinada para upload direto do app pro S3
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: tipo,
    });
    const uploadUrl = await getSignedUrl(s3, putCommand, { expiresIn: 300 });

    // salva metadados no DynamoDB
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PATIENT#${patientId}`,
        SK: `DOCUMENT#${ts}`,
        type: "DOCUMENT",
        nome,
        tipo,
        tamanho: tamanho || "Desconhecido",
        s3Key,
        uploadedBy: uploadedBy || "clinician",
        createdAt: ts,
      }
    }));

    return resp(200, {
      message: "URL de upload gerada com sucesso",
      uploadUrl,
      documentId: ts,
      s3Key,
    });
  } catch (err) {
    console.error("ERRO upload:", err);
    return resp(500, { error: "Erro ao gerar URL", details: err.message });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify(body)
});