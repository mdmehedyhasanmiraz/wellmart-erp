'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type BranchStats = {
  totalSales: number;
  monthlySales: number;
  todaysSales: number;
  totalDue: number;
  monthlyDue: number;
  todaysDue: number;
  totalCollection: number;
  monthlyCollection: number;
  todaysCollection: number;
};

type MonthlyPoint = { month: string; sales: number; collection: number };

type MonthlyResponse = { months: MonthlyPoint[] };

export default function BranchDashboard() {
  const { userProfile } = useAuth();
  const branchId = userProfile?.branch_id;
  const [stats, setStats] = useState<BranchStats | null>(null);
  const [monthly, setMonthly] = useState<MonthlyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!branchId) { setLoading(false); return; }
      try {
        const [sRes, mRes] = await Promise.all([
          fetch(`/api/branch/stats?branchId=${branchId}`),
          fetch(`/api/branch/stats/monthly?branchId=${branchId}`),
        ]);
        const sData = await sRes.json();
        const mData: MonthlyResponse = await mRes.json();
        setStats(sData);
        setMonthly(mData.months || []);
      } catch (e) {
        setStats(null);
        setMonthly([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [branchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-2">৳{(value || 0).toFixed(2)}</p>
    </div>
  );

  const LineAreaChart = ({
    title,
    data,
    keyName,
    gradientFrom,
    gradientTo,
    stroke,
  }: {
    title: string;
    data: MonthlyPoint[];
    keyName: 'sales' | 'collection';
    gradientFrom: string;
    gradientTo: string;
    stroke: string;
  }) => {
    const w = 640;
    const h = 220;
    const pad = 32;
    const values = data.map((d) => d[keyName]);
    const max = Math.max(1, ...values);
    const xStep = (w - pad * 2) / Math.max(1, data.length - 1);
    const yScale = (v: number) => h - pad - (v / max) * (h - pad * 2);
    const points = data.map((d, i) => [pad + i * xStep, yScale(d[keyName])] as const);
    const path = points.map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`)).join(' ');
    const area = `${path} L ${pad + (data.length - 1) * xStep},${h - pad} L ${pad},${h - pad} Z`;
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xs text-gray-400">Last 12 months</p>
        </div>
        <svg width={w} height={h} className="w-full h-auto">
          <defs>
            <linearGradient id={`grad-${keyName}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.35" />
              <stop offset="100%" stopColor={gradientTo} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#E5E7EB" />
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#E5E7EB" />
          <path d={area} fill={`url(#grad-${keyName})`} />
          <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
          {data.map((d, i) => (
            <text key={i} x={pad + i * xStep} y={h - pad + 16} textAnchor="middle" className="fill-gray-400 text-[10px]">
              {d.month.slice(2)}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Branch Dashboard</h1>
          <p className="mt-2">Branch-specific sales metrics</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Sales" value={stats.totalSales} />
          <StatCard title="Monthly Sales" value={stats.monthlySales} />
          <StatCard title="Today’s Sales" value={stats.todaysSales} />

          <StatCard title="Total Due" value={stats.totalDue} />
          <StatCard title="Monthly Due" value={stats.monthlyDue} />
          <StatCard title="Today’s Due" value={stats.todaysDue} />

          <StatCard title="Total Collection" value={stats.totalCollection} />
          <StatCard title="Monthly Collection" value={stats.monthlyCollection} />
          <StatCard title="Today’s Collection" value={stats.todaysCollection} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineAreaChart
          title="Monthly Sales"
          data={monthly}
          keyName="sales"
          gradientFrom="#34d399"
          gradientTo="#d1fae5"
          stroke="#10b981"
        />
        <LineAreaChart
          title="Monthly Collection"
          data={monthly}
          keyName="collection"
          gradientFrom="#60a5fa"
          gradientTo="#dbeafe"
          stroke="#3b82f6"
        />
      </div>
    </div>
  );
}
