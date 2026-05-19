'use client';

// 1. Notice we import ComposedChart here instead of AreaChart/LineChart
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from "recharts";

export default function DashboardChart({ data }) {
    return (
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md w-full h-[450px]">
            <h2 className="text-xl font-bold mb-6 text-white">24-Hour Generation & Battery Dispatch</h2>
            <ResponsiveContainer width="100%" height="100%">
                
                {/* 2. We use ComposedChart to mix Areas and Lines safely */}
                <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} />
                    <Legend />
                    
                    {/* The Solar Area */}
                    <Area type="monotone" dataKey="Solar" fill="#fbbf24" stroke="#fbbf24" fillOpacity={0.2} name="Solar (MW)" />
                    
                    {/* The Wind and Battery Lines */}
                    <Line type="monotone" dataKey="Wind" stroke="#60a5fa" strokeWidth={3} name="Wind (MW)" />
                    <Line type="step" dataKey="Battery_Action" stroke="#10b981" strokeWidth={3} name="Battery Dispatch (MW)" />
                </ComposedChart>
                
            </ResponsiveContainer>
        </div>
    );
}