import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import History from "@/models/History";
import { authOptions } from "@/lib/authOptions";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("SERVER SESSION FAILED. Session is:", session);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const pythonResponse = await fetch("https://deepdispatch.onrender.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    
    if (!pythonResponse.ok) {
      throw new Error(`Python server responded with status :${pythonResponse.status}`);
    }
    const data = await pythonResponse.json();

    let chartFormattedData = [];
    if (data.data && data.data.schedule) {
      chartFormattedData = data.data.schedule.map((item) => {
        const datePart = item["Datetime (IST)"].split(" ")[0].substring(5);
        const timePart = item["Datetime (IST)"].split(" ")[1].substring(0, 5);
        return {
          time: `${datePart} ${timePart}`,
          Solar: Number((item.Solar_MW || 0).toFixed(2)),
          Wind: Number((item.Wind_MW || 0).toFixed(2)),
          Battery_Action: Number(item.Target_Battery_Action_MW?.toFixed(2) || 0),
        };
      });
    }

    let serviceType = "optimization";
    if (body.solar && !body.wind) serviceType = "solar_battery";
    if (!body.solar && body.wind) serviceType = "wind_battery";

    await connectToDatabase();
    await History.create({
      userId: session.user.id,
      serviceType: serviceType,
      inputsUsed: body,
      metrices: {
        target_date: data.data?.target_date || "Unknown",
        total_profit_used: data.data?.total_profit_used || data.data?.total_profit_usd || 0,
        status: "Optimized",
      },
      curveData: chartFormattedData,
    });
    
    if (data.data) {
      data.data.chartData = chartFormattedData;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("VPP Optimization Error:", error);
    return NextResponse.json({ error: "Failed to communicate with ML Engine" }, { status: 500 });
  }
}