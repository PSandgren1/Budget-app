import React from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  LineController,
  PointElement,
  LineElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, LineController, PointElement, LineElement);

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

  // Linjediagram: inkomster, utgifter, sparande per månad över året
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  const monthLabels = months.map(m => m.slice(5));
  const incomePerMonth = months.map(month => {
    const data = localStorage.getItem(`budget-data-${month}`);
    if (!data) return 0;
    return (JSON.parse(data).incomes || []).reduce((sum: number, i: any) => sum + i.amount, 0);
  });
  const expensePerMonth = months.map(month => {
    const data = localStorage.getItem(`budget-data-${month}`);
    if (!data) return 0;
    return (JSON.parse(data).expenses || []).reduce((sum: number, e: any) => sum + e.amount, 0);
  });
  const savingsPerMonth = months.map(month => {
    const data = localStorage.getItem(`budget-data-${month}`);
    if (!data) return 0;
    return (JSON.parse(data).savingsList || []).reduce((sum: number, s: any) => sum + s.amount, 0);
  });
  const lineData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Inkomster',
        data: incomePerMonth,
        borderColor: '#34d399',
        backgroundColor: '#34d399',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Utgifter',
        data: expensePerMonth,
        borderColor: '#f87171',
        backgroundColor: '#f87171',
        tension: 0.2,
        fill: false,
      },
      {
        label: 'Sparande',
        data: savingsPerMonth,
        borderColor: '#fbbf24',
        backgroundColor: '#fbbf24',
        tension: 0.2,
        fill: false,
      },
    ],
  };

  // Om ingen data finns, visa info istället för blank sida
  const hasAnyData = incomeSum > 0 || expenseSum > 0 || savingsSum > 0 || Object.values(expenseCategoryMap).some(v => v > 0);

  if (!hasAnyData) {
    return (
      <div className="w-full bg-gray-800 p-6 rounded-lg shadow-xl text-center text-yellow-300">
        Ingen data att visa ännu. Lägg till inkomster, utgifter eller sparande för att se diagram.
      </div>
    );
  }

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
      <div className="mt-10 bg-gray-800 p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">Inkomster, utgifter och sparande över året</h2>
        <Line data={lineData} />
      </div>
    </div>
  );
};

export default DiagramTab;
