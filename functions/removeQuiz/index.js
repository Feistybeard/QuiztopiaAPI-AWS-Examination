const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');
const middy = require('@middy/core');
const { validateToken } = require('../../middleware/auth');

const handler = middy()
  .handler(async (event) => {
    try {
      if (!event?.userId || (event?.error && event?.error === '401'))
        return sendError(401, { success: false, message: 'Invalid token' });

      const { quizId } = event.pathParameters;
      const { userId } = event;
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

      if (quiz.Item.userId !== userId)
        return sendError(401, {
          success: false,
          message: 'Not authorized to delete this quiz',
        });

      await db
        .delete({
          TableName: 'QuiztopiaQuizzesTbl',
          Key: {
            quizId: quizId,
          },
        })
        .promise();

      return sendResponse(200, { success: true });
    } catch (error) {
      return sendError(500, error);
    }
  })
  .use(validateToken);

module.exports = { handler };
