const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');
const { v4: uuidv4 } = require('uuid');
const middy = require('@middy/core');
const { validateToken } = require('../../middleware/auth');

const handler = middy()
  .handler(async (event) => {
    try {
      if (!event?.userId || (event?.error && event?.error === '401'))
        return sendError(401, { success: false, message: 'Invalid token' });

      const { quizName } = JSON.parse(event.body);
      if (!quizName)
        return sendError(400, { success: false, message: 'Missing quizName' });
      const quizNameCheck = await db
        .scan({
          TableName: 'QuiztopiaQuizzesTbl',
          FilterExpression: 'quizName = :quizName',
          ExpressionAttributeValues: {
            ':quizName': quizName,
          },
        })
        .promise();
      if (quizNameCheck.Items.length > 0) {
        return sendError(400, {
          success: false,
          message: 'Quiz name already exists',
        });
      }

      const quizId = uuidv4();
      const quiz = {
        quizId,
        quizName,
        questions: [],
        userId: event.userId,
        leaderboard: [],
      };

      await db
        .put({
          TableName: 'QuiztopiaQuizzesTbl',
          Item: quiz,
        })
        .promise();

      return sendResponse(200, { success: true, quizId: quizId });
    } catch (error) {
      return sendError(500, error);
    }
  })
  .use(validateToken);

module.exports = { handler };
