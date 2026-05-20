import { NextResponse } from "next/server";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User"; 

export async function POST(req) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.log("Invalid Webhook Signature!");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "subscription.charged") {
      const userId = event.payload.subscription.entity.notes.userId;
      
      console.log(`Payment cleared for User ID: ${userId}. Upgrading to Pro!`);
      // updating database for user who subscribed
      await connectToDatabase();
      await User.findByIdAndUpdate(userId, { isPro: true });
    }
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}