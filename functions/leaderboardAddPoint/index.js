const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');
const middy = require('@middy/core');
const { validateToken } = require('../../middleware/auth');

const handler = middy()
  .handler(async (event) => {
    try {
      if (!event?.userId || (event?.error && event?.error === '401'))
        return sendError(401, { success: false, message: 'Invalid token' });

      const { userId } = event;
      const { points } = JSON.parse(event.body);
      if (!points)
        return sendError(400, {
          success: false,
          message: 'Missing point to add',
        });
      const { quizId } = event.pathParameters;
      if (!quizId)
        return sendError(400, { success: false, message: 'Missing quizId' });

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

      const { leaderboard } = quiz.Item;
      const userIndex = leaderboard.findIndex((user) => user.userId === userId);
      if (userIndex === -1) {
        leaderboard.push({
          userId,
          points,
        });
      } else {
        leaderboard[userIndex].points += points;
      }

      await db
        .update({
          TableName: 'QuiztopiaQuizzesTbl',
          Key: {
            quizId: quizId,
          },
          UpdateExpression: 'SET leaderboard = :leaderboard',
          ExpressionAttributeValues: {
            ':leaderboard': leaderboard,
          },
          ReturnValues: 'UPDATED_NEW',
        })
        .promise();

      return sendResponse(200, { success: true });
    } catch (error) {
      return sendError(500, error);
    }
  })
  .use(validateToken);

module.exports = { handler };
