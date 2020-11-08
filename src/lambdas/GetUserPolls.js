'use strict';
const AWS = require('aws-sdk');
const DYNAMO = new AWS.DynamoDB.DocumentClient();


module.exports.handler = async event => {

  let uid = event.pathParameters.uid;

  if (uid === '') {
    return { 
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(
        {
          message: `uid is invalid`,
        }
      ),
    };
  } 

  const params = {
    TableName: process.env.POLLS,
    IndexName: "UserIdIndex",
    KeyConditionExpression: "#uid = :uid",
    ExpressionAttributeNames: {
      "#uid": "_uid"
    },
    ExpressionAttributeValues: {
      ":uid": uid
    },
  }

  let data;
  try {
    data = await DYNAMO.query(params).promise();
    // if(Object.keys(data).length === 0) throw new Error();
  } catch (error) {
    console.log(error);
    return { 
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(
        {
          message: `poll doesn't exist`,
        }
      ),
    };
  }

  console.log(data);
  let results = [];

  for (const k of data.Items) {
    let item = {};
    item.question = k['_question'];
    item.choices = [];
    for (const k2 of Object.keys(k)) {
      if (k2.startsWith('_')) continue;
      item.choices.push({name: k2, value: k[k2]})
    }

    results.push(item);
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify( results ),
  };
};