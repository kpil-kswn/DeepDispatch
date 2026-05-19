import mongoose from "mongoose";

const SiteSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  siteName: { type: String, required: true },
  siteType: { 
    type: String, 
    // Updated strictly to your 5 requested types
    enum: ["solar_forecast", "wind_forecast", "solar_battery", "wind_battery", "optimization"],
    required: true 
  },
  savedAt: { type: Date, default: Date.now },
  
  configuration: {
    location: {
      latitude: Number,
      longitude: Number,
    },
    battery: {
      battery_capacity_mwh: Number,
      initial_soc_mwh: Number,
      min_soc_mwh: Number,
      max_charge_mw: Number,
      max_discharge_mw: Number,
    },
    solar: {
      capacity_mw: Number,
      panel_area_m2: Number,
      panel_efficiency: Number,
      inverter_efficiency: Number,
      system_loss_factor: Number,
    },
    wind: {
      num_turbines: Number,
      turbine_capacity_mw: Number,
      hub_height_m: Number,
      terrain_type: String,
      cut_in_m_s: Number,
      rated_m_s: Number,
      cut_out_m_s: Number,
    }
  }
},{timestamps:true});

export default mongoose.models.Site || mongoose.model("Site", SiteSchema);