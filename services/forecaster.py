import requests
import pandas as pd
import numpy as np
import pvlib
import joblib
import tensorflow as tf
from keras.models import load_model
from keras.saving import register_keras_serializable
from keras.initializers import Orthogonal, GlorotUniform, Zeros
from keras.layers import Layer
from keras import ops

print("Loading ML Assets into Server Memory...")

# ==========================================
# 1. CUSTOM LAYER & GLOBAL LOAD (Happens ONCE on startup)
# ==========================================
@register_keras_serializable(package="Custom")
class Attention(Layer):
    def __init__(self, return_sequences=False, **kwargs):
        super(Attention, self).__init__(**kwargs)
        self.return_sequences = return_sequences

    def build(self, input_shape):
        self.W = self.add_weight(
            name="att_weight",
            shape=(input_shape[-1], 1),
            initializer="glorot_uniform",
            trainable=True
        )
        self.b = self.add_weight(
            name="att_bias",
            shape=(input_shape[1], 1),
            initializer="zeros",
            trainable=True
        )
        super(Attention, self).build(input_shape)

    def call(self, x):
     e = ops.tanh(ops.matmul(x, self.W) + self.b)
     a = ops.softmax(e, axis=1)
     output = x * a

     if self.return_sequences:
         return output

     return ops.sum(output, axis=1)

    def compute_output_shape(self, input_shape):
        if self.return_sequences:
            return input_shape
        return (input_shape[0], input_shape[-1])

    def get_config(self):
        config = super().get_config()
        config.update({
            "return_sequences": self.return_sequences
        })
        return config
# Ensure paths point to your new /models folder!
solar_model = load_model(
    "models/Solar_BiLSTM_Attention.keras",
    custom_objects={"Attention": Attention},
    compile=False,
    safe_mode=False
)
scaler_X_solar = joblib.load("models/scaler_X_solar.save")
scaler_Y_solar = joblib.load("models/scaler_Y_solar.save")

wind_model = load_model(
    "models/Wind_BiLSTM_Attention.keras",
    custom_objects={"Attention": Attention},
    compile=False,
    safe_mode=False
)
scaler_X_wind = joblib.load("models/scaler_X_wind.save")
scaler_Y_wind = joblib.load("models/scaler_Y_wind.save")


