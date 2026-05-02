import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SurvivalPoint {
  week: number;
  probability: number;
}

interface SurvivalChartProps {
  data: SurvivalPoint[];
  medianWeek: number;
}

const SurvivalChart: React.FC<SurvivalChartProps> = ({ data, medianWeek }) => {
  return (
    <div className="w-full h-[300px] mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="week" 
            label={{ value: 'Weeks', position: 'insideBottom', offset: -5 }} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
          />
          <YAxis 
            label={{ value: 'Probability', angle: -90, position: 'insideLeft' }} 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Employment Probability']}
            labelFormatter={(label) => `Week ${label}`}
          />
          <Area
            type="monotone"
            dataKey="probability"
            stroke="#4f46e5"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorProb)"
          />
          {/* Median Week Marker */}
          <line
            x1={`${(medianWeek / data[data.length - 1]?.week) * 100}%`}
            y1="0"
            x2={`${(medianWeek / data[data.length - 1]?.week) * 100}%`}
            y2="100%"
            stroke="#ef4444"
            strokeDasharray="5 5"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex justify-center mt-2">
        <span className="text-xs text-gray-500 italic">
          Median expected employment at week <span className="text-indigo-600 font-bold">{medianWeek}</span>
        </span>
      </div>
    </div>
  );
};

export default SurvivalChart;
