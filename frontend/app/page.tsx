"use client";

import { useEffect, useState } from "react";

type Metrics = {
  cpu: number;
  memory: number;
  disk: number;
};

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics>({
    cpu: 0,
    memory: 0,
    disk: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch("http://localhost:8000/metrics");
      const data = await res.json();
      setMetrics(data);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  const getStatus = (value: number) => {
    if (value > 80) return "High";
    if (value > 50) return "Moderate";
    return "Stable";
  };

  const MetricCard = ({
    title,
    value,
  }: {
    title: string;
    value: number;
  }) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
      <h2 className="text-zinc-400 text-sm uppercase tracking-wider">
        {title}
      </h2>

      <p className="text-5xl font-bold mt-4">{value}%</p>

      <div className="w-full bg-zinc-800 rounded-full h-3 mt-5 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-zinc-400">
        Status: {getStatus(value)}
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-6xl font-bold tracking-tight">DevTrace</h1>
          <p className="text-zinc-400 mt-3 text-lg">
            Real-time system monitoring dashboard
          </p>
        </header>

        <section className="grid md:grid-cols-3 gap-8">
          <MetricCard title="CPU Usage" value={metrics.cpu} />
          <MetricCard title="Memory Usage" value={metrics.memory} />
          <MetricCard title="Disk Usage" value={metrics.disk} />
        </section>
      </div>
    </main>
  );
}