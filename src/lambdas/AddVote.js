'use strict';
const AWS = require('aws-sdk');
const DYNAMO = new AWS.DynamoDB.DocumentClient();


module.exports.handler = async event => {

  console.log(event);

  // {
  //   choice: "choice"
  // }

  let id = event.pathParameters.id;
  let ip = event.requestContext.identity.sourceIp;
  
  if (id === '') {
    return { 
      statusCode: 404,
      headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        {
          message: `id is invalid`,
        }
      ),
    };
  }

  let body;
  try {
    body = JSON.parse(event.body);
    if (!('choice' in body)) throw new Error('must specify a choice');
  } catch(error) {
    return {
      statusCode: 400,
      headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        {
          message: error.message
        }
      ),
    }; 
  }

  // TODO this doesn't really work for some reason
  if ( `${id}=true` in event.multiValueHeaders.Cookie){
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        {
          message: "this browser has already voted"
        }
      ),
    };
  } else {
    const params3 = {
      TableName: process.env.VOTES,
      Key: {
        "_id": id,
        "_ip": ip
      },
    }

    try {
      let data = await DYNAMO.get(params3).promise();
      if(Object.keys(data).length !== 0) throw new Error('already voted');
    } catch (error) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': true,
        },
        body: JSON.stringify(
          {
            message: error.message
          }
        )
      };
    }
  }


  const params = {
    TableName: process.env.POLLS,
    Key: {
      "_id": id
    },
    UpdateExpression: `set #att = #att + :val`,
    ExpressionAttributeValues: {
      ":val": 1
    },
    ExpressionAttributeNames: {
      "#att": body.choice
    }
  }

  const params2 = {
    TableName: process.env.VOTES,
    Item: {
      "_id": id,
      "_ip": ip
    },
  }
  
  try {
    await DYNAMO.update(params).promise();
    await DYNAMO.put(params2).promise();
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true,
      },
      body: JSON.stringify(
        {
          message: error.message
        }
      )
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": `${id}=true`,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(
      {
        message: 'vote successful',
      }
    ),
  };
};
