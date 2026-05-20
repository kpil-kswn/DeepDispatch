import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/mongodb";
import History from "@/models/History";
import { authOptions } from "@/lib/authOptions";

export async function POST(request) {
    try {
        // verifying if user is present
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        const pythonResponse = await fetch('https://deepdispatch.onrender.com/api/v1/forecast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!pythonResponse.ok) {
            const errorText = await pythonResponse.text();
            console.error('\n PYTHON REJECTED THE DATA (422 Error):', errorText, '\n');
            return NextResponse.json({ error: JSON.parse(errorText) }, { status: pythonResponse.status });
        }

        const data = await pythonResponse.json();

        //formating data
        let chartFormattedData = [];
        if (data.forecast) {
            chartFormattedData = data.forecast.map((item) => {
                return {
                    time: item.datetime.substring(5, 16),
                    Solar: item.type === "solar" ? Number(item.generation_mw.toFixed(2)) : 0,
                    Wind: item.type === "wind" ? Number(item.generation_mw.toFixed(2)) : 0,
                    Battery_Action: 0,
                };
            });
        }
        // deciding servie type as per input 
        let serviceType = body.solar ? "solar_forecast" : "wind_forecast";

        // contacting datbase
        await connectToDatabase();
        await History.create({
            userId: session.user.id,
            serviceType: serviceType,
            inputsUsed: body,
            metrices: {
                target_date: "96-Hour Forecast",
                total_profit_used: 0,
                status: "Forecasted",
            },
            curveData: chartFormattedData,
        });

        return NextResponse.json(data, { status: 200 });
        
    } catch (error) {
        console.error('Forecast Error:', error);
        return NextResponse.json({ error: 'Failed to communicate with ML Engine' }, { status: 500 });
    }
}