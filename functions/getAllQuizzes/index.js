const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');

exports.handler = async (event) => {
  try {
    const allQuizzes = await db
      .scan({
        TableName: 'QuiztopiaQuizzes',
      })
      .promise();

    return sendResponse(200, { success: true, quizzes: allQuizzes.Items });
  } catch (error) {
    return sendError(500, error);
  }
};
