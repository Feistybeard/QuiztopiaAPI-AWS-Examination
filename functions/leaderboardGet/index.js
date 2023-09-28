const { sendResponse, sendError } = require('../../responses');
const { db } = require('../../services/db');

exports.handler = async (event) => {
  try {
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

    const sortedLeaderboard = quiz.Item.leaderboard.sort((a, b) => {
      return b.point - a.point;
    });
    if (sortedLeaderboard.length > 5) {
      sortedLeaderboard.length = 5;
    }

    const userIds = sortedLeaderboard.map((user) => user.userId);
    const users = await db
      .batchGet({
        RequestItems: {
          QuiztopiaUsersTbl: {
            Keys: userIds.map((userId) => ({ userId })),
          },
        },
      })
      .promise();
    if (!users.Responses)
      return sendError(400, { success: false, message: 'Users not found' });

    sortedLeaderboard.forEach((user) => {
      const userObj = users.Responses.QuiztopiaUsersTbl.find(
        (u) => u.userId === user.userId
      );
      user.userName = userObj.userName;
    });

    return sendResponse(200, {
      success: true,
      leaderboard: sortedLeaderboard,
    });
  } catch (error) {
    return sendError(500, error);
  }
};
