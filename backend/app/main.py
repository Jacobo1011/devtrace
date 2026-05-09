from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import psutil
import asyncio
import threading
import time
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

history = []
boot_time = psutil.boot_time()

# -------------------------
# METRICS CORE
# -------------------------

def get_metrics():
    net = psutil.net_io_counters()

    return {
        "cpu": psutil.cpu_percent(),
        "memory": psutil.virtual_memory().percent,
        "disk": psutil.disk_usage("C:\\").percent if psutil.WINDOWS else psutil.disk_usage("/").percent,

        # RED (bytes enviados/recibidos)
        "network": {
            "sent_mb": round(net.bytes_sent / 1024 / 1024, 2),
            "recv_mb": round(net.bytes_recv / 1024 / 1024, 2),
        },

        # UPTIME
        "uptime_seconds": int(time.time() - boot_time),
    }

# -------------------------
# ROUTES
# -------------------------

@app.get("/")
def root():
    return {"status": "running"}

@app.get("/metrics")
def metrics():
    return get_metrics()

@app.get("/history")
def get_history():
    return history

# -------------------------
# ALERTS
# -------------------------

@app.get("/alerts")
def alerts():
    m = get_metrics()
    out = []

    if m["cpu"] > 80:
        out.append("HIGH CPU USAGE")

    if m["memory"] > 85:
        out.append("HIGH MEMORY USAGE")

    if m["disk"] > 90:
        out.append("DISK SPACE CRITICAL")

    return out

# -------------------------
# PROCESSES
# -------------------------

@app.get("/processes")
def processes():
    result = []

    for p in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status']):
        try:
            result.append({
                "pid": p.info["pid"],
                "name": p.info["name"],
                "cpu": p.info["cpu_percent"],
                "memory": round(p.info["memory_info"].rss / 1024 / 1024, 2),
                "status": p.info["status"]
            })
        except:
            pass

    return sorted(result, key=lambda x: x["memory"], reverse=True)[:20]

# -------------------------
# WEBSOCKET REALTIME
# -------------------------

@app.websocket("/ws/live")
async def ws_live(ws: WebSocket):
    await ws.accept()

    try:
        while True:
            m = get_metrics()
            await ws.send_json(m)
            await asyncio.sleep(1)

    except WebSocketDisconnect:
        print("disconnected")

# -------------------------
# HISTORY COLLECTOR
# -------------------------

def collector():
    while True:
        m = get_metrics()

        history.append({
            "cpu": m["cpu"],
            "memory": m["memory"],
            "disk": m["disk"],
            "net_sent": m["network"]["sent_mb"],
            "net_recv": m["network"]["recv_mb"],
            "uptime": m["uptime_seconds"],
            "time": datetime.now().strftime("%H:%M:%S")
        })

        if len(history) > 120:
            history.pop(0)

        time.sleep(2)

threading.Thread(target=collector, daemon=True).start()