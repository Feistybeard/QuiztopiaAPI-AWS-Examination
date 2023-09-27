const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

async function getUser(userName) {
  try {
    const user = await db
      .scan({
        TableName: 'QuiztopiaUsersTbl',
        FilterExpression: 'userName = :userName',
        ExpressionAttributeValues: {
          ':userName': userName,
        },
      })
      .promise();
    if (user.Items.length > 0) {
      return user.Items[0];
    } else {
      return false;
    }
  } catch (error) {
    console.log(error);
  }
}

exports.handler = async (event, context) => {
  try {
    const { userName, password } = JSON.parse(event.body);
    if (!userName || !password) {
      return sendResponse(400, {
        success: false,
        message: 'Missing username or password',
      });
    }

    const checkUserExists = await getUser(userName);
    if (!checkUserExists) {
      return sendResponse(400, {
        success: false,
        message: 'User does not exist',
      });
    }

    const checkPassword = await bcrypt.compare(
      password,
      checkUserExists.password
    );
    if (!checkPassword) {
      return sendResponse(400, {
        success: false,
        message: 'Incorrect password',
      });
    }

    const token = jwt.sign(
      {
        userName: checkUserExists.userName,
        userId: checkUserExists.userId,
      },
      'secretpassword'
    );

    return sendResponse(200, {
      success: true,
      token: token,
    });
  } catch (error) {
    console.log(error);
    return sendError(500, error);
  }
};
