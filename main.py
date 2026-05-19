from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uvicorn

# Import your modularized service functions
from services.forecaster import predict_solar_generation, predict_wind_generation
from services.optimizer import run_pso_optimization

app = FastAPI(title="VPP Engineering Showcase API", version="1.0")


# ==========================================
# 1. DEFINE THE API CONTRACT (Pydantic Models)
# ==========================================
class SolarConfig(BaseModel):
    capacity_mw: float
    panel_area_m2: float = 500000.0  # Defaults provided for easy testing
    panel_efficiency: float = 0.20
    inverter_efficiency: float = 0.96
    system_loss_factor: float = 0.95


class WindConfig(BaseModel):
    num_turbines: int
    turbine_capacity_mw: float = 2.0
    cut_in_m_s: float = 3.5
    rated_m_s: float = 12.0
    cut_out_m_s: float = 25.0
    hub_height_m: float = 100.0
    terrain_type: str = "flat_open_land"


class OptimizationRequest(BaseModel):
    latitude: float
    longitude: float
    # Battery parameters (Now fully dynamic!)
    battery_capacity_mwh: float
    initial_soc_mwh: float
    max_charge_mw: float = 10.0
    max_discharge_mw: float = 10.0
    min_soc_mwh: float = 5.0

    # Optional nested objects (Allows Solar-only, Wind-only, or Hybrid)
    solar: Optional[SolarConfig] = None
    wind: Optional[WindConfig] = None

class ForecastRequest(BaseModel):
    latitude:float
    longitude:float
    solar:Optional[SolarConfig] = None
    wind:Optional[WindConfig] = None
    # no battery requirements here;

@app.post("/api/v1/forecast")
async def generate_forecast(req:ForecastRequest):
    try:
        if req.solar is None and req.wind is None:
            raise HTTPException(status_code=400,detail="Must provide at least a Solar or Wind configuration")
        
        forecast_data = []

        if req.solar is not None:
            df_solar = predict_solar_generation(
                lat=req.latitude,
                lon=req.longitude,
                plant_capacity_mw=req.solar.capacity_mw,
                panel_area_m2=req.solar.panel_area_m2,
                panel_efficiency=req.solar.panel_efficiency,
                inverter_efficiency=req.solar.inverter_efficiency,
                system_loss_factor=req.solar.system_loss_factor
            )
            for _, row in df_solar.iterrows():
                forecast_data.append({
                    "datetime":str(row['Datetime (IST)']),
                    "type":"solar",
                    "generation_mw":float(row['Solar_MW'])
                })

        if req.wind is not None:
            print(f"Generating Wind Forecast for Lat: {req.latitude}, Lon: {req.longitude}...")
            df_wind = predict_wind_generation(
                lat=req.latitude,
                lon=req.longitude,
                cut_in_m_s=req.wind.cut_in_m_s,
                rated_m_s=req.wind.rated_m_s,
                cut_out_m_s=req.wind.cut_out_m_s,
                turbine_capacity_mw=req.wind.turbine_capacity_mw,
                num_turbines=req.wind.num_turbines,
                hub_height_m=req.wind.hub_height_m,
                terrain_type=req.wind.terrain_type
            )
            
            for _, row in df_wind.iterrows():
                forecast_data.append({
                    "datetime": str(row['Datetime (IST)']),
                    "type": "wind",
                    "generation_mw": float(row['Wind_MW'])
                })
        return {
            "status":"success",
            "message":"96-Hour Forecast Complete",
            "forecast":forecast_data
        }
    
    except Exception as e:
        print(f"forecast error:{e}")
        raise HTTPException(status_code=500,detail=str(e))
    

# ==========================================
# 2. THE CORE ENDPOINT
# ==========================================
@app.post("/api/v1/optimize")
async def optimize_vpp(req: OptimizationRequest):
    try:
        # 1. Validation Check: Ensure they provided at least one asset
        if req.solar is None and req.wind is None:
            raise HTTPException(status_code=400, detail="Must provide at least a Solar or Wind configuration.")

        df_solar = None
        df_wind = None

        # 2. Run Solar Prediction (If requested)
        if req.solar is not None:
            print(f"Processing Solar for Lat: {req.latitude}, Lon: {req.longitude}...")
            df_solar = predict_solar_generation(
                lat=req.latitude,
                lon=req.longitude,
                plant_capacity_mw=req.solar.capacity_mw,
                panel_area_m2=req.solar.panel_area_m2,
                panel_efficiency=req.solar.panel_efficiency,
                inverter_efficiency=req.solar.inverter_efficiency,
                system_loss_factor=req.solar.system_loss_factor
            )

        # 3. Run Wind Prediction (If requested)
        if req.wind is not None:
            print(f"Processing Wind for Lat: {req.latitude}, Lon: {req.longitude}...")
            df_wind = predict_wind_generation(
                lat=req.latitude,
                lon=req.longitude,
                cut_in_m_s=req.wind.cut_in_m_s,
                rated_m_s=req.wind.rated_m_s,
                cut_out_m_s=req.wind.cut_out_m_s,
                turbine_capacity_mw=req.wind.turbine_capacity_mw,
                num_turbines=req.wind.num_turbines,
                hub_height_m=req.wind.hub_height_m,
                terrain_type=req.wind.terrain_type
            )

        # 4. Run the PSO Battery Optimization
        print("Running PSO Algorithm...")
        optimization_results = run_pso_optimization(
            battery_capacity_mwh=req.battery_capacity_mwh,
            initial_soc_mwh=req.initial_soc_mwh,
            df_solar=df_solar,
            df_wind=df_wind,
            max_charge_mw=req.max_charge_mw,
            max_discharge_mw=req.max_discharge_mw,
            min_soc_mwh=req.min_soc_mwh
        )

        return {
            "status": "success",
            "message": "Optimization Complete",
            "data": optimization_results
        }

    except Exception as e:
        print(f"ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

    


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)