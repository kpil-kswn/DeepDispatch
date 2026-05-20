import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Razorpay from "razorpay";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    // trying to get user from saved browser cookie
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // an error occured so getting id from databse also
    await connectToDatabase();
    const dbUser = await User.findOne({ email: session.user.email });
    
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 1,
      notes: {
        userId: dbUser._id.toString(), 
      },
    });

    return NextResponse.json({ subscriptionId: subscription.id });
    
  } catch (err) {
    console.error("Razorpay Error:", err);
    return NextResponse.json({ error: "Error creating subscription session" }, { status: 500 });
  }
}