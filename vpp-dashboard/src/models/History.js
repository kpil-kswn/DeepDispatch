import mongoose from "mongoose";

const HistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  serviceType: {
    type: String,
    enum: ["solar_forecast", "wind_forecast", "solar_battery", "wind_battery", "optimization"],
    required: true,
  },
  runDate: { type: Date, default: Date.now },
  inputsUsed: { type: Object },
  metrices: {
    target_date: String,
    total_profit_used: { type: Number, default: 0 },
    status: String,
  },
  curveData: [
    {
      time: String,
      Solar: Number,
      Wind: Number,
      Battery_Action: Number,
    },
  ],
},{timestamps:true});

export default mongoose.models.History ||
  mongoose.model("History", HistorySchema);
