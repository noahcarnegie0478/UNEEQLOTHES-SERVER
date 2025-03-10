const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Pool = require("pg").Pool;
const pool = new Pool({
  user: "me",
  host: "localhost",
  database: "api",
  password: "password",
  port: 5432,
});
//get: /api | displayHome()

//get: /api/users | getUsers()
const getUsers = (req, res) => {
  pool.query("SELECT * FROM users ORDER BY id ASC", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};
//get: /api/users/:id | getUserById()

const getUserById = (req, res) => {
  const id = parseInt(req.params.id);
  pool.query("SELECT * FROM users WHERE id = $1", [id], (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};
//post: /api/users/register | createUser()
const createUser = (req, res) => {
  const { name, email } = req.body;
  pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email],
    (err, results) => {
      if (err) {
        throw err;
      }
      res.status(200).send(`User added with id:${results.rows[0].id}`);
    }
  );
};
//PUT: /api/users/:id | updateUser()

const updateUser = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email } = req.body;
  pool.query(
    "UPDATE users SET name = $1, email = $2 WHERE id = $3",
    [name, email, id],

    (err, results) => {
      if (err) {
        throw err;
      }
      res.status(200).send(`User modified with id:${id}`);
    }
  );
};
//DELETE: /api/users/:id | deleteUser()
const deleteUser = (req, res) => {
  const id = parseInt(req.params.id);

  pool.query(
    "DELETE FROM users WHERE id = $1",
    [id],

    (err, results) => {
      if (err) {
        throw err;
      }
      res.status(200).send(`User has been deleted with id:${id}`);
    }
  );
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
