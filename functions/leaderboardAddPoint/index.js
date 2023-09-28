const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');

exports.handler = async (event) => {
  try {
    const { point, userId } = JSON.parse(event.body);
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
        point,
      });
    } else {
      leaderboard[userIndex].point += point;
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

    return sendResponse(200, { success: true, leaderboard: leaderboard });
  } catch (error) {
    return sendError(500, error);
  }
};
