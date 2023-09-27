const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');

exports.handler = async (event) => {
  try {
    const { quizId } = event.pathParameters;
    const quiz = await db
      .get({
        TableName: 'QuiztopiaQuizzesTbl',
        Key: {
          quizId: quizId,
        },
      })
      .promise();

    if (!quiz.Item)
      return sendError(400, { success: false, message: 'Quiz not found' });

    return sendResponse(200, { success: true, quiz: quiz.Item });
  } catch (error) {
    return sendError(500, error);
  }
};
