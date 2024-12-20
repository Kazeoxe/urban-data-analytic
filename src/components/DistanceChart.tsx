import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { DistanceStats } from '../utils/earthquakeAnalysis';

type DistanceChartProps = {
  data: DistanceStats[];
};

const DistanceChart = ({ data }: DistanceChartProps) => {
  return (
    <div className="w-full h-96 p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Distribution des séismes par distance des plaques tectoniques
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="distance"
            label={{ value: 'Distance (km)', position: 'bottom', offset: 0 }}
          />
          <YAxis
            label={{
              value: 'Nombre de séismes',
              angle: -90,
              position: 'insideLeft'
            }}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'Nombre') {
                return [value, name];
              }
              return [`${Number(value).toFixed(1)}%`, name];
            }}
            labelFormatter={(label) => `≤ ${label} km`}
          />
          <Legend />
          <Bar dataKey="count" name="Nombre" fill="#8884d8" />
          <Bar dataKey="percentage" name="Pourcentage" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DistanceChart;