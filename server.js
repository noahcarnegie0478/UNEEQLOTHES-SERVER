if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const users = [];

const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const initializePassport = require("./passport-config");
initializePassport(
  passport,
  email => users.find(user => user.email === email),
  id => users.find(user => user.id === id)
);

app.use(express.json());

//get all users
app.get("/users", (req, res) => {
  res.json(users);
});
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

//register
app.post("/users/register", async (req, res) => {
  try {
    // const salt = await bcrypt.genSalt();
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

//login
// app.post("/users/login", async (req, res) => {
//   const user = users.find(user => (user.name = req.body.name));
//   if (user == null) {
//     return res.status(400).send(" Cannot find user");
//   }
//   try {
//     if (await bcrypt.compare(req.body.password, user.password)) {
//       res.send("Success");
//     } else {
//       res.send("Not Allow");
//     }
//   } catch (error) {
//     res.status(500).send();
//   }
// });
app.post(
  "/user/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);
app.listen(3000);
