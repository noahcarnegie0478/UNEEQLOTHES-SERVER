if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const methodOverride = require("method-override");
app.use(express.json());
const bcrypt = require("bcrypt");
const users = [];
const jwt = require("jsonwebtoken");
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
app.get("/", checkAuthenticated, authenticateToken, (req, res) => {
  console.log(req.user.role);
  console.log(users.filter(user => user.name === req.user.name));
  res.json(users.filter(user => user.name === req.user.name));
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

app.post("/users/login", checkNotAuthenticated, (req, res, next) => {
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
