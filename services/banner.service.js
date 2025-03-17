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

//get: /api/banner | getBaners()
const getBanners = (req, res) => {
  pool.query("SELECT * FROM banner ORDER BY id ASC", (error, results) => {
    if (error) {
      throw error;
    }
    res.status(200).json(results.rows);
  });
};
//post: /api/banner/create createBanner
const createBanner = (req, res) => {
  const {
    topic,
    order_no,
    type_of_banner,
    title,
    description,
    sub_description,
    description_color,
    sub_description_color,
    price,
    url,
    image,
    first_date,
    end_date,
  } = req.body;

  try {
    pool.query(
      "INSERT INTO banner (topic, order_no ,type_of_banner ,title ,description,sub_description, description_color ,sub_description_color,  price, url , image , first_date ,end_date) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *",
      [
        topic,
        order_no,
        type_of_banner,
        title,
        description,
        sub_description,
        description_color,
        sub_description_color,
        price,
        url,
        image,
        first_date,
        end_date,
      ],
      (err, results) => {
        if (err) {
          throw err;
          if (err.code === "23505") {
            return res.status(400).json({ error: "Banner already existed" });
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
  getBanners,
  createBanner,
};
