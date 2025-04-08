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
          throw err;
          if (err.code === "23505") {
            return res.status(400).json({ error: "Items already existed" });
          }
          return res.status(500).json({ error: err });
        }
        res
          .status(200)
          .send(`Items has been added with id:${results.rows[0].id}`);
      }
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
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

//find items by category
const CategoryListing = (req, res) => {
  const { topic, category } = req.body;
  pool.query(
    "SELECT * FROM items where topic = $1 and category = $2 ORDER BY id ASC",
    [topic, category],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
};
//find items by any keywords
const GetFullText = (req, res) => {
  const { input } = req.body;
  pool.query(
    "SELECT * FROM items WHERE search_vector @@ to_tsquery('english', $1)",
    [input],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
};
// find items in wishlist
const getWishList = (req, res) => {
  const { wishlist } = req.body;
  console.log("wish list: ", wishlist);
  const itemInWishList = `(${wishlist.join()})`;
  console.log("wish list after change: ", itemInWishList);

  pool.query(
    "SELECT * FROM items WHERE item_id in ($1)",
    [itemInWishList],
    (error, results) => {
      if (error) {
        throw error;
      }
      res.status(200).json(results.rows);
    }
  );
};
const setTheRighString = ([]) => {};
//filter items
const filterItems = async (req, res) => {
  const { colors, material, price } = await req.body;
  const priceElement = price.split(" ");
  //scenerios:
  // just colour -
  try {
    if (colors !== "*" && material === "*" && price === "*") {
      pool.query(
        "SELECT * FROM items WHERE search_vector @@ to_tsquery('english', $1)",
        [colors],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
    // just material -
    else if (colors === "*" && material !== "*" && price === "*") {
      pool.query(
        "SELECT * FROM items WHERE material = $1",
        [material],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
    // just price -
    else if (colors === "*" && material === "*" && price !== "*") {
      pool.query(
        "SELECT * FROM items WHERE price between $1 and $2",
        [priceElement[0], priceElement[priceElement.length - 1]],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
    // colour and material -
    else if (colors !== "*" && material !== "*" && price === "*") {
      pool.query(
        "SELECT * FROM items WHERE search_vector @@ to_tsquery('english', $1) and material = $2",
        [colors, material],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
    // colour and price -
    else if (colors !== "*" && material === "*" && price !== "*") {
      pool.query(
        "SELECT * FROM items WHERE search_vector @@ to_tsquery('english', $1) and price between $2 and $3",
        [colors, priceElement[0], priceElement[priceElement.length - 1]],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
    // material and price -
    else if (colors === "*" && material !== "*" && price !== "*") {
      pool.query(
        "SELECT * FROM items WHERE price between $1 and $2 and material = $3",
        [priceElement[0], priceElement[priceElement.length - 1], material],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
    // material-price-colour
    else if (colors !== "*" && material !== "*" && price !== "*") {
      pool.query(
        "SELECT * FROM items WHERE search_vector @@ to_tsquery('english', $1) and price between $2 and $3 and material = $4",
        [
          colors,
          priceElement[0],
          priceElement[priceElement.length - 1],
          material,
        ],
        (error, results) => {
          if (error) {
            throw error;
          }
          res.status(200).json(results.rows);
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};

// select * from items where topic = 'Men' and category = 'T-shirt';
module.exports = {
  getItems,
  createItems,
  testing,
  CategoryListing,
  GetFullText,
  filterItems,
  getWishList,
};
