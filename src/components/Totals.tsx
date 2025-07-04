
import React from 'react';
import type { Translation } from '../translations';

interface TotalsProps {
  t: Translation;
  formatCurrency: (amount: number) => string;
  totalIncomes: number;
  totalExpenses: number;
  savings: number;
  totalSaved: number;
}

const Totals: React.FC<TotalsProps> = ({
  t,
  formatCurrency,
  totalIncomes,
  totalExpenses,
  savings,
  totalSaved,
}) => {
  return (
    <header className="mb-10 p-4 sm:p-6 bg-gray-800 rounded-lg shadow-xl">
      <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-4 sm:mb-6 text-center">Månadsbudget</h1>
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
        <div className="bg-gray-700 p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-base sm:text-lg text-green-400">{t.totalIncomes}</h2>
          <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="bg-gray-700 p-3 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-base sm:text-lg text-red-400">{t.totalExpenses}</h2>
          <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className={`bg-gray-700 p-3 sm:p-4 rounded-lg shadow-md ${savings < 0 ? 'border border-red-500' : 'border border-yellow-400'}`}>
          <h2 className="text-base sm:text-lg text-yellow-400">{t.toSave}</h2>
          <p className={`text-xl sm:text-2xl font-semibold ${savings < 0 ? 'text-red-500' : 'text-yellow-400'}`}>{formatCurrency(savings)}</p>
          <div className="text-xs text-gray-300 mt-1 sm:mt-2">
            {savings > 0
              ? `${t.leftToSave}: ${formatCurrency(Math.max(0, savings - totalSaved))}`
              : `${t.leftToSave}: ${formatCurrency(0)}`}
          </div>
        </div>
        <div className="bg-gray-700 p-3 sm:p-4 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-base sm:text-lg text-blue-400">{t.totalSaved}</h2>
          <p className="text-xl sm:text-2xl font-semibold">{formatCurrency(totalSaved)}</p>
          <div className="mt-1 sm:mt-2 w-full bg-gray-600 rounded h-3">
            <div className="bg-yellow-400 h-3 rounded" style={{ width: `${savings > 0 ? Math.min(100, (totalSaved / savings) * 100) : 0}%` }}></div>
          </div>
          <div className="text-xs text-gray-300 mt-1">{savings > 0 ? Math.round((totalSaved / savings) * 100) : 0}% {t.percentOfPossible}</div>
        </div>
      </div>
    </header>
  );
};

export default Totals;
