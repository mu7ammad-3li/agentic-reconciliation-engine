"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, AlertTriangle, XOctagon, ChevronRight, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function DashboardPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTriggering, setIsTriggering] = useState(false);

  const fetchRuns = () => {
    fetch("/api/runs")
      .then((res) => res.json())
      .then((data) => {
        setRuns(Array.isArray(data) ? data : []);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleTriggerRun = async () => {
    setIsTriggering(true);
    try {
      await fetch("/api/trigger-run", { method: "POST" });
      fetchRuns(); // Refresh data after run completes
    } catch (e) {
      console.error(e);
      alert("Failed to trigger run.");
    } finally {
      setIsTriggering(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-blue-600 font-medium">Loading intelligence...</div>;
  }

  // Calculate aggregates
  const totalRuns = runs.length;
  const totalMatched = runs.reduce((acc, r) => acc + (r.matched_count || 0), 0);
  const totalPartial = runs.reduce((acc, r) => acc + (r.partial_count || 0), 0);
  const totalUnmatched = runs.reduce((acc, r) => acc + (r.unmatched_count || 0), 0);
  
  const chartData = [
    { name: 'Matched', value: totalMatched, color: '#10b981' },
    { name: 'Partial', value: totalPartial, color: '#f59e0b' },
    { name: 'Unmatched', value: totalUnmatched, color: '#ef4444' },
  ].filter(d => d.value > 0);
  
  if (chartData.length === 0) {
    chartData.push({ name: 'No Data', value: 1, color: '#e2e8f0' });
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1 font-medium text-sm">AI automated reconciliation metrics</p>
        </div>
        
        <button 
          onClick={handleTriggerRun}
          disabled={isTriggering}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTriggering ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing AI Cycle...</>
          ) : (
            <><Play className="w-4 h-4" /> Trigger AI Run</>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Donut Chart */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-6 lg:col-span-1 flex flex-col items-center justify-center relative">
          <h3 className="font-semibold w-full text-left text-gray-700 mb-2">Reconciliation Progress</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1e293b' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:col-span-2">
          <KPI Card title="Total Runs Executed" value={totalRuns} icon={Activity} color="text-blue-600" bg="bg-blue-50" border="border-blue-100" />
          <KPI Card title="Perfect Matches" value={totalMatched} icon={CheckCircle2} color="text-green-600" bg="bg-green-50" border="border-green-100" />
          <KPI Card title="Partial Matches" value={totalPartial} icon={AlertTriangle} color="text-amber-600" bg="bg-amber-50" border="border-amber-100" />
          <KPI Card title="Critical Exceptions" value={totalUnmatched} icon={XOctagon} color="text-red-600" bg="bg-red-50" border="border-red-100" />
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <h3 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
            <Activity className="w-5 h-5 text-blue-600" /> System Run History
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {runs.map((run) => (
            <Link key={run.id} href={`/runs/${run.id}`} className="block hover:bg-gray-50 transition-all duration-200">
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${run.status === 'completed' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    <span className="font-medium text-gray-900">Account {run.account_id.split('-')[0]}</span>
                    <span className="text-xs font-medium text-gray-500 border border-gray-200 px-2 py-0.5 rounded bg-white">
                      {new Date(run.period_start).toLocaleDateString()} - {new Date(run.period_end).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs font-medium text-gray-500">
                    <span>{run.total_ledger_txns} Ledger Txns</span>
                    <span>&bull;</span>
                    <span>{run.total_bank_txns} Bank Txns</span>
                    <span>&bull;</span>
                    <span>Ran {formatDistanceToNow(new Date(run.created_at))} ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex gap-2 text-sm font-medium">
                    <span className="text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-md">{run.matched_count}</span>
                    <span className="text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">{run.partial_count}</span>
                    <span className="text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-md">{run.unmatched_count}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 hidden sm:block" />
                </div>
              </div>
            </Link>
          ))}
          {runs.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
              <Activity className="w-12 h-12 mb-4 text-gray-300" />
              <p>No reconciliation runs found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, icon: Icon, color, bg, border }: any) {
  return (
    <div className={`bg-white border ${border} shadow-sm rounded-xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <h4 className="text-gray-500 font-semibold text-xs uppercase tracking-wider">{title}</h4>
        <div className={`w-10 h-10 rounded-lg ${bg} ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <div className="text-3xl font-bold text-gray-900">
          {value}
        </div>
      </div>
    </div>
  );
}
