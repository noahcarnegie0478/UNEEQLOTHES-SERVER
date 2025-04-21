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
const bcrypt = require("bcrypt");
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

//get user by email
const getUserbyEmail = async email => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    console.log(result.rows[0]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

//get: /api/users/:id | getUserById()
const getUserById = async id => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0];
  } catch (error) {
    throw error;
  }
};
//post: /api/users/register | createUser()
const createUser = async (req, res) => {
  const { username, email, password, dob } = req.body;
  const role = "user";
  const subscribed = true;
  const credit = 0;
  const coupon = "Discount 10%";
  const favourite = [];
  const processing = false;
  const paid_items = [];

  const salt = await bcrypt.genSalt();
  const hashedPassword = await bcrypt.hash(password, salt);
  try {
    pool.query(
      "INSERT INTO users (username, email, role, subscribed, credit, coupon, password, date_of_birth, favourite, processing, paid_items) VALUES ($1, $2, $3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *",
      [
        username,
        email,
        role,
        subscribed,
        credit,
        coupon,
        hashedPassword,
        dob,
        favourite,
        processing,
        paid_items,
      ],
      (err, results) => {
        if (err) {
          if (err.code === "23505") {
            return res.status(400).json({ error: "Email already existed" });
          }
          return res.status(500).json({ error: "Database error" });
        }
        res.status(200).send(`User added with id:${results.rows[0].id}`);
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
//PUT: /api/users/:id | updateUser()

const updateUser = (req, res) => {
  const id = parseInt(req.params.id);
  const { favourite } = req.body;
  const favouriteList = `{${favourite.join()}}`;
  console.log(favouriteList);
  pool.query(
    "UPDATE users SET favourite =$1 WHERE id = $2;",
    [favouriteList, id],

    (err, results) => {
      if (err) {
        throw err;
      }
      res.status(200).send(`User modified with id:${id}`);
    }
  );
};
//PUT: /api/users/:id | updatecartUser()

const updateCart = (req, res) => {
  const id = parseInt(req.params.id);
  const { cart } = req.body;
  // const cartList = JSON.stringify(cart);
  // console.log(cartList);

  pool.query(
    "UPDATE users SET cart =$1 WHERE id = $2;",
    [cart, id],

    (err, results) => {
      if (err) {
        throw err;
      }
      res.status(200).send(`User's cart modified with id:${id}`);
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
//findUser after update
const findUserById = (req, res) => {
  const { user_id } = req.body;
  console.log(user_id);
  pool.query(
    "SELECT id,username, email, date_of_birth, favourite, paid_items, coupon, cart FROM users WHERE id = $1",
    [user_id],
    (err, result) => {
      if (err) {
        throw err;
      }
      res.status(200).json(result.rows);
    }
  );
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserbyEmail,
  findUserById,
  updateCart,
};
