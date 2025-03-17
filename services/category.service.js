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

//get: /api/category | getCategory()
const getCategory = (req, res) => {
  pool.query("SELECT * FROM categories ORDER BY id ASC", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};
//post: /api/category/create createCategory
const createCategory = (req, res) => {
  const { category_id, tag, title, image_path, recommendations } = req.body;

  try {
    pool.query(
      "INSERT INTO categories ( category_id ,tag ,title ,image_path ,recommendations) VALUES ($1, $2, $3,$4,$5) RETURNING *",
      [category_id, tag, title, image_path, recommendations],
      (err, results) => {
        if (err) {
          throw err;
          if (err.code === "23505") {
            return res.status(400).json({ error: "Category already existed" });
          }
          return res.status(500).json({ error: err });
        }
        res
          .status(200)
          .send(`Banner has been added with id:${results.rows[0].id}`);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getCategory,
  createCategory,
};
