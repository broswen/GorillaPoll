'use strict';

const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const DYNAMO = new AWS.DynamoDB.DocumentClient();

module.exports.handler = async event => {

  // {
  //   question: "what is the answer?",
  //   answers: ["one", "two", "three"]
  // }

  let body;
  try {
    body = JSON.parse(event.body);
    if (!('question' in body)) throw new Error('must specify question');
    if (!('choices' in body)) throw new Error('must specify choices');
    if (body.choices.length < 1 || body.choices.length > 10) throw new Error('invalid amount of choices');
    for (let c of body.choices) {
      if(c.startsWith("_")) throw new Error('choices must not start with underscores _');
    }
  } catch(error) {
    return {
      statusCode: 400,
      body: JSON.stringify(
        {
          message: error.message
        }
      ),
    }; 
  }

  let id = uuidv4();

  let params = {
    TableName: process.env.POLLS,
    Item: {
      "_id": id,
      "_question": body.question,
      "_ttl": (new Date().getTime()/1000) + (60 * 60 * 24) // open for 24 hours
    }
  }

  for (let c of body.choices) {
    params.Item[c] = 0
  }

  console.log(params);

  try {
    await DYNAMO.put(params).promise();
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          message: error.message
        }
      )
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        link: id
      }
    ),
  };
};
