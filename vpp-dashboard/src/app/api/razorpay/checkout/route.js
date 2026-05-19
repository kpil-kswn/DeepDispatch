import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    // 1. Fetch the user's session from the request cookie securely on the server
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch the user directly from MongoDB to guarantee we get their real ID
    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });
    
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // 3. Create the Razorpay Subscription using the real DB string ID
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 1, // 1 billing cycle
      notes: {
        userId: dbUser._id.toString(), // <-- 100% stable, guaranteed database ID
      },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
    
  } catch (err) {
    console.error("Razorpay Error:", err);
    return NextResponse.json({ error: "Error creating subscription session" }, { status: 500 });
  }
}