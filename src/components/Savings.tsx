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
    <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-blue-400 mb-4 border-b-2 border-yellow-400 pb-2">
        {t.savingsList}
      </h2>
      <ul>
        {(savings || []).map((item) => (
          <li
            key={item.id}
            className="flex justify-between items-center p-3 mb-2 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition duration-150"
          >
            <span>{item.description}</span>
            <div className="flex items-center gap-3">
              <span className="font-medium text-blue-300">
                {formatCurrency(item.amount)}
              </span>
              <button
                onClick={() => removeSaving(item.id)}
                className="text-gray-400 hover:text-red-400 transition duration-150"
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-right text-lg font-semibold text-blue-200">
        {t.totalSaved}: {formatCurrency(totalSaved)}
      </div>
    </section>
  );
};

export default Savings;
