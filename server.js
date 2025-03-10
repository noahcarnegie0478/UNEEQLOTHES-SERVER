//set up environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
// incase we use html, method override can help to transform post, get into put or delete
const methodOverride = require("method-override");
//middle-ware to analyze json
app.use(express.json());
//hash password
const bcrypt = require("bcrypt");
//database
const db = require("./users.service");
//empty user list
const users = [];
//jwt
const jwt = require("jsonwebtoken");
//passport
const passport = require("passport");
//display temporary message
const flash = require("express-flash");
//save all state of user
const session = require("express-session");
//
const initialize = require("./passport-config");

initialize(passport, db.getUserbyEmail, db.getUserById);
app.use(methodOverride("_method")) /
  app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/users", checkAuthenticated, authenticateToken, (req, res) => {
  res.json(users);
});

//USER DATABASE COMMUNICATION

//get user form database
app.get("/api/users", db.getUsers);
//create user for database
app.post("/api/users/register", db.createUser);
//update user by id
app.put("/api/users/update/:id", db.updateUser);
//delete user by id
app.delete("/api/users/delete/:id", db.deleteUser);

//

//get user by id from database
app.post("/api/users/getemail", db.getUserbyEmail);
//

app.get("/", checkAuthenticated, authenticateToken, (req, res) => {
  console.log(req.user.role);
  console.log(req.user);
});
//register
app.post("/users/register", checkNotAuthenticated, async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();

    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const user = {
      id: new Date().toISOString(),
      name: req.body.name,
      password: hashedPassword,
      role: req.body.role,
    };
    users.push(user);

    res.status(201).send();
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});
//login
app.post("/users/login", checkNotAuthenticated, (req, res, next) => {
  console.log(req.body.email);
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/users/login");
    }
    req.logIn(user, err => {
      if (err) {
        return next(err);
      }
      const token = info.accessToken;
      return res.json({ message: "Login Successful", token });
    });
  })(req, res, next);
});
app.get("/users/login", (req, res) => {
  res.send("Login page");
});

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}
function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  next();
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/users/login");
});

app.listen(3000);
