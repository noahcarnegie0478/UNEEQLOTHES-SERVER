const express = require("express");

const Pool = require("pg").Pool;
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
const app = express();
app.use(express.json());
//get: /api/banner | getItems()
const getItems = (req, res) => {
  pool.query("SELECT * FROM items ORDER BY id ASC", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};
//post: /api/banner/create createItems
const createItems = (req, res) => {
  const {
    item_id,
    category,
    topic,
    title,
    sizes,
    stock,
    colors,
    image_paths,
    material,
    feature_details,
    rating,
    fabric_detail,
    washing_instruction,
    category_id,
    price,
  } = req.body;

  try {
    pool.query(
      "INSERT INTO items (item_id, category, topic, title, sizes, stock, colors, image_paths, material,feature_details, rating, fabric_detail, washing_instruction,category_id,price) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *",
      [
        item_id,
        category,
        topic,
        title,
        sizes,
        stock,
        JSON.stringify(colors),
        image_paths,
        material,
        JSON.stringify(feature_details),
        rating,
        fabric_detail,
        washing_instruction,
        category_id,
        price,
      ],
      (err, results) => {
        console.log(req.body);
        if (err) {
          // @REVIEW - `throw err` will happen before everything else so the remaining logic will be useless
          throw err;
          if (err.code === "23505") {
            return res.status(400).json({ error: "Items already existed" });
          }
          return res.status(500).json({ error: err });
        }
        res
          .status(200)
          .send(`Items has been added with id:${results.rows[0].id}`);
      },
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

const testing = (req, res) => {
  const { colors } = req.body;

  try {
    pool.query(
      "INSERT INTO testingjson (colors) VALUES ($1) RETURNING *",
      [JSON.stringify(colors)],
      (err, results) => {
        console.log(req.body);
        if (err) {
          if (err.code === "23505") {
            return res.status(400).json({ error: "Items already existed" });
          }
          return res.status(500).json({ error: err });
        }
        res
          .status(200)
          .send(`Items has been added with id:${results.rows[0].id}`);
      },
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getItems,
  createItems,
  testing,
};

// item_id, category, topic, title, sizes, stock, colors, image_paths, material,feature_details, rating, fabric_detail, washing_instruction

// '[ {
//             "name": "Red",
//             "code": "31",
//             "color_image": "1c381cef65afb24867d0d0f0643eeb58.png"
//         },
//         {
//             "name": "Blue",
//             "code": "45",
//             "color_image": "abcde123456789.png"
//         }]'
