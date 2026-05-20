"use client";
import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WindPredict() {
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);

  const [formData, setFormData] = useState({
    latitude: 0.00,
    longitude: 0.00,
    num_turbines: 0.00,
    turbine_capacity_mw: 0.00,
    cut_in_m_s: 0.00,
    rated_m_s: 0.00,
    cut_out_m_s: 0.00,
    hub_height_m: 0.00,
    terrain_type: "flat_open_land",
  });

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    const parsedValue = type === "number" ? (value === "" ? "" : parseFloat(value)) : value;
    setFormData({ ...formData, [name]: parsedValue });
  };

  const handleSaveSite = async () => {
    const siteName = window.prompt("Enter a name for this Wind Site:");
    if (!siteName) return; 

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName,
          siteType: "wind_forecast", 
          formData: formData, 
        }),
      });

      if (response.ok) alert("Wind Site saved successfully!");
      else alert("Failed to save site. Are you logged in?");
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
      solar: null,
      wind: {
        num_turbines: formData.num_turbines,
        turbine_capacity_mw: formData.turbine_capacity_mw,
        cut_in_m_s: formData.cut_in_m_s,
        rated_m_s: formData.rated_m_s,
        cut_out_m_s: formData.cut_out_m_s,
        hub_height_m: formData.hub_height_m,
        terrain_type: formData.terrain_type,
      },
    };

    try {
      const response = await fetch("/api/forecast",{
        method:"POST", 
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(payload)
      });
      const resData = await response.json();

      if(resData.forecast){
        const rawWindData = resData.forecast.filter(item => item.type==="wind");
        const formatted = rawWindData.map((item)=>({
          time:item.datetime.substring(5,16),
          Wind:Number(item.generation_mw.toFixed(2)),
        }));
        setChartData(formatted);
      }
    } catch (error){
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (  
    <main className="min-h-screen bg-gray-950 p-8 flex flex-col items-center font-sans text-gray-100">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
          Wind Energy Forecast
        </h1>
        <p className="text-gray-400 mb-8 text-lg">Generate a 4-Day wind energy generation curve based on geospatial wind density data.</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md lg:col-span-1">
            <form onSubmit={runPrediction} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Latitude</label>
                  <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Longitude</label>
                  <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
              </div>

              <div className="border-t border-gray-800 my-2"></div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Turbine Count</label>
                  <input type="number" name="num_turbines" value={formData.num_turbines} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Capacity (MW)</label>
                  <input type="number" step="any" name="turbine_capacity_mw" value={formData.turbine_capacity_mw} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Hub Height (m)</label>
                <input type="number" step="any" name="hub_height_m" value={formData.hub_height_m} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cut-In</label>
                  <input type="number" step="any" name="cut_in_m_s" value={formData.cut_in_m_s} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Rated</label>
                  <input type="number" step="any" name="rated_m_s" value={formData.rated_m_s} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cut-Out</label>
                  <input type="number" step="any" name="cut_out_m_s" value={formData.cut_out_m_s} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" required />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-1">Terrain Type</label>
                <select name="terrain_type" value={formData.terrain_type} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors">
                  <option value="smooth_water">Smooth Water (Offshore)</option>
                  <option value="flat_open_land">Flat Open Land</option>
                  <option value="farmland_with_trees">Farmland with Trees</option>
                  <option value="city_or_forest">City or Forest</option>
                </select>
              </div>

              <div className="flex flex-col gap-2 mt-4">
                <button type="submit" disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50">
                  {loading ? 'Simulating Weather...' : 'Run Wind Forecast'}
                </button>
                <button type="button" onClick={handleSaveSite} className="w-full bg-gray-800 hover:bg-gray-700 text-cyan-400 border border-gray-700 font-bold py-3 px-4 rounded-xl shadow-lg transition-all">
                  💾 Save as Site
                </button>
              </div>
            </form>
          </div>

          <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md lg:col-span-2 h-[600px] flex flex-col">
            <h2 className="text-xl font-bold mb-6 text-white">96-Hour Wind Generation Curve</h2>
            {!chartData && !loading && (
              <div className="flex-grow flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                Enter turbine parameters and run the forecast to view the wind profile.
              </div>
            )}
            {chartData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="time" stroke="#9CA3AF" tick={{fontSize: 12}} minTickGap={40} />
                  <YAxis stroke="#9CA3AF" tick={{fontSize: 12}} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff', borderRadius: '0.5rem' }} />
                  <Area type="monotone" dataKey="Wind" stroke="#06b6d4" fill="url(#colorWind)" strokeWidth={3} name="Generation (MW)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}