"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [metrics, setMetrics] = useState<any>({});
  const [processes, setProcesses] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [metricsRes, processRes, alertRes, historyRes] =
        await Promise.all([
          fetch("http://127.0.0.1:8000/metrics"),
          fetch("http://127.0.0.1:8000/processes"),
          fetch("http://127.0.0.1:8000/alerts"),
          fetch("http://127.0.0.1:8000/history"),
        ]);

      setMetrics(await metricsRes.json());
      setProcesses(await processRes.json());
      setAlerts(await alertRes.json());
      setHistory(await historyRes.json());
    };

    fetchData();
    const interval = setInterval(fetchData, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="p-10 bg-black min-h-screen text-white">
      <h1 className="text-5xl font-bold mb-2">DevTrace</h1>
      <p className="text-gray-400 mb-8">Real-time observability dashboard</p>

      {alerts.length > 0 && (
        <div className="bg-red-900 p-4 rounded mb-8">
          <h2 className="text-xl font-bold mb-2">ALERTS</h2>
          {alerts.map((a, i) => (
            <div key={i}>{a}</div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6 mb-10">
        <MetricCard title="CPU" value={`${metrics.cpu}%`} />
        <MetricCard title="Memory" value={`${metrics.memory}%`} />
        <MetricCard title="Disk" value={`${metrics.disk}%`} />
      </div>

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
            <tr key={proc.pid} className="border-b border-gray-800">
              <td className="p-2">{proc.pid}</td>
              <td>{proc.name}</td>
              <td>{proc.cpu}%</td>
              <td>{proc.memory} MB</td>
              <td>{proc.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-bold mt-10 mb-4">History (CPU)</h2>

      <div className="bg-gray-900 p-4 rounded">
        {history.map((h, i) => (
          <div key={i} className="text-sm">
            {h.time} → CPU: {h.cpu}% | RAM: {h.memory}%
          </div>
        ))}
      </div>
    </main>
  );
}

function MetricCard({ title, value }: any) {
  return (
    <div className="bg-gray-900 p-6 rounded-xl">
      <h3 className="text-gray-400">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}