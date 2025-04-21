//set up environment
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const app = express();
// incase we use html, method override can help to transform post, get into put or delete
const methodOverride = require("method-override");
//middle-ware to analyze json
app.use(express.json());

//database
const db = require("./services/users.service");
//banner database
const banner = require("./services/banner.service");
//category database
const category = require("./services/category.service");
//category database
const items = require("./services/items.service");
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
const initialize = require("./authentication/passport-config");

initialize(passport, db.getUserbyEmail, db.getUserById);
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
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
//////////////////////////
//                     //
//                    //
//            /////////
//           //
//          //
//     //////
//    //
//   //
//////
//USER DATABASE COMMUNICATION

//get user form database
app.get("/api/users", db.getUsers);
//create user for database
app.post("/api/users/register", db.createUser);
//update user by id
app.put("/api/users/update/:id", authenticateToken, db.updateUser);
//delete user by idx
app.delete("/api/users/delete/:id", db.deleteUser);

//get user by email from database
app.post("/api/users/getemail", db.getUserbyEmail);

// get user by id
app.post("/api/users/getsbyid", authenticateToken, db.findUserById);
//home
app.get("/", authenticateToken, (req, res) => {
  res.status(200).json(req.user);
});
//////////////////////////
//                     //
//                    //
//            /////////
//           //
//          //
//     //////
//    //
//   //
//////
//CATEGORY DATABASE COMMUNICATION

//get all category
app.get("/api/category/", category.getCategory);

//create category
app.post("/api/category/create", category.createCategory);

//ITEMS DATABASE COMMUNICATION

//get all item
app.get("/api/item/", items.getItems);

//create item
app.post("/api/item/create", items.createItems);

//testing debug
app.post("/testing", items.testing);

//get category item
app.post("/api/item/category", items.CategoryListing);

//get items by keywords
app.post("/api/item/fulltext", items.GetFullText);

//filter items
app.post("/api/item/filter", items.filterItems);

//get wishlist of items
app.post("/api/item/wishlist", items.getWishList);
//////////////////////////
//                     //
//                    //
//            /////////
//           //
//          //
//     //////
//    //
//   //
//////
//BANNER DATABASE COMMUNICATION

//get all banner
app.get("/api/banner/", banner.getBanners);

//create banner
app.post("/api/banner/create", banner.createBanner);

//////////////////////////
//                     //
//                    //
//            /////////
//           //
//          //
//     //////
//    //
//   //
//////
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
  res.send("Login is right here");
});
//////////////////////////
//                     //
//                    //
//            /////////
//           //
//          //
//     //////
//    //
//   //
//////

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
  console.log("token after login: ", token);
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
