const jwt = require('jsonwebtoken');

const validateToken = {
  before: async (request) => {
    try {
      const token = request.event.headers.authorization.replace('Bearer ', '');

      if (!token) throw new Error();

      const data = jwt.verify(token, 'secretpassword');
      request.event.userId = data.userId;
      request.event.userName = data.userName;

      return request.response;
    } catch (error) {
      request.event.error = '401';
      return request.response;
    }
  },
  onError: async (request) => {
    request.event.error = '401';
    return request.response;
  },
};

module.exports = { validateToken };