# ==========================================
# 2. THE CALLABLE MICROSERVICE FUNCTION
# ==========================================
def predict_solar_generation(lat, lon, plant_capacity_mw, panel_area_m2, panel_efficiency, inverter_efficiency, system_loss_factor):
    API_KEY = "74cb7d5c5faea12ff85c27af60363c6a"
    # --- 1. FETCH DATA ---
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()
    parsed_data = []
    for item in data['list']:
        parsed_data.append({
            "datetime": item["dt"],
            "T2M": item["main"]["temp"],
            "RH2M": item["main"]["humidity"],
            "PS": item["main"]["pressure"] / 10.0,
            "cloud_%": item["clouds"]["all"],
            "WS10M": item["wind"]["speed"],
            "WD10M": item["wind"]["deg"]
        })

    df = pd.DataFrame(parsed_data)

    # --- 2. TIMEZONE & INTERPOLATION ---
    df['datetime'] = pd.to_datetime(df['datetime'], unit='s')
    df['datetime'] = df['datetime'].dt.tz_localize('UTC').dt.tz_convert('Asia/Kolkata')
    df.set_index('datetime', inplace=True)
    df = df.astype(float)
    df = df.resample('1h').mean().interpolate(method='linear')

    # --- 3. FEATURE ENGINEERING ---
    bhadla_site = pvlib.location.Location(lat, lon, tz='Asia/Kolkata')
    solpos = bhadla_site.get_solarposition(df.index)
    df['solar_zenith'] = solpos['apparent_zenith'].values

    clearsky = bhadla_site.get_clearsky(df.index, model='haurwitz')
    df['clear_sky_ghi'] = clearsky['ghi'].values

    df["cloud_%_lag1"] = df["cloud_%"].shift(1)
    df["cloud_diff_1hr"] = df["cloud_%"] - df["cloud_%_lag1"]
    df["hour"] = df.index.hour
    df["dayofyear"] = df.index.dayofyear
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["day_sin"] = np.sin(2 * np.pi * df["dayofyear"] / 365.25)
    df["day_cos"] = np.cos(2 * np.pi * df["dayofyear"] / 365.25)
    wd_rad = df["WD10M"] * np.pi / 180.0
    df["wind_u"] = df["WS10M"] * np.sin(wd_rad)
    df["wind_v"] = df["WS10M"] * np.cos(wd_rad)

    df = df.dropna()

    solar_features = [
        "T2M", "RH2M", "PS", "cloud_%", "WS10M",
        "wind_u", "wind_v", "hour_sin", "hour_cos",
        "day_sin", "day_cos", "cloud_%_lag1",
        "cloud_diff_1hr", "solar_zenith", "clear_sky_ghi"
    ]
    df_final = df[solar_features]

    # --- 4. PREDICTION ---
    X_scaled = scaler_X_solar.transform(df_final.values)
    timesteps = 24
    Xs, future_times = [], []

    for i in range(len(X_scaled) - timesteps):
        Xs.append(X_scaled[i: (i + timesteps)])
        future_times.append(df_final.index[i + timesteps])

    X_live_seq = np.array(Xs)
    scaled_preds = solar_model.predict(X_live_seq, verbose=0)  # verbose=0 keeps terminal clean

    final_ghi_preds = scaler_Y_solar.inverse_transform(scaled_preds)
    final_ghi_preds = np.clip(final_ghi_preds, 0, None)

    results_df = pd.DataFrame({
        'Datetime (IST)': future_times,
        'Predicted_GHI_W_m2': final_ghi_preds.flatten().round(2)
    })
    results_df.loc[results_df['Predicted_GHI_W_m2'] < 10, 'Predicted_GHI_W_m2'] = 0
    results_df.set_index('Datetime (IST)', inplace=True)

    # --- 5. MW CONVERSION ---
    # FIX: Align the 118-hour solar position data to the 94-hour prediction data
    solpos_aligned = solpos.loc[results_df.index]

    erbs = pvlib.irradiance.erbs(results_df['Predicted_GHI_W_m2'], solpos_aligned['apparent_zenith'], results_df.index)
    poa = pvlib.irradiance.get_total_irradiance(
        surface_tilt=27.0, surface_azimuth=180,
        solar_zenith=solpos_aligned['apparent_zenith'], solar_azimuth=solpos_aligned['azimuth'],
        dni=erbs['dni'], ghi=results_df['Predicted_GHI_W_m2'], dhi=erbs['dhi']
    )
    
    # Precise Operator Math
    dc_power_watts = poa['poa_global'] * panel_area_m2 * panel_efficiency
    ac_power_watts = dc_power_watts * inverter_efficiency * system_loss_factor
    results_df['Solar_MW'] = np.clip(ac_power_watts / 1_000_000, 0, plant_capacity_mw)
    
    return results_df[['Solar_MW']].reset_index()


# ==========================================
# 3. WIND CALLABLE MICROSERVICE FUNCTION
# ==========================================
def predict_wind_generation(lat, lon, cut_in_m_s, rated_m_s, cut_out_m_s, turbine_capacity_mw, num_turbines,
                            hub_height_m, terrain_type):
    """
    Fetches live weather, runs the BiLSTM, converts to Wind MW, and returns a DataFrame.
    """
    API_KEY = "74cb7d5c5faea12ff85c27af60363c6a"

    # --- 1. FETCH DATA ---
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    data = response.json()

    parsed_data = []
    for item in data['list']:
        parsed_data.append({
            "datetime": item["dt"],
            "T2M": item["main"]["temp"],
            "PS": item["main"]["pressure"] / 10.0,
            "WS10M": item["wind"]["speed"],
            "WD10M": item["wind"]["deg"]
        })

    df = pd.DataFrame(parsed_data)

    # --- 2. TIMEZONE & INTERPOLATION ---
    df['datetime'] = pd.to_datetime(df['datetime'], unit='s')
    df['datetime'] = df['datetime'].dt.tz_localize('UTC').dt.tz_convert('Asia/Kolkata')
    df.set_index('datetime', inplace=True)
    df = df.astype(float)
    df = df.resample('1h').mean().interpolate(method='linear')

    # --- 3. FEATURE ENGINEERING ---
    wd_rad = df["WD10M"] * np.pi / 180.0
    df["wind_u"] = df["WS10M"] * np.sin(wd_rad)
    df["wind_v"] = df["WS10M"] * np.cos(wd_rad)
    df["PS_diff_3hr"] = df["PS"] - df["PS"].shift(3)
    df["PS_diff_6hr"] = df["PS"] - df["PS"].shift(6)
    df["WS10M_lag1"] = df["WS10M"].shift(1)
    df["WS10M_roll3"] = df["WS10M"].rolling(window=3).mean()
    df["hour"] = df.index.hour
    df["dayofyear"] = df.index.dayofyear
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["day_sin"] = np.sin(2 * np.pi * df["dayofyear"] / 365.25)
    df["day_cos"] = np.cos(2 * np.pi * df["dayofyear"] / 365.25)

    df = df.dropna()

    wind_features = [
        "T2M", "PS", "WS10M", "wind_u", "wind_v",
        "PS_diff_3hr", "PS_diff_6hr", "WS10M_lag1",
        "WS10M_roll3", "hour_sin", "hour_cos",
        "day_sin", "day_cos"
    ]

    df_final = df[wind_features]

    # --- 4. PREDICTION ---
    X_scaled = scaler_X_wind.transform(df_final.values)

    timesteps = 24
    Xs, future_times = [], []
    for i in range(len(X_scaled) - timesteps):
        Xs.append(X_scaled[i: (i + timesteps)])
        future_times.append(df_final.index[i + timesteps])

    X_live_seq = np.array(Xs)
    scaled_preds = wind_model.predict(X_live_seq, verbose=0)

    final_wind_preds = scaler_Y_wind.inverse_transform(scaled_preds)
    final_wind_preds = np.clip(final_wind_preds, 0, None)

    results_df = pd.DataFrame({
        'Datetime (IST)': future_times,
        'Predicted_WS50M_m_s': final_wind_preds.flatten().round(2)
    })
    results_df.set_index('Datetime (IST)', inplace=True)

    # --- 5. MW CONVERSION ---
    TERRAIN_ALPHA_MAP = {
        "smooth_water": 0.10,
        "flat_open_land": 0.143,
        "farmland_with_trees": 0.20,
        "city_or_forest": 0.30
    }

    alpha = TERRAIN_ALPHA_MAP.get(terrain_type, 0.143)

    extrapolation_factor = (hub_height_m / 50) ** alpha
    results_df['Hub_Height_WS_m_s'] = results_df['Predicted_WS50M_m_s'] * extrapolation_factor

    def turbine_power_curve(wind_speed):
        if wind_speed < cut_in_m_s or wind_speed > cut_out_m_s:
            return 0.0
        elif wind_speed >= rated_m_s:
            return turbine_capacity_mw
        else:
            fraction = (wind_speed ** 3 - cut_in_m_s ** 3) / (rated_m_s ** 3 - cut_in_m_s ** 3)
            return turbine_capacity_mw * fraction

    results_df['Turbine_MW'] = results_df['Hub_Height_WS_m_s'].apply(turbine_power_curve)
    results_df['Wind_MW'] = results_df['Turbine_MW'] * num_turbines

    return results_df[['Wind_MW']].reset_index()