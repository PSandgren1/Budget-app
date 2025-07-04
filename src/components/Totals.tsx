
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
    <header className="mb-6 sm:mb-10 p-3 sm:p-6 bg-gray-800 rounded-lg shadow-xl">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400 mb-4 sm:mb-6 text-center">Månadsbudget</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-center">
        <div className="bg-gray-700 p-2 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-sm sm:text-base lg:text-lg text-green-400 mb-1">{t.totalIncomes}</h2>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-green-300">{formatCurrency(totalIncomes)}</p>
        </div>
        <div className="bg-gray-700 p-2 sm:p-4 rounded-lg shadow-md">
          <h2 className="text-sm sm:text-base lg:text-lg text-red-400 mb-1">{t.totalExpenses}</h2>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-red-300">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className={`bg-gray-700 p-2 sm:p-4 rounded-lg shadow-md border-2 ${savings < 0 ? 'border-red-500' : 'border-yellow-400'}`}>
          <h2 className="text-sm sm:text-base lg:text-lg text-yellow-400 mb-1">{t.toSave}</h2>
          <p className={`text-lg sm:text-xl lg:text-2xl font-semibold ${savings < 0 ? 'text-red-500' : 'text-yellow-400'}`}>
            {formatCurrency(savings)}
          </p>
          <div className="text-xs text-gray-300 mt-1 sm:mt-2">
            {savings > 0
              ? `${t.leftToSave}: ${formatCurrency(Math.max(0, savings - totalSaved))}`
              : `${t.leftToSave}: ${formatCurrency(0)}`}
          </div>
        </div>
        <div className="bg-gray-700 p-2 sm:p-4 rounded-lg shadow-md flex flex-col items-center">
          <h2 className="text-sm sm:text-base lg:text-lg text-blue-400 mb-1">{t.totalSaved}</h2>
          <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-blue-300">{formatCurrency(totalSaved)}</p>
          <div className="mt-1 sm:mt-2 w-full bg-gray-600 rounded h-2 sm:h-3">
            <div 
              className="bg-yellow-400 h-2 sm:h-3 rounded transition-all duration-300" 
              style={{ width: `${savings > 0 ? Math.min(100, (totalSaved / savings) * 100) : 0}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-300 mt-1">
            {savings > 0 ? Math.round((totalSaved / savings) * 100) : 0}% {t.percentOfPossible}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Totals;
