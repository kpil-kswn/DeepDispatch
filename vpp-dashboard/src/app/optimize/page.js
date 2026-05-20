"use client";
import { useState } from "react";
import StatCard from "@/components/StatCard";
import DashboardChart from "@/components/DashboardChart";

export default function Home() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Default mode is now 'optimization' (formerly hybrid)
  const [mode, setMode] = useState("optimization");

  const [formData, setFormData] = useState({
    latitude: 0.00,
    longitude: 0.00,
    battery_capacity_mwh: 0.00,
    initial_soc_mwh: 0.00,
    max_charge_mw: 0.00,
    max_discharge_mw: 0.00,
    min_soc_mwh: 0.00,
    capacity_mw: 0.00,
    panel_area_m2: 0.00,
    panel_efficiency: 0.00,
    inverter_efficiency: 0.00,
    system_loss_factor: 0.00,
    num_turbines: 0.00,
    turbine_capacity_mw:0.00,
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

  const runOptimization = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      latitude: formData.latitude,
      longitude: formData.longitude,
      battery_capacity_mwh: formData.battery_capacity_mwh,
      initial_soc_mwh: formData.initial_soc_mwh,
      max_charge_mw: formData.max_charge_mw,
      max_discharge_mw: formData.max_discharge_mw,
      min_soc_mwh: formData.min_soc_mwh,

      solar:
        mode === "solar_battery" || mode === "optimization"
          ? {
              capacity_mw: formData.capacity_mw,
              panel_area_m2: formData.panel_area_m2,
              panel_efficiency: formData.panel_efficiency,
              inverter_efficiency: formData.inverter_efficiency,
              system_loss_factor: formData.system_loss_factor,
            }
          : null,

      wind:
        mode === "wind_battery" || mode === "optimization"
          ? {
              num_turbines: formData.num_turbines,
              turbine_capacity_mw: formData.turbine_capacity_mw,
              cut_in_m_s: formData.cut_in_m_s,
              rated_m_s: formData.rated_m_s,
              cut_out_m_s: formData.cut_out_m_s,
              hub_height_m: formData.hub_height_m,
              terrain_type: formData.terrain_type,
            }
          : null,
    };

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();
      if (resData.data) setResult(resData.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSite = async () => {
    const siteName = window.prompt("Enter a name for this site:");
    if (!siteName) return; 

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: siteName,
          siteType: mode, 
          formData: formData, 
        }),
      });

      if (response.ok) alert("Site saved successfully! You can view it in your Profile.");
      else alert("Failed to save site. Are you logged in?");
    } catch (error) {
      console.error("Error saving site:", error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 p-8 flex flex-col items-center font-sans text-gray-100">
      <div className="w-full max-w-6xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            VPP Operator Dashboard
          </h1>
          <p className="text-gray-400">AI-Powered Energy Arbitrage & Generation Forecasting</p>
        </div>
        <form onSubmit={runOptimization} className="mb-12">
          
          <div className="flex justify-center gap-4 mb-8">
            <button
              type="button"
              onClick={() => setMode("solar_battery")}
              className={`px-6 py-2 rounded-full font-bold transition-all ${mode === "solar_battery" ? "bg-amber-500 text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              Solar + Battery
            </button>
            <button
              type="button"
              onClick={() => setMode("wind_battery")}
              className={`px-6 py-2 rounded-full font-bold transition-all ${mode === "wind_battery" ? "bg-cyan-500 text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              Wind + Battery
            </button>
            <button
              type="button"
              onClick={() => setMode("optimization")}
              className={`px-6 py-2 rounded-full font-bold transition-all ${mode === "optimization" ? "bg-emerald-500 text-gray-900" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              Hybrid (Both) + Battery
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-bold text-white mb-4 border-b border-gray-700 pb-2">Location & Storage</h3>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Latitude</label>
                    <input placeholder="0.00" type="number" step="any" name="latitude" value={formData.latitude} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Longitude</label>
                    <input placeholder="0.00" type="number" step="any" name="longitude" value={formData.longitude} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Capacity (MWh)</label>
                    <input placeholder="0.00" type="number" step="any" name="battery_capacity_mwh" value={formData.battery_capacity_mwh} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Initial SOC (MWh)</label>
                    <input placeholder="0.00" type="number" step="any" name="initial_soc_mwh" value={formData.initial_soc_mwh} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Min SOC</label>
                    <input placeholder="0.00" type="number" step="any" name="min_soc_mwh" value={formData.min_soc_mwh} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Max Chg (MW)</label>
                    <input placeholder="0.00" type="number" step="any" name="max_charge_mw" value={formData.max_charge_mw} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Max Dis (MW)</label>
                    <input placeholder="0.00" type="number" step="any" name="max_discharge_mw" value={formData.max_discharge_mw} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500" required />
                  </div>
                </div>
              </div>
            </div>

            {(mode === "solar_battery" || mode === "optimization") && (
              <div className="bg-gray-900 border border-amber-900/30 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-amber-500 mb-4 border-b border-gray-700 pb-2">Solar Setup</h3>
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Capacity (MW)</label>
                    <input placeholder="0.00" type="number" step="any" name="capacity_mw" value={formData.capacity_mw} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500" required />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Panel Area (m²)</label>
                    <input placeholder="0.00" type="number" step="any" name="panel_area_m2" value={formData.panel_area_m2} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500" required />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Panel Eff.</label>
                      <input placeholder="0.00" type="number" step="any" name="panel_efficiency" value={formData.panel_efficiency} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Inv. Eff.</label>
                      <input placeholder="0.00" type="number" step="any" name="inverter_efficiency" value={formData.inverter_efficiency} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Sys Loss</label>
                      <input placeholder="0.00" type="number" step="any" name="system_loss_factor" value={formData.system_loss_factor} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500" required />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(mode === "wind_battery" || mode === "optimization") && (
              <div className="bg-gray-900 border border-cyan-900/30 p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-cyan-500 mb-4 border-b border-gray-700 pb-2">Wind Setup</h3>
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Turbines</label>
                      <input placeholder="0.00" type="number" name="num_turbines" value={formData.num_turbines} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cap (MW)</label>
                      <input placeholder="0.00" type="number" step="any" name="turbine_capacity_mw" value={formData.turbine_capacity_mw} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Hub Height (m)</label>
                      <input placeholder="0.00" type="number" step="any" name="hub_height_m" value={formData.hub_height_m} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Terrain</label>
                      <select name="terrain_type" value={formData.terrain_type} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500">
                        <option value="smooth_water">Offshore</option>
                        <option value="flat_open_land">Flat Land</option>
                        <option value="farmland_with_trees">Farmland</option>
                        <option value="city_or_forest">Forest/City</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cut-In</label>
                      <input placeholder="0.00" type="number" step="any" name="cut_in_m_s" value={formData.cut_in_m_s} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Rated</label>
                      <input placeholder="0.00" type="number" step="any" name="rated_m_s" value={formData.rated_m_s} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 uppercase font-bold mb-1">Cut-Out</label>
                      <input placeholder="0.00" type="number" step="any" name="cut_out_m_s" value={formData.cut_out_m_s} onChange={handleInputChange} className="w-full bg-gray-950 border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-cyan-500" required />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-12 rounded-full shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50">
              {loading ? "Running AI Optimization..." : "Run PSO"}
            </button>
            <button type="button" onClick={handleSaveSite} className="bg-gray-800 hover:bg-gray-700 text-emerald-400 border border-gray-700 font-bold py-3 px-8 rounded-full shadow-lg transition-all">
              💾 Save as Site
            </button>
          </div>
          
        </form>
        {result && (
          <div className="w-full flex flex-col gap-8 border-t border-gray-800 pt-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="Target Date" value={result.target_date} />
              <StatCard title="Projected Profit" value={`$${result.total_profit_usd?.toLocaleString() || result.total_profit_used?.toLocaleString()}`} textColor="text-emerald-400" />
              <StatCard title="Status" value="Optimized" textColor="text-blue-400" />
            </div>
            <DashboardChart data={result.chartData} />
          </div>
        )}
      </div>
    </main>
  );
}