import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import Site from "@/models/Site";
import History from "@/models/History";
import User from "@/models/User";
import { authOptions } from "@/lib/authOptions";

export const dynamic = "force-dynamic";

export async function GET(req){
    try{
        const session = await getServerSession(authOptions);
        if(!session || !session.user){
            return NextResponse.json({error:"Unauthorized"},{status:401});
        }
        await connectToDatabase();

        let dbUserId = session.user.id;
        if(!dbUserId){
            const userRecord = await User.findOne({email:session.user.email});
            if(!userRecord){
                return NextResponse.json({error:"User record not found in database"},{status:404});
            }
        }

        const userSites = await Site.find({userId:dbUserId}).sort({savedAt:-1});
        const userHistory = await History.find({userId:dbUserId}).sort({runDate:-1});

        return NextResponse.json({
            success:true,
            sites:userSites,
            history:userHistory,
        },{status:200});
    } catch(error){
        console.error("profile Fetch error:",error);
        return NextResponse.json({error:"Failed to fetch profile data"},{status:500});
    }

}