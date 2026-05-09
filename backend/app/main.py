from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psutil

app = FastAPI()

history = []

from datetime import datetime

@app.get("/history")
def get_history():
    return history

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_metrics():
    return {
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage("C:\\").percent
    }

@app.get("/")
def root():
    return {"status": "running"}

@app.get("/metrics")
def metrics():
    return get_metrics()

@app.get("/processes")
def processes():
    process_list = []

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status']):
        try:
            process_list.append({
                "pid": proc.info["pid"],
                "name": proc.info["name"],
                "cpu": proc.info["cpu_percent"],
                "memory": round(proc.info["memory_info"].rss / 1024 / 1024, 2),
                "status": proc.info["status"]
            })
        except:
            pass

    return sorted(process_list, key=lambda x: x["memory"], reverse=True)[:20]

@app.get("/alerts")
def alerts():
    metrics = get_metrics()
    alerts = []

    if metrics["cpu"] > 80:
        alerts.append("HIGH CPU USAGE")

    if metrics["memory"] > 85:
        alerts.append("HIGH MEMORY USAGE")

    if metrics["disk"] > 90:
        alerts.append("DISK SPACE CRITICAL")

    return alerts

import threading
import time

def collect_metrics():
    while True:
        metrics = get_metrics()

        history.append({
            "cpu": metrics["cpu"],
            "memory": metrics["memory"],
            "disk": metrics["disk"],
            "time": datetime.now().strftime("%H:%M:%S")
        })

        # evita crecer infinito
        if len(history) > 100:
            history.pop(0)

        time.sleep(2)

threading.Thread(target=collect_metrics, daemon=True).start()