const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Pool = require("pg").Pool;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const createFeedback = (req, res) => {
  const { comment_id, item_id, user_id, comment, rating, username } = req.body;

  try {
    pool.query(
      "INSERT INTO feedbacks(comment_id, item_id, user_id, comment, rating, username) VALUES ( $1, $2, $3, $4, $5, $6)",
      [comment_id, item_id, user_id, comment, rating, username],
      (err, results) => {
        if (err) {
          throw err;
          if (err.code === "23505") {
            return res.status(400).json({ error: "Category already existed" });
          }
          return res.status(500).json({ error: err });
        }
        res.status(200).send(`comment has been added:${results.rows[0].id}`);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
const getFeedback = (req, res) => {
  const { item_id } = req.body;
  try {
    pool.query(
      "SELECT * FROM feedbacks WHERE item_id = $1",
      [item_id],
      (err, results) => {
        if (err) {
          throw err;
        }
        res.status(200).json(results.rows);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  createFeedback,
  getFeedback,
};
