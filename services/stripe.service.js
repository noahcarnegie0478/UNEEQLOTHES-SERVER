if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
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
const jwt = require("jsonwebtoken");
const stripe = require("stripe")(process.env.STRIPE_SECRETKEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const checkoutSession = async (req, res) => {
  try {
    console.log("run");
    const { item, user } = req.body;
    const session = await stripe.checkout.sessions.create({
      line_items: item.map(itm => ({
        price_data: {
          currency: "aud",
          unit_amount: Math.round(itm.price * 100),
          product_data: {
            name: itm.title,
            images: [itm.image_path],
            metadata: {
              size: itm.size,
              color: itm.color,
              id: itm.id,
            },
          },
        },
        quantity: itm.quatity,
      })),
      mode: "payment",
      success_url: `${process.env.SUCCESS}?success=true`,
      cancel_url: `${process.env.CANCLE}?canceled=true`,
      metadata: {
        user_id: user,
      },
    });

    res.json({ url: session.url, id: session.id });
  } catch (error) {
    console.log(error);
  }
};

const listenToService = async (request, response) => {
  const event = request.body;
  // Handle the event

  // if (endpointSecret) {
  //   // Get the signature sent by Stripe
  //   const signature = request.headers["stripe-signature"];
  //   try {
  //     event = stripe.webhooks.constructEvent(
  //       request.body,
  //       signature,
  //       endpointSecret
  //     );
  //   } catch (err) {
  //     console.log(`⚠️  Webhook signature verification failed.`, err.message);
  //     return response.sendStatus(400);
  //   }
  // }
  switch (event.type) {
    case "payment_intent.succeeded":
      const paymentIntent = event.data.object;
      console.log("payment succeed made: ", paymentIntent);
      console.log("success");

      break;
    case "checkout.session.completed":
      const session = event.data.object;
      const { user_id } = session.metadata;
      console.log("This is user id:", user_id);
      const lineItemsResp = await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          expand: ["data.price.product"],
          limit: 100,
        }
      );
      if (lineItemsResp.data) {
        for (const item of lineItemsResp.data) {
          const productData = item.price.product;
          const { size, color, id } = productData.metadata;
          const now = new Date();
          console.log(now);
          try {
            const result = await pool.query(
              "INSERT INTO orders (order_id,customer_id, order_date, item_id, color, size ) VALUES ($1,$2, $3, $4, $5, $6 )",
              [session.id, user_id, now, id, color, size]
            );
            if (result) {
              console.log("Successfully added!");
            }
          } catch (error) {
            throw error;
          }
        }
      }

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
