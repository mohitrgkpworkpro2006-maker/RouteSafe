#  RouteSafe - Pedestrian Hazard Detection & Dynamic Detour System

> **A smart, community-driven, and AI-assisted pedestrian safety platform built to navigate around stray dog packs and dark street hazards in real time.**

---

## 📌 Project Overview

**RouteSafe** addresses urban pedestrian safety by combining real-time crowdsourced reporting with computer vision detection to calculate dynamic detour routes. Designed around a bounded sandbox in **Nalanchira, Trivandrum**, RouteSafe ensures low-friction hazard logging for pedestrians while maintaining reliable path calculation to navigate around active threats.

---

## ✨ Key Features

* **⚡ 3-Tap Micro-Reporting System:** Rapid, 5-second hazard logging interface designed to minimize phone distraction while walking in dark or unsafe areas.
* **🐕 Automated CV Detection Engine:** Powered by a custom **Ultralytics YOLOv8** model fine-tuned to identify stray dog packs from street footage and CCTV feeds.
* **⏳ Temporal Hazard Decay:** Smart auto-expiring hazard logic (30-minute lifecycle) to ensure old alerts don't permanently block safe streets.
* **🛡️ Dynamic Rerouting Engine:** Automatically detects active hazard zones, greys out blocked street segments, and highlights high-safety alternate bypasses on the interactive map.
* **🗺️ Zero-Quota Web Mapping:** Built with **Leaflet.js & OpenStreetMap** for fast, free, and responsive client-side spatial rendering.

---

## 🛠️ System Architecture

                   ┌─────────────────────────┐
                   │   Pedestrian UI / Web   │
                   │ (Leaflet.js + OSM Tiles)│
                   └────────────┬────────────┘
                                │
           ┌────────────────────┴────────────────────┐
           │                                         │
    1. 3-Tap Micro-Report                     2. Fetch Safe Route
           │                                         │
           ▼                                         ▼

┌───────────────────────┐                 ┌───────────────────────┐
│  POST /api/hazard     │                 │   POST /api/route     │
└───────────┬───────────┘                 └───────────┬───────────┘
│                                         │
└────────────────────┬────────────────────┘
│
▼
┌─────────────────────────┐
│   FastAPI Engine        │
│ (Temporal Decay & Logic)│
└────────────┬────────────┘
│
[ Verification Check ]
│
┌───────────┴───────────┐
│                       │
▼                       ▼
[ Crowdsourced Report ]   [ Custom YOLOv8 CV Model ]

---

## 🚀 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+), Leaflet.js |
| **Mapping & GIS** | OpenStreetMap (OSM) Tiles |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **Computer Vision** | Ultralytics YOLOv8n, OpenCV, PyTorch |
| **Dataset & Training**| Roboflow, Google Colab |

---

## 🔌 API Contract Overview

The backend and frontend communicate asynchronously via lightweight JSON contracts.

### 1. Report a Hazard
* **Endpoint:** `POST /api/hazard`
* **Payload:**
  ```json
  {
    "lat": 8.5510,
    "lng": 76.9550,
    "reason": "Dog Pack",
    "pack_size": "3-5",
    "reported_by": "user_3tap"
  }

  ---

## 🚀 Tech Stack

| Domain | Technology |
| :--- | :--- |
| **Frontend UI** | HTML5, CSS3, JavaScript (ES6+), Leaflet.js |
| **Mapping & GIS** | OpenStreetMap (OSM) Tiles |
| **Backend API** | Python 3.10+, FastAPI, Uvicorn, Pydantic |
| **Computer Vision** | Ultralytics YOLOv8n, OpenCV, PyTorch |
| **Dataset & Training**| Roboflow, Google Colab |

---

## 🔌 API Contract Overview

The backend and frontend communicate asynchronously via lightweight JSON contracts.

### 1. Report a Hazard
* **Endpoint:** `POST /api/hazard`
* **Payload:**
  ```json
  {
    "lat": 8.5510,
    "lng": 76.9550,
    "reason": "Dog Pack",
    "pack_size": "3-5",
    "reported_by": "user_3tap"
  }

### 2. Calculate Dynamic Route

  * **Endpoint: POST /api/route**

  * ** Payload:**

  {
  "origin": [8.5484, 76.9535],
  "destination": [8.5540, 76.9570]
  }

  {
  "route_type": "safe_detour",
  "has_hazard": true,
  "hazard_info": {
    "reason": "Dog Pack",
    "reported_mins_ago": 4
  },
  "blocked_waypoints": [
    [8.5484, 76.9535],
    [8.5510, 76.9550]
  ],
  "waypoints": [
    [8.5484, 76.9535],
    [8.5470, 76.9560],
    [8.5520, 76.9580],
    [8.5540, 76.9570]
  ]
  }

## ⚙️ Local Development Setup
* **Prerequisites**

    Python 3.10+ installed on your system.

  ### 1. Clone the repository
  git clone [https://github.com/your-username/routesafe.git](https://github.com/your-username/routesafe.git)
  cd routesafe

  ### 2. Backend Setup
  # Navigate to backend directory (if separate)
  cd backend
  
  # Install dependencies
  pip install fastapi uvicorn pydantic
  
  # Launch the FastAPI development server
  uvicorn main:app --reload --port 8000

  - The API will be available locally at: http://localhost:8000
  - Interactive API Documentation (Swagger UI): http://localhost:8000/docs
 
  ### 3. Frontend Setup
  - Open the frontend folder.
  - Launch index.html using Live Server in VS Code (or open it directly in any browser).

  ## 🎓 Academic / Proof-of-Concept Scope
    Sandbox Region: Bounded navigation sandbox centered around Nalanchira, Trivandrum (8.5484° N, 76.9535° E).
    CV Training Weights: Fine-tuned best.pt model trained on custom annotated dataset targeting dog packs and nighttime hazards.

  ## 📜 License
    This project is open-source and developed for academic demonstration purposes.
    
