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
// app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
//   console.log("Webhook received");

//   res.json({ received: true });
// });
//middle-ware to analyze json
app.use(express.json());

//database
const db = require("./services/users.service");
//banner
const banner = require("./services/banner.service");
//category
const category = require("./services/category.service");
//category
const items = require("./services/items.service");
//feedback
const feedback = require("./services/feedback.service");
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
const stripe = require("stripe")(process.env.STRIPE_SECRETKEY);

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
//USER TABLE COMMUNICATION

//get user form database
app.get("/api/users", db.getUsers);
//create user for database
app.post("/api/users/register", db.createUser);
//update user by id
app.put("/api/users/update/:id", authenticateToken, db.updateUser);
//update user's cart by id
app.put("/api/users/updatecart/:id", authenticateToken, db.updateCart);
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
//CATEGORY TABLE COMMUNICATION

//get all category
app.get("/api/category/", category.getCategory);

//create category
app.post("/api/category/create", category.createCategory);

//ITEMS TABLE COMMUNICATION

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
//FEEDBACK TABLE COMMUNICATION
//get feedback for a single item
app.post("/api/feedback/get", feedback.getFeedback);
//post feedback for a single item
app.post(
  "/api/feedback/create",
  checkAuthenticated,
  authenticateToken,
  feedback.createFeedback
);

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

//BANNER TABLE COMMUNICATION

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
//     Stripe          //
//     Area           //
//            /////////
//           //
//          //
//     //////
//    //
//   //
//////
//webhook

app.post(
  "/webhook",
  express.json({ type: "application/json" }),
  (request, response) => {
    const event = request.body;

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        console.log("payment succeed made: ", paymentIntent);

        break;
      case "payment_method.attached":
        const paymentMethod = event.data.object;

        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
  }
);

//checkout session
app.post("/create-checkout-session", async (req, res) => {
  try {
    const { item } = req.body;

    console.log("run");
    const session = await stripe.checkout.sessions.create({
      line_items: item.map(itm => ({
        price_data: {
          currency: "aud",
          unit_amount: Math.round(itm.price * 100),
          product_data: {
            name: itm.title,

            images: [itm.image_path],
          },
        },
        quantity: itm.quatity,
      })),
      mode: "payment",
      success_url: `${process.env.SUCCESS}?success=true`,
      cancel_url: `${process.env.CANCLE}?canceled=true`,
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.log(error);
  }
});

//////////////////////////
//     Stripe          //
//     Area           //
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
// app.delete("/logout", (req, res) => {
//   req.logOut();
//   // res.redirect("/users/login");
// });
app.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/users/login");
  });
});

app.listen(3000);
