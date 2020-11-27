const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
  validateRegistration: (req, res, next) => {
    if (
      !req.body.username ||
      req.body.username.length < 6 ||
      req.body.username.length > 20
    ) {
      return res
        .status(400)
        .json({ msg: 'Username does not follow the rules' });
    }

    if (
      !req.body.password ||
      req.body.password.length < 8 ||
      req.body.password.length > 64
    ) {
      return res
        .status(400)
        .json({ msg: 'Password does not follow the rules' });
    }
    next();
  },
  validateLogin: (req, res, next) => {
    if (!req.body.username || !req.body.password) {
      return res
        .status(400)
        .json({ msg: 'Please enter username and password!' });
    }
    next();
  },
  validateBooksForm: (req, res, next) => {
    if (!req.body.author || !req.body.title) {
      return res
        .status(400)
        .json({ msg: 'Please enter author and title of the book!' });
    }
    next();
  },

  isLoggedIn: (req, res, next) => {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decodedToken = jwt.verify(token, process.env.SECRETKEY);
      req.userData = decodedToken;
    } catch (err) {
      return res
        .status(401)
        .json({ msg: 'Please login to process this action!' });
    }
    next();
  },
};
