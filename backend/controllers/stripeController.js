const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");

const PLANS = {
  basic: {
    price: 1000, // $10.00
    credits: 100,
    name: "Basic Plan - 100 AI Credits",
  },
  pro: {
    price: 2500, // $25.00
    credits: 500,
    name: "Pro Plan - 500 AI Credits",
  },
  advanced: {
    price: 3500, // $35.00
    credits: 1000,
    name: "Advanced Plan - 1000 AI Credits",
  },
};

const createCheckoutSession = async (req, res) => {
  try {
    const { planId, returnUrl } = req.body;
    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const redirectUrl = returnUrl || "/dashboard";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}&return_to=${encodeURIComponent(redirectUrl)}`,
      cancel_url: `${frontendUrl}${redirectUrl}?payment=cancelled`,
      customer_email: req.user.email,
      metadata: {
        userId: req.user._id.toString(),
        credits: plan.credits.toString(),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: `Add ${plan.credits} AI credits to your Collab Code account.`,
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe Create Session Error:", error);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
};

const webhookHandler = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // The req.body must be the raw buffer, which we'll configure in server.js
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    
    // Fulfill the purchase...
    const userId = session.metadata?.userId;
    const addedCredits = parseInt(session.metadata?.credits || "0", 10);

    if (userId && addedCredits > 0) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.credits += addedCredits;
          await user.save();
          console.log(`✅ Added ${addedCredits} credits to user ${user.email}`);
        }
      } catch (dbErr) {
        console.error("Error fulfilling purchase:", dbErr);
      }
    }
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send();
};

const verifySession = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const addedCredits = parseInt(session.metadata?.credits || "0", 10);
      const user = await User.findById(req.user._id);

      if (!user) {
         return res.status(404).json({ message: "User not found" });
      }

      // Check if this session was already fulfilled
      if (user.fulfilledSessions && user.fulfilledSessions.includes(sessionId)) {
        return res.status(200).json({ 
          success: true, 
          message: "Payment already fulfilled",
          credits: user.credits
        });
      }

      // Fulfill the payment
      if (addedCredits > 0) {
        user.credits += addedCredits;
      }
      
      if (!user.fulfilledSessions) {
        user.fulfilledSessions = [];
      }
      user.fulfilledSessions.push(sessionId);
      
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: "Payment verified and credits added",
        credits: user.credits
      });
    }

    return res.status(400).json({ success: false, message: "Payment not completed" });
  } catch (error) {
    console.error("Verify Session Error:", error);
    return res.status(500).json({ message: "Failed to verify session" });
  }
};

module.exports = {
  createCheckoutSession,
  webhookHandler,
  verifySession,
};
