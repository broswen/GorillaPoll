'use strict';
const AWS = require('aws-sdk');
const DYNAMO = new AWS.DynamoDB.DocumentClient();


module.exports.handler = async event => {

  let id = event.pathParameters.id;

  if (id === '') {
    return { 
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(
        {
          message: `id is invalid`,
        }
      ),
    };
  } 

  const params = {
    TableName: process.env.POLLS,
    Key: {
      "_id": id
    }
  }

  let data;
  try {
    data = await DYNAMO.get(params).promise();
    if(Object.keys(data).length === 0) throw new Error();
  } catch (error) {
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

  let results = {
    id: data.Item['_id'],
    question: data.Item['_question'],
    choices: []
  };

  for (let k of Object.keys(data.Item)) {
    if (k === '_id' || k === '_question' || k === '_ttl') continue;
    results.choices.push({value: k, votes: data.Item[k]});
  }

  console.log(data);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify( results ),
  };
};