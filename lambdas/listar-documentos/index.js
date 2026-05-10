import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.patientId;

    if (!patientId) {
      return response(400, { error: "patientId é obrigatório" });
    }

    const result = await dynamo.send(new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": `PATIENT#${patientId}`,
        ":sk": "DOCUMENT#"
      }
    }));

    const documents = (result.Items || []).map(item => ({
      id: item.SK.split("#")[1],
      name: item.name,
      type: item.fileType,
      size: item.size,
      url: item.url,
      uploadedBy: item.uploadedBy,
      createdAt: item.createdAt,
    }));

    return response(200, { documents });

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