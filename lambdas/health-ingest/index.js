import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body);
        const { userId, samples } = body;

        if (!userId || !samples || !Array.isArray(samples)) {
            return response(400, { error: "Dados inválidos. 'userId' e 'samples' (array) são obrigatórios." });
        }

        const timestamp = new Date().toISOString();
        const batchId = Date.now().toString();

        const item = {
            PK: `PATIENT#${userId}`,
            SK: `HEALTH_BATCH#${batchId}`,
            type: "HEALTH_DATA",
            createdAt: timestamp,
            dataPoints: samples, 
            count: samples.length
        };

        await dynamo.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: item
        }));

        console.log(`Sucesso! Salvas ${samples.length} linhas para o usuário ${userId}`);

        return response(200, { 
            message: "Dados recebidos com sucesso!",
            batchId: batchId 
        });

    } catch (error) {
        console.error("Erro no processamento:", error);
        return response(500, { error: "Erro interno no servidor", details: error.message });
    }
};

const response = (statusCode, body) => ({
    statusCode,
    headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
});