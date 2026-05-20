import { NextResponse } from "next/server";
import bcrypt from "bcryptjs"; 
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    
    const { name, email, password } = await req.json();
    console.log(`Data received for: ${email}`);
    await connectToDatabase();

    // checking if user already exist
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists, stopping.");
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }

    console.log("Step 4: Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully!");

    console.log("Step 5: Saving user to MongoDB...");
    await User.create({
      name,
      email,
      password: hashedPassword,
    });
    console.log("User saved successfully!");

    console.log("--- REGISTRATION COMPLETE ---");
    return NextResponse.json({ message: "User registered successfully." }, { status: 201 });

  } catch (error) {
    console.error("FATAL CRASH HAPPENED");
    console.error("EXACT REASON:", error.message);
    
    return NextResponse.json(
      { message: "An error occurred during registration." }, 
      { status: 500 }
    );
  }
}