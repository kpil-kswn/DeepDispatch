import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export const authOptions ={
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter an email and a password.");
        }
        await connectToDatabase();
        const user = await User.findOne({ email: credentials.email });
        if (!user || !user.password) {
          throw new Error(
            "No user found with this email, or you originally signed up with Google",
          );
        }
        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordMatch) {
          throw new Error("Incorrect password.");
        }
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          await connectToDatabase();
          const existingUser = await User.findOne({ email: user.email });

          // Save them to MongoDB if they don't exist yet
          if (!existingUser) {
            await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              isPro: false, 
            });
          }
          return true; 
        } catch (error) {
          console.error("Error saving Google user:", error);
          return false;
        }
      }
      return true;
    },
    // JWT token
    async jwt({ token, user, trigger }) {
      if (user) {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email });

        if (dbUser) {
          token.id = dbUser._id.toString();
          token.isPro = dbUser.isPro; 
        }
      }
      if (trigger === "update") {
        await connectToDatabase();
        const dbUser = await User.findOne({ email: token.email });
        if (dbUser) {
          token.isPro = dbUser.isPro; 
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.isPro = token.isPro; 
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}