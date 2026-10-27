import os
from pathlib import Path

# Base Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"

TRANSIT_DATA_PATH = DATA_DIR / "transport_network.json"
DISRUPTIONS_SEED_PATH = DATA_DIR / "disruptions_seed.json"

# API Settings
API_TITLE = "RouteWise Transit API"
API_VERSION = "1.0.0"
API_DESCRIPTION = "API for Smart Public Transport Route Planning, DFA Status Validation, and CPU Pipeline Simulation (DAA + FLAT + COA Micro-Project)"

# CORS Origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:4173",
    "*"
]
