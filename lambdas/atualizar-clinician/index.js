import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "sa-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "PsicoCare";

export const handler = async (event) => {
  try {
    const clinicianId = event.pathParameters?.clinicianId;

    if (!clinicianId) {
      return response(400, { error: "clinicianId ausente" });
    }

    const key = {
      PK: `CLINICIAN#${clinicianId}`,
      SK: "PROFILE"
    };

    console.log("PATH PARAMS:", event.pathParameters);
    console.log("CLINICIAN ID:", clinicianId);
    console.log("PK MONTADA:", `CLINICIAN#${clinicianId}`);

    console.log("KEY USADA:", key);

    const existing = await dynamo.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: key
    }));

    console.log("EXISTE?", existing.Item);

    if (!existing.Item) {
      return response(404, { error: "Não encontrado" });
    }

    const body = JSON.parse(event.body);

    let setActions = ["#updatedAt = :updatedAt"];
    let removeActions = ["#oldData"]; 
    
    const exprNames = { 
      "#updatedAt": "updatedAt",
      "#oldData": "data" 
    };
    const exprValues = { 
      ":updatedAt": new Date().toISOString() 
    };

    const fields = {
      name: body.name,
      phone: body.phone,
      cellphone: body.cellphone,  
      councilId: body.councilId,      
      profession: body.profession,
      especialidade: body.especialidade,
      clinica: body.clinica,
      enderecoClinica: body.enderecoClinica,
      birthDate: body.birthDate,
      email: body.email 
    };

    Object.keys(fields).forEach(key => {
      if (fields[key] !== undefined) {
        setActions.push(`#${key} = :${key}`);
        exprNames[`#${key}`] = key;
        
        if (key === 'email') {
          const emailLower = fields[key].trim().toLowerCase();
          exprValues[`:email`] = emailLower;
          
          setActions.push(`GSI1PK = :gsi1pk`);
          exprValues[":gsi1pk"] = `EMAIL#${emailLower}`;
        } else {
          exprValues[`:${key}`] = fields[key];
        }
      }
    });

    let updateExpr = "SET " + setActions.join(", ");
    updateExpr += " REMOVE " + removeActions.join(", ");

    console.log("UPDATE EXPRESSION FINAL:", updateExpr);

    await dynamo.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues
    }));

    return response(200, {
      message: "Atualizado com sucesso",
      id: clinicianId
    });

  } catch (err) {
    console.error("ERRO PUT:", err);
    return response(500, { error: "Erro interno" });
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