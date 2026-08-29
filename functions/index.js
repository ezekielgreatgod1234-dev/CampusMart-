const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// =====================================================
// Paystack Secret (old method - works on free plan)
// =====================================================
const PAYSTACK_SECRET = functions.config().paystack?.secret;

// =====================================================
// 1. INITIALIZE PAYMENT (called from React)
// =====================================================
exports.initializePayment = functions.https.onCall(async (data, context) => {
  const { email, amount, sellerId, orderId, productName } = data;

  if (!email || !amount || amount < 100 || !sellerId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "email, amount and sellerId are required"
    );
  }

  if (!PAYSTACK_SECRET) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "Paystack secret key is not configured"
    );
  }

  // Convert Naira to Kobo
  const amountInKobo = Math.round(Number(amount) * 100);

  try {
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amountInKobo,
        currency: "NGN",
        callback_url: "https://yourdomain.com/payment/callback", // change later
        metadata: {
          sellerId,
          orderId: orderId || null,
          productName: productName || "CampusMart Order",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.status) {
      throw new Error(response.data.message || "Failed to initialize payment");
    }

    return {
      success: true,
      authorization_url: response.data.data.authorization_url,
      reference: response.data.data.reference,
    };
  } catch (error) {
    console.error("Paystack Error:", error.response?.data || error.message);
    throw new functions.https.HttpsError(
      "internal",
      error.response?.data?.message || "Could not start payment"
    );
  }
});

// =====================================================
// 2. WEBHOOK – Real money comes in
// CampusMart keeps 5%, Seller gets 95%
// =====================================================
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
  if (!PAYSTACK_SECRET) {
    return res.status(500).send("Paystack secret not configured");
  }

  // Verify the webhook signature
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.error("Invalid Paystack signature");
    return res.status(401).send("Invalid signature");
  }

  const event = req.body;

  if (event.event === "charge.success") {
    const data = event.data;
    const metadata = data.metadata || {};
    const sellerId = metadata.sellerId;
    const orderId = metadata.orderId;
    const totalAmount = data.amount / 100; // from kobo to naira

    if (!sellerId) {
      console.warn("No sellerId found in metadata");
      return res.status(200).send("OK");
    }

    const platformFee = Number((totalAmount * 0.05).toFixed(2)); // 5%
    const sellerAmount = Number((totalAmount * 0.95).toFixed(2)); // 95%

    const batch = db.batch();

    // Credit seller 95%
    const sellerRef = db.collection("users").doc(sellerId);
    batch.update(sellerRef, {
      availableBalance: admin.firestore.FieldValue.increment(sellerAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Record CampusMart 5% fee
    const feeRef = db.collection("platformFees").doc();
    batch.set(feeRef, {
      sellerId,
      orderId: orderId || null,
      totalAmount,
      platformFee,
      sellerAmount,
      paystackReference: data.reference,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mark order as paid (optional)
    if (orderId) {
      const orderRef = db.collection("orders").doc(orderId);
      batch.update(orderRef, {
        paymentStatus: "paid",
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        amountPaid: totalAmount,
      });
    }

    // Create earnings history
    const earningsRef = db.collection("earnings").doc();
    batch.set(earningsRef, {
      sellerId,
      type: "sale",
      title: "Product / Service Sale",
      description: metadata.productName || "Order payment",
      amount: sellerAmount,
      status: "Available",
      orderId: orderId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    console.log(
      `✅ Seller ${sellerId} credited ₦${sellerAmount} | CampusMart kept ₦${platformFee}`
    );
  }

  res.status(200).send("OK");
});