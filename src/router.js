const express = require('express');
const router = express.Router();
const con = require('./db');
const middleware = require('./middleware');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
require('dotenv').config();

router.get('/', (req, res) => {
  res.send('The API service works!');
});
router.get('/verify', middleware.isLoggedIn, (req, res) => {
  res.status(200).json({ msg: 'ok' });
});

router.post('/register', middleware.validateRegistration, (req, res) => {
  const username = req.body.username.toLowerCase();
  con.query(
    `SELECT * FROM users WHERE username = ${mysql.escape(username)}`,
    (err, result) => {
      if (err) {
        res.status(400).json({ msg: 'The db has issued an error' });
      } else if (result.length !== 0) {
        res.status(400).json({ msg: 'Username already exists' });
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            res.status(400).json(err);
          } else {
            con.query(
              `INSERT INTO users (username, password, reg_date) VALUES (${mysql.escape(
                username
              )}, ${mysql.escape(hash)}, now())`,
              (err, result) => {
                if (err) {
                  res.status(400).json(err);
                } else {
                  res.status(201).json({ msg: 'Successfully registered!' });
                }
              }
            );
          }
        });
      }
    }
  );
});

router.post('/login', middleware.validateLogin, (req, res) => {
  const username = req.body.username.toLowerCase();

  con.query(
    `SELECT * from users WHERE username = ${mysql.escape(username)}`,
    (err, result) => {
      if (err) {
        res.status(400).json(err);
      } else {
        if (result.length !== 0) {
          bcrypt.compare(
            req.body.password,
            result[0].password,
            (bErr, bResult) => {
              if (bErr || !bResult) {
                res.status(400).json({
                  msg: 'Username or password is incorrect',
                });
              } else {
                if (bResult) {
                  const token = jwt.sign(
                    {
                      userId: result[0].id,
                      username: result[0].username,
                    },
                    process.env.SECRETKEY,
                    {
                      expiresIn: '7d',
                    }
                  );
                  con.query(
                    `UPDATE users SET last_login = now() WHERE id = '${result[0].id}'`
                  );
                  res.status(200).json({ msg: 'Logged In', token });
                }
              }
            }
          );
        } else {
          res
            .status(401)
            .json({ msg: `No user "${username}" found, please register!` });
        }
      }
    }
  );
});

router.post(
  '/add-book',
  middleware.validateBooksForm,
  middleware.isLoggedIn,
  (req, res) => {
    const userId = req.userData.userId;
    const author = req.body.author;
    const title = req.body.title;

    console.log(userId);
    con.query(
      `INSERT INTO books (user_id, author, title) VALUES (${mysql.escape(
        userId
      )}, ${mysql.escape(author)}, ${mysql.escape(title)})`,
      (err, result) => {
        if (err) {
          res.status(400).json(err);
        } else {
          res
            .status(201)
            .json({ msg: 'Successfully added the book to the database!' });
        }
      }
    );
  }
);

router.get('/books', middleware.isLoggedIn, (req, res) => {
  const userId = req.userData.userId;

  con.query(
    `SELECT * FROM books where user_id = ${mysql.escape(userId)}`,
    (err, result) => {
      if (err) throw err;
      res.json(result);
    }
  );
});
module.exports = router;
