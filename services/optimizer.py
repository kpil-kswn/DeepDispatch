import pandas as pd
import numpy as np
import datetime
import pytz

def run_pso_optimization(battery_capacity_mwh, initial_soc_mwh, df_solar=None, df_wind=None, max_charge_mw=10.0, max_discharge_mw=10.0, min_soc_mwh=5.0):
    """
    Takes optional solar and wind DataFrames, safely merges them, generates market pricing,
    and runs a Particle Swarm Optimization to maximize arbitrage profit.
    Returns a dictionary suitable for a JSON API response.
    """
    print("Initializing Virtual Power Plant Optimizer (PSO)...")

    # ==========================================
    # 1 & 2. DYNAMIC ASSET HANDLING & TIME ALIGNMENT
    # ==========================================
    ist = pytz.timezone('Asia/Kolkata')
    now_ist = pd.Timestamp.now(tz=ist)
    tomorrow_date = (now_ist + pd.Timedelta(days=1)).date()

    if df_solar is None and df_wind is None:
        raise ValueError("Operator must configure at least one Solar or Wind asset.")

    # Create arrays of zeros as fallbacks
    solar_gen = np.zeros(24)
    wind_gen = np.zeros(24)
    time_index = None

    # Process Solar if provided
    if df_solar is not None:
        df_solar['Date'] = pd.to_datetime(df_solar['Datetime (IST)']).dt.date
        df_day_s = df_solar[df_solar['Date'] == tomorrow_date].copy()
        if len(df_day_s)!=24: 
            df_day_s = df_solar.head(24).copy()
        df_day_s = df_day_s.sort_values(by='Datetime (IST)').reset_index(drop=True)
        solar_gen = df_day_s['Solar_MW'].values
        time_index = df_day_s['Datetime (IST)']

    # Process Wind if provided
    if df_wind is not None:
        df_wind['Date'] = pd.to_datetime(df_wind['Datetime (IST)']).dt.date
        df_day_w = df_wind[df_wind['Date'] == tomorrow_date].copy()
        if len(df_day_w)!=24: 
            df_day_w = df_wind.head(24).copy()
        df_day_w = df_day_w.sort_values(by='Datetime (IST)').reset_index(drop=True)
        wind_gen = df_day_w['Wind_MW'].values
        if time_index is None: time_index = df_day_w['Datetime (IST)']

    # Build the base DataFrame for the final output
    df_day = pd.DataFrame({
        'Datetime (IST)': time_index,
        'Solar_MW': solar_gen,
        'Wind_MW': wind_gen
    })

    # ==========================================
    # 3. GENERATE REALISTIC MARKET DATA
    # ==========================================
    def generate_market_data():
        base_demand = np.array([
            40, 38, 35, 35, 38, 45,
            55, 70, 85, 80, 75, 75,
            70, 70, 75, 80, 95, 110,
            120, 115, 100, 85, 65, 50
        ])
        demand_noise = np.random.uniform(0.95, 1.05, 24)
        actual_demand = base_demand * demand_noise

        prices = 20 + ((actual_demand - 35) / (120 - 35)) ** 2 * 130
        price_noise = np.random.uniform(0.90, 1.10, 24)
        actual_prices = prices + price_noise

        return np.round(actual_demand, 2), np.round(actual_prices, 2)

    mock_demand_mw, dynamic_prices = generate_market_data()

    # ==========================================
    # 4. DEFINE VPP RULES (Using Dynamic Inputs)
    # ==========================================
    def calculate_daily_profit(battery_actions):
        current_soc = initial_soc_mwh # Using dynamic input instead of constant
        total_profit = 0

        for t in range(24):
            action = battery_actions[t]
            total_gen = solar_gen[t] + wind_gen[t]

            if action > 0:
                actual_charge = min(action, max_charge_mw, battery_capacity_mwh - current_soc, total_gen)
                current_soc += actual_charge
                power_to_grid = total_gen - actual_charge
            else:
                actual_discharge = min(abs(action), max_discharge_mw, current_soc - min_soc_mwh) # Using dynamic min
                current_soc -= actual_discharge
                power_to_grid = total_gen + actual_discharge

            power_to_grid = max(0, power_to_grid)
            total_profit += power_to_grid * dynamic_prices[t]

        return total_profit

    # ==========================================
    # 5. PARTICLE SWARM OPTIMIZATION
    # ==========================================
    print(f"Running Optimization for {tomorrow_date} with Dynamic Market Pricing...")

    num_particles = 100
    num_iterations = 200
    num_dimensions = 24

    particles = np.random.uniform(-10, 10, (num_particles, num_dimensions))
    velocities = np.zeros((num_particles, num_dimensions))

    pbest_positions = particles.copy()
    pbest_scores = np.array([calculate_daily_profit(p) for p in particles])

    gbest_index = np.argmax(pbest_scores)
    gbest_position = pbest_positions[gbest_index].copy()
    gbest_score = pbest_scores[gbest_index]

    w, c1, c2 = 0.5, 1.5, 1.5

    for i in range(num_iterations):
        for p in range(num_particles):
            r1, r2 = np.random.rand(2)
            velocities[p] = (w * velocities[p]) + (c1 * r1 * (pbest_positions[p] - particles[p])) + c2 * r2 * (gbest_position - particles[p])

            particles[p] = np.clip(particles[p] + velocities[p], -10, 10)
            score = calculate_daily_profit(particles[p])

            if score > pbest_scores[p]:
                pbest_scores[p] = score
                pbest_positions[p] = particles[p].copy()
                if score > gbest_score:
                    gbest_score = score
                    gbest_position = particles[p].copy()

    # ==========================================
    # 6. GENERATE THE FINAL JSON SCHEDULE
    # ==========================================
    optimal_schedule = gbest_position
    final_soc = [initial_soc_mwh] # Starts dynamically
    grid_dispatch = []

    current_soc = initial_soc_mwh
    for t in range(24):
        action = optimal_schedule[t]
        total_gen = solar_gen[t] + wind_gen[t]

        if action > 0:
            actual_action = min(action, max_charge_mw, battery_capacity_mwh - current_soc, total_gen)
            current_soc += actual_action
            power_to_grid = total_gen - actual_action
        else:
            actual_action = -min(abs(action), max_discharge_mw, current_soc - min_soc_mwh)
            current_soc += actual_action
            power_to_grid = total_gen - actual_action

        final_soc.append(current_soc)
        grid_dispatch.append(max(0, power_to_grid))

    df_day['Grid_Demand_MW'] = mock_demand_mw
    df_day['Price_Tier_$/MWh'] = dynamic_prices
    df_day['Target_Battery_Action_MW'] = optimal_schedule.round(2)
    df_day['Actual_Grid_Sales_MW'] = np.array(grid_dispatch).round(2)
    df_day['Battery_SoC_MWh'] = np.array(final_soc[1:]).round(2)

    columns_to_keep = ['Datetime (IST)', 'Solar_MW', 'Wind_MW', 'Grid_Demand_MW', 'Price_Tier_$/MWh',
                       'Target_Battery_Action_MW', 'Battery_SoC_MWh', 'Actual_Grid_Sales_MW']
    final_master_df = df_day[columns_to_keep]

    # Convert Timestamps to strings so they can be sent as JSON over the internet
    final_master_df['Datetime (IST)'] = final_master_df['Datetime (IST)'].astype(str)

    # Convert the DataFrame to a list of dictionaries
    schedule_json = final_master_df.to_dict(orient='records')

    return {
        "target_date": str(tomorrow_date),
        "total_profit_usd": round(gbest_score, 2),
        "schedule": schedule_json
    }