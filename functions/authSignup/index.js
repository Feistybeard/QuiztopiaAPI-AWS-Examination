const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

exports.handler = async (event, context) => {
  try {
    const { userName, password } = JSON.parse(event.body);

    if (!userName || !password) {
      return sendResponse(400, {
        success: false,
        message: 'Missing username or password',
      });
    }

    const userToCreate = {
      userId: uuidv4(),
      userName,
      password,
    };

    userToCreate.password = await bcrypt.hash(userToCreate.password, 10);

    const checkUserExists = await db
      .scan({
        TableName: 'QuiztopiaUsersTbl',
        FilterExpression: 'userName = :userName',
        ExpressionAttributeValues: {
          ':userName': userToCreate.userName,
        },
      })
      .promise();

    if (checkUserExists.Items.length > 0) {
      return sendResponse(400, {
        success: false,
        message: 'User already exists',
      });
    } else {
      await db
        .put({
          TableName: 'QuiztopiaUsersTbl',
          Item: userToCreate,
        })
        .promise();

      return sendResponse(200, { success: true });
    }
  } catch (error) {
    console.log(error);
    return sendError(500, error);
  }
};
