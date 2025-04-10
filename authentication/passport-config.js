if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.use(express.json());

const LocalStrategy = require("passport-local").Strategy;

function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    process.env.ACCESS_TOKEN_SECRET,

    { expiresIn: "15m" }
  );
}

//

function initializePassport(passport, getUserbyEmail, getUserById) {
  const authenticateUser = async (email, password, done) => {
    try {
      const user = await getUserbyEmail(email);

      if (user == null) {
        return done(null, false, { message: "No user with that email" });
      }
      if (!user.password) {
        console.error("Password is missing for user:", user);
        return done(null, false, { message: "User data is incorrect" });
      }
      if (await bcrypt.compare(password, user.password)) {
        const accessToken = generateAccessToken(user);
        return done(null, user, { accessToken: accessToken });
      } else {
        return done(null, false, { message: "Password is incorrect" });
      }
    } catch (error) {
      return done(error);
    }
  };

  passport.use(new LocalStrategy({ usernameField: "email" }, authenticateUser));
  passport.serializeUser((user, done) => {
    return done(null, user.id);
  });

  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id));
  });
}
function generateAccessToken(user) {
  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      date_of_birth: user.date_of_birth,
      favourite: user.favourite,
      processing: user.processing,
      credit: user.credit,
      coupon: user.coupon,
      paid_items: user.paid_items,
    },
    process.env.ACCESS_TOKEN_SECRET,

    { expiresIn: "15m" }
  );

  console.log("Generated accessToken:", token);
  return token;
}

module.exports = initializePassport;
