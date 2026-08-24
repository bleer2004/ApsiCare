import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = "ApsiCare";

export const handler = async (event) => {
  try {
    const patientId = event.pathParameters?.id;

    if (!patientId) {
      return response(400, { error: "id é obrigatório" });
    }

    const existing = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
    }));

    if (!existing.Item) {
      return response(404, { error: "Paciente não encontrado" });
    }

    const clinicianId = existing.Item.clinicianId;
    const body = JSON.parse(event.body || "{}");
    const { name, email, phone, birthDate, diagnostico, observacoes } = body;

    const fields = { name, email, phone, birthDate, diagnostico, observacoes };

    let setActions = ["#updatedAt = :updatedAt"];
    const exprNames = { "#updatedAt": "updatedAt" };
    const exprValues = { ":updatedAt": new Date().toISOString() };

    Object.keys(fields).forEach((key) => {
      if (fields[key] !== undefined) {
        setActions.push(`#${key} = :${key}`);
        exprNames[`#${key}`] = key;

        if (key === "email") {
          const emailLower = fields[key].trim().toLowerCase();
          exprValues[":email"] = emailLower;
          setActions.push("GSI1PK = :gsi1pk");
          exprValues[":gsi1pk"] = `EMAIL#${emailLower}`;
        } else {
          exprValues[`:${key}`] = fields[key];
        }
      }
    });

    const updateExpr = "SET " + setActions.join(", ");

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: `PATIENT#${patientId}`, SK: `PATIENT#${patientId}` },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    }));

    // Mantém o item "link" (usado por listar-patients) em sincronia — não tem GSI1PK próprio.
    if (clinicianId) {
      let linkSetActions = ["#updatedAt = :updatedAt"];
      const linkExprNames = { "#updatedAt": "updatedAt" };
      const linkExprValues = { ":updatedAt": new Date().toISOString() };

      Object.keys(fields).forEach((key) => {
        if (fields[key] !== undefined) {
          linkSetActions.push(`#${key} = :${key}`);
          linkExprNames[`#${key}`] = key;
          linkExprValues[`:${key}`] = key === "email" ? fields[key].trim().toLowerCase() : fields[key];
        }
      });

      await dynamo.send(new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: `CLINICIAN#${clinicianId}`, SK: `PATIENT#${patientId}` },
        UpdateExpression: "SET " + linkSetActions.join(", "),
        ExpressionAttributeNames: linkExprNames,
        ExpressionAttributeValues: linkExprValues,
      }));
    }

    return response(200, { message: "Dados do paciente atualizados com sucesso", id: patientId });

  } catch (err) {
    console.error(err);
    return response(500, { error: "Erro interno do servidor" });
  }
};

const response = (statusCode, body) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  },
  body: JSON.stringify(body),
});
