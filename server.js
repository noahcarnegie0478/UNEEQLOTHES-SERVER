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
app.get("/", (req, res) => {
  console.log("Session data:", req.session);
  console.log("User from session:", req.user);
  if (!req.user) {
    return res.send("Not log in yet!");
  }
  res.send(`Hello, ${req.user.name}!`);
});
//register
app.post("/users/register", async (req, res) => {
  try {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    console.log(salt + " " + hashedPassword);
    const user = { name: req.body.name, password: hashedPassword };
    users.push(user);

    res.status(201).send();
  } catch (error) {
    res.status(500).send();
    console.error(error);
  }
});
app.post("/users/login", async (req, res) => {
  const user = users.find(user => (user.name = req.body.name));
  if (user == null) {
    return res.status(400).send(" Cannot find user");
  }
  try {
    if (await bcrypt.compare(req.body.password, user.password)) {
      res.send("Success");
    } else {
      res.send("Not Allow");
    }
  } catch (error) {
    res.status(500).send();
  }
});
app.listen(3000);
