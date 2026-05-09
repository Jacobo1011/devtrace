"use client";

import { useEffect, useState } from "react";

type Metrics = {
  cpu: number;
  memory: number;
  disk: number;
  network?: {
    sent_mb: number;
    recv_mb: number;
  };
  uptime_seconds?: number;
};

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
  });

  const [processes, setProcesses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // -------------------------
  // WEBSOCKET (REALTIME METRICS)
  // -------------------------
  useEffect(() => {
    const ws = new WebSocket("ws://127.0.0.1:8000/ws/live");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      setMetrics((prev) => ({
        ...prev,
        cpu: data.cpu,
        memory: data.memory,
        disk: data.disk,
        network: data.network,
        uptime_seconds: data.uptime_seconds,
      }));
    };

    ws.onerror = (err) => {
      console.error("WebSocket error:", err);
    };

    return () => ws.close();
  }, []);

  // -------------------------
  // EXTRA DATA (NON-REALTIME)
  // -------------------------
  useEffect(() => {
    const fetchExtras = async () => {
      const [procRes, alertRes, histRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/processes"),
        fetch("http://127.0.0.1:8000/alerts"),
        fetch("http://127.0.0.1:8000/history"),
      ]);

      setProcesses(await procRes.json());
      setAlerts(await alertRes.json());
      setHistory(await histRes.json());
    };

    fetchExtras();
    const interval = setInterval(fetchExtras, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-5xl font-bold mb-2">DevTrace</h1>
      <p className="text-gray-400 mb-8">
        Real-time observability dashboard
      </p>

      {/* ALERTS */}
      {alerts.length > 0 && (
        <div className="bg-red-900 p-4 rounded mb-8">
          <h2 className="text-xl font-bold mb-2">ALERTS</h2>
          {alerts.map((a, i) => (
            <div key={i}>{a}</div>
          ))}
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <MetricCard title="CPU" value={`${metrics.cpu}%`} />
        <MetricCard title="Memory" value={`${metrics.memory}%`} />
        <MetricCard title="Disk" value={`${metrics.disk}%`} />
      </div>

      {/* NETWORK + UPTIME */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <div className="bg-gray-900 p-6 rounded-xl">
          <h3 className="text-gray-400">Network</h3>
          <p className="mt-2">
            Sent: {metrics.network?.sent_mb ?? 0} MB
          </p>
          <p>
            Received: {metrics.network?.recv_mb ?? 0} MB
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl">
          <h3 className="text-gray-400">Uptime</h3>
          <p className="text-2xl font-bold mt-2">
            {Math.floor((metrics.uptime_seconds ?? 0) / 60)} min
          </p>
        </div>
      </div>

      {/* PROCESSES */}
      <h2 className="text-2xl font-bold mb-4">Process Explorer</h2>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-900">
            <th className="p-2">PID</th>
            <th>Name</th>
            <th>CPU</th>
            <th>RAM</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {processes.map((proc) => (
            <tr
              key={proc.pid}
              className="border-b border-gray-800"
            >
              <td className="p-2">{proc.pid}</td>
              <td>{proc.name}</td>
              <td>{proc.cpu}%</td>
              <td>{proc.memory} MB</td>
              <td>{proc.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* HISTORY */}
      <h2 className="text-2xl font-bold mt-10 mb-4">
        History (CPU / RAM / Disk)
      </h2>

      <div className="bg-gray-900 p-4 rounded">
        {history.map((h, i) => (
          <div key={i} className="text-sm">
            {h.time} → CPU: {h.cpu}% | RAM: {h.memory}% | Disk: {h.disk}%
          </div>
        ))}
      </div>
    </main>
  );
}

// -------------------------
// UI CARD
// -------------------------
function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl">
      <h3 className="text-gray-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}