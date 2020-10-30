'use strict';
const AWS = require('aws-sdk');
const DYNAMO = new AWS.DynamoDB.DocumentClient();


module.exports.handler = async event => {

  let id = event.pathParameters.id;
  
  if (id === '') {
    return { 
      statusCode: 404,
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
      body: JSON.stringify(
        {
          message: `poll doesn't exist`,
        }
      ),
    };
  }

  console.log(data);

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        question: data.Item['_question'],
        choices: Object.keys(data.Item).filter(k => k !== '_id' && k !== '_question'),
      }
    ),
  };
};
