import React from 'react';
import TrashIcon from '../assets/icons/TrashIcon';
import type { Translation } from '../translations';

interface IncomesProps {
  incomes: { name: string; amount: number; id: number, description: string}[];
  removeIncome: (id: number) => void;
  t: Translation;
  formatCurrency: (amount: number) => string;
}

const Incomes: React.FC<IncomesProps> = ({
  incomes,
  removeIncome,
  t,
  formatCurrency,
}) => {
  return (
    <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-green-400 mb-4 border-b-2 border-yellow-400 pb-2">{t.incomes}</h2>
      <ul>
        {(incomes || []).map((item) => (
          <li key={item.id} className="flex justify-between items-center p-3 mb-2 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition duration-150">
            <span>{item.description}</span>
            <div className="flex items-center gap-3">
              <span className="font-medium text-green-300">{formatCurrency(item.amount)}</span>
              <button onClick={() => removeIncome(item.id)} className="text-gray-400 hover:text-red-400 transition duration-150">
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Incomes;
