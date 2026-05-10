import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const s3 = new S3Client({ region: "sa-east-1" });
const TABLE_NAME = "PsicoCare";
const BUCKET_NAME = process.env.S3_BUCKET;

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;
    const { fileName, fileType, size, uploadedBy } = JSON.parse(event.body);

    if (!patientId || !fileName || !fileType) {
      return response(400, { error: "patientId, fileName e fileType são obrigatórios" });
    }

    const documentId = `${Date.now()}`;
    const s3Key = `documents/${patientId}/${documentId}-${fileName}`;

    // Gera URL pre-assinada pro upload direto no S3
    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        ContentType: fileType,
      }),
      { expiresIn: 300 } // 5 minutos
    );

    // URL pública do arquivo após upload
    const fileUrl = `https://${BUCKET_NAME}.s3.sa-east-1.amazonaws.com/${s3Key}`;

    // Salva metadados no DynamoDB
    await dynamo.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `PATIENT#${patientId}`,
        SK: `DOCUMENT#${documentId}`,
        name: fileName,
        fileType,
        size: size || 0,
        url: fileUrl,
        s3Key,
        uploadedBy: uploadedBy || "CLINICIAN",
        createdAt: new Date().toISOString(),
      }
    }));

    return response(200, {
      documentId,
      uploadUrl,  // frontend usa essa URL pra fazer o upload direto no S3
      fileUrl,    // URL final do arquivo
    });

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