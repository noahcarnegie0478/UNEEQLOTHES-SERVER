if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const Pool = require("pg").Pool;
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRETKEY);

const checkoutSession = async (req, res) => {
  try {
    console.log("run");
    const { item } = req.body;
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
};

const listenToService = (request, response) => {
  const event = request.body;
  // Handle the event
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("payment succeed made: ", paymentIntent);
      console.log("success");

      break;
    case "payment_method.attached":
      const paymentMethod = event.data.object;

      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a response to acknowledge receipt of the event
  response.json({ received: true });
};

module.exports = {
  checkoutSession,
  listenToService,
};
