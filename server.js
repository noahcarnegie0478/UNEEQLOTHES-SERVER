if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const methodOverride = require("method-override");
app.use(express.json());
const bcrypt = require("bcrypt");
const users = [];

const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  name => users.find(user => user.name === name),
  id => users.find(user => user.id === id)
);
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

app.get("/users", (req, res) => {
  res.json(users);
});
app.get("/", checkAuthenticated, (req, res) => {
  if (!req.user) {
    return res.send("Not log in yet!");
  }
  res.send(`Hello, ${req.user.name}!`);
});
//register
app.post("/users/register", checkNotAuthenticated, async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    // console.log(salt + " " + hashedPassword);
    const user = {
      id: new Date().toISOString(),
      name: req.body.name,
      password: hashedPassword,
    };
    users.push(user);

    res.status(201).send();
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});

app.post(
  "/users/login",
  checkNotAuthenticated,
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/users/login",
    failureFlash: true,
  })
);
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
app.delete("/logout", (req, res) => {
  req.logOut();
  res.redirect("/users/login");
});

app.listen(3000);
