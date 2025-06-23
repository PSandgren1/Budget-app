import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface DiagramProps {
  incomes: { amount: number; category?: string }[];
  expenses: { amount: number; category?: string }[];
  savings: { amount: number }[];
}

const DiagramTab: React.FC<DiagramProps> = ({ incomes, expenses, savings }) => {
  // Summera per kategori
  const expenseCategoryMap: Record<string, number> = {};
  expenses.forEach(e => {
    if (!e.category) return;
    expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
  });

  const incomeSum = incomes.reduce((sum, i) => sum + i.amount, 0);
  const expenseSum = expenses.reduce((sum, i) => sum + i.amount, 0);
  const savingsSum = savings.reduce((sum, i) => sum + i.amount, 0);

  // Data för cirkeldiagram (fördelning utgifter per kategori)
  const pieData = {
    labels: Object.keys(expenseCategoryMap),
    datasets: [
      {
        label: 'Utgifter per kategori',
        data: Object.values(expenseCategoryMap),
        backgroundColor: [
          '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6', '#facc15', '#4ade80', '#38bdf8', '#818cf8', '#f472b6', '#f59e42'
        ],
      },
    ],
  };

  // Data för stapeldiagram (inkomst, utgift, sparande)
  const barData = {
    labels: ['Inkomster', 'Utgifter', 'Sparande'],
    datasets: [
      {
        label: 'SEK',
        data: [incomeSum, expenseSum, savingsSum],
        backgroundColor: ['#34d399', '#f87171', '#fbbf24'],
      },
    ],
  };

  return (
    <div className="w-full"> {/* Tar hela bredden av föräldern */}
      <div className="flex flex-col md:flex-row gap-10 w-full">
        <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Utgifter per kategori</h2>
          <Pie data={pieData} />
        </div>
        <div className="flex-1 bg-gray-800 p-6 rounded-lg shadow-xl">
          <h2 className="text-xl font-semibold text-yellow-400 mb-4">Översikt denna månad</h2>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
};

export default DiagramTab;
