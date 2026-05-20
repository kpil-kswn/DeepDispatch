# ⚡ DeepDispatch: AI-Driven Virtual Power Plant Optimizer

**Live Demo:** [https://deepdispatch12.vercel.app]

DeepDispatch is a full-stack, AI-powered Virtual Power Plant (VPP) dashboard designed to optimize renewable energy assets. By combining deep learning forecasting with Particle Swarm Optimization (PSO), DeepDispatch calculates the most profitable battery dispatch schedules for microgrids utilizing solar and wind generation.

## 🚀 Features

- **Multi-Asset Forecasting:** Generates 96-hour predictions for Solar and Wind generation based on geographical coordinates and hardware configurations.
- **AI Battery Arbitrage (PSO):** Utilizes Particle Swarm Optimization to determine when to charge from the grid, discharge to the grid, or store renewable energy to maximize daily profit.
- **Microservice Architecture:** Decoupled Next.js frontend and Python/FastAPI machine learning engine.
- **Authentication:** Secure Google OAuth integration via NextAuth.
- **Monetization & Webhooks:** Integrated Razorpay checkout with secure webhook listeners for automated "Pro" tier database updates.

## 🏗️ Tech Stack

**Frontend (Client & API Routes):**
- Next.js (App Router)
- React & Tailwind CSS
- NextAuth.js (Google OAuth)
- Razorpay Payment Gateway

**Backend (ML Engine):**
- Python 3
- FastAPI & Uvicorn
- Pandas & Scikit-learn (Data Processing & ML Models)
- Particle Swarm Optimization (PSO) Algorithm

**Database & Deployment:**
- MongoDB & Mongoose
- Vercel (Frontend Hosting)
- Render (Python ML Engine Hosting)

## 🔌 Core AI API Endpoints (FastAPI)

The Python backend exposes two primary endpoints for the Next.js client:

### `POST /api/v1/forecast`
Generates a 96-hour generation forecast.
- **Accepts:** `latitude`, `longitude`, `solar` configuration, and `wind` configuration.
- **Returns:** Time-series generation predictions in MW.

### `POST /api/v1/optimize`
Runs the PSO algorithm to determine the optimal battery dispatch schedule.
- **Accepts:** Site load demand, battery capacity, min/max SOC, charge/discharge rates, and asset configurations.
- **Returns:** Financial analysis, total projected profit, and hourly charge/discharge instructions.

## ⚙️ Running the Microservices Locally

If you wish to boot up the individual services locally to inspect the architecture and endpoints, follow these steps:

### 1. Start the Python ML Engine (Backend)
Open a terminal and navigate to the folder containing the Python backend:
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn main:app --reload --port 8000
```
*The AI API will now be running at `http://localhost:8000`*

### 2. Start the Next.js Dashboard (Frontend)
Open a new terminal and navigate to the folder containing the Next.js frontend:
```bash
# Navigate into the frontend directory
cd vpp-dashboard

# Install the required Node modules
npm install

# Start the Next.js development server
npm run dev
```
*The Frontend Dashboard will now be running at `http://localhost:3000`*

## 👨‍💻 Architecture & Design Notes
This project demonstrates modern full-stack development patterns:
- **Client/Server Component Separation:** Strict use of Next.js App Router features, heavily relying on Server Components to reduce client bundle size, with explicit `'use client'` boundaries for interactive UI and Modals.
- **Webhook Security:** Razorpay webhooks are secured using `crypto.createHmac` SHA256 signature verification to prevent spoofing.
- **Dynamic Imports:** UI Modals are dynamically imported (`next/dynamic` with `ssr: false`) to bypass static rendering limitations for components requiring URL search parameters.
