import React from 'react';
import TrashIcon from '../assets/icons/TrashIcon';
import type { Translation } from '../translations';

interface Saving {
  id: number;
  description: string;
  amount: number;
}

interface SavingsProps {
  savings: Saving[];
  removeSaving: (id: number) => void;
  t: Translation;
  formatCurrency: (amount: number) => string;
  totalSaved: number;
}

const Savings: React.FC<SavingsProps> = ({
  savings,
  removeSaving,
  t,
  formatCurrency,
  totalSaved,
}) => {
  return (
    <section className="p-3 sm:p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-xl sm:text-2xl font-semibold text-blue-400 mb-3 sm:mb-4 border-b-2 border-yellow-400 pb-2">
        {t.savingsList}
      </h2>
      <ul className="space-y-2">
        {(savings || []).map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center p-3 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 active:bg-gray-600 transition duration-150 touch-manipulation"
          >
            <span className="text-sm sm:text-base truncate pr-2">{item.description}</span>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <span className="font-medium text-blue-300 text-sm sm:text-base">
                {formatCurrency(item.amount)}
              </span>
              <button
                onClick={() => removeSaving(item.id)}
                className="text-gray-400 hover:text-red-400 active:text-red-500 transition duration-150 p-1 touch-manipulation"
                title="Ta bort sparande"
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {savings.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p className="text-sm sm:text-base">Inga sparanden registrerade</p>
        </div>
      )}
      <div className="mt-4 text-center sm:text-right text-base sm:text-lg font-semibold text-blue-200 bg-blue-900/30 p-3 rounded-lg">
        {t.totalSaved}: {formatCurrency(totalSaved)}
      </div>
    </section>
  );
};

export default Savings;
