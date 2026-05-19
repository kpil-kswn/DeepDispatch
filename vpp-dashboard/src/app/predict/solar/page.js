"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function SolarPredict() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);

  const [formData, setFormData] = useState({
    latitude: 0.00,
    longitude: 0.00,
    capacity_mw: 0.00,
    panel_area_m2: 0.00,
    panel_efficiency: 0.00,
    inverter_efficiency: 0.00,
    system_loss_factor: 0.00,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value === "" ? "" : parseFloat(value) });
  };

  const handleSaveSite = async () => {
    const siteName = window.prompt("Enter a name for this Solar Site:");
    if (!siteName) return; 

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName,
          siteType: "solar_forecast", 
          formData: formData, 
        }),
      });

      if (response.ok) alert("✅ Solar Site saved successfully!");
      else alert("❌ Failed to save site. Are you logged in?");
    } catch (error) {
      console.error("Error saving site:", error);
    }
  };

  const runPrediction = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      latitude: formData.latitude,
      longitude: formData.longitude,
      solar: {
        capacity_mw: formData.capacity_mw,
        panel_area_m2: formData.panel_area_m2,
        panel_efficiency: formData.panel_efficiency,
        inverter_efficiency: formData.inverter_efficiency,
        system_loss_factor: formData.system_loss_factor,
      },
      wind: null,
    };

    try {
      const response = await fetch("/api/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (resData.forecast) {
        const rawSolarData = resData.forecast.filter((item) => item.type === "solar");
        const formatted = rawSolarData.map((item) => ({
          time: item.datetime.substring(5, 16),
          Solar: Number(item.generation_mw.toFixed(2)),
        }));
        setChartData(formatted);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 p-8 flex flex-col items-center font-sans text-gray-100">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
          Solar Energy Forecast
        </h1>
        <p className="text-gray-400 mb-8 text-lg">Generate a 4-day solar energy generation curve based on geospatial weather data.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md lg:col-span-1">
            <form onSubmit={runPrediction} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Latitude</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Longitude</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
                </div>
              </div>

              <div className="border-t border-gray-800 my-2"></div>

              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Capacity (MW)</label>
                <input type="number" step="any" name="capacity_mw" value={formData.capacity_mw} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Panel Area (m²)</label>
                <input type="number" step="any" name="panel_area_m2" value={formData.panel_area_m2} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Panel Efficiency (0-1)</label>
                <input type="number" step="any" name="panel_efficiency" value={formData.panel_efficiency} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Inverter Eff. (0-1)</label>
                  <input type="number" step="any" name="inverter_efficiency" value={formData.inverter_efficiency} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Sys Loss (0-1)</label>
                  <input type="number" step="any" name="system_loss_factor" value={formData.system_loss_factor} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 transition-colors" required />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 text-gray-900 font-bold py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50">
                  {loading ? "Predicting 96 Hours..." : "Run Solar Forecast"}
                </button>
                <button type="button" onClick={handleSaveSite} className="w-full bg-gray-800 hover:bg-gray-700 text-amber-500 border border-gray-700 font-bold py-3 px-4 rounded-xl shadow-lg transition-all">
                  💾 Save as Site
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md lg:col-span-2 h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-white">96-Hour Solar Generation Curve</h2>
            {!chartData && !loading && (
              <div className="flex-grow flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                Enter your parameters and run the forecast to view the generation curve.
              </div>
            )}
            {chartData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="time" stroke="#9CA3AF" tick={{ fontSize: 12 }} minTickGap={40} />
                  <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#374151", color: "#fff", borderRadius: "0.5rem" }} />
                  <Area type="monotone" dataKey="Solar" stroke="#fbbf24" fill="url(#colorSolar)" strokeWidth={3} name="Generation (MW)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}