import { NextResponse } from "next/server";
import crypto from "crypto";
// IMPORTANT: Import your database connection and User model based on your folder structure!
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User"; 

export async function POST(req) {
  try {
    // 1. Get the raw text body and the signature from the headers
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // 2. Verify the signature (The Security Check)
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.log("🚨 Invalid Webhook Signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse the valid data
    const event = JSON.parse(body);

    // 4. Listen for the specific "Subscription Charged" event
    if (event.event === "subscription.charged") {
      // Grab the userId we secretly attached when we created the subscription
      const userId = event.payload.subscription.entity.notes.userId;
      
      console.log(`✅ Payment cleared for User ID: ${userId}. Upgrading to Pro!`);

      // 5. Update the Database!
      await connectToDatabase();
      await User.findByIdAndUpdate(userId, { isPro: true });
    }

    // Always return a 200 OK to Razorpay so they know you received it
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}