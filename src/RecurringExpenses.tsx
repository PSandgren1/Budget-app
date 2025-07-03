import React from 'react';
import PlusIcon from './assets/icons/PlusIcon.tsx';
import TrashIcon from './assets/icons/TrashIcon.tsx';

interface RecurringExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
}

interface Props {
  recurringExpenses: RecurringExpense[];
  removeRecurringExpense: (id: number) => void;
  addRecurringExpensesToMonth: () => void;
  formatCurrency: (amount: number) => string;
  t: any;
}

const RecurringExpenses: React.FC<Props> = ({
  recurringExpenses,
  removeRecurringExpense,
  addRecurringExpensesToMonth,
  formatCurrency,
  t
}) => {
  return (
    <section className="mt-10 p-4 sm:p-6 bg-gray-800 rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-3 border-b-2 border-yellow-400 pb-2">
        <h2 className="text-xl sm:text-2xl font-semibold text-yellow-400">{t.existingRecurringExpenses}</h2>
        <button onClick={addRecurringExpensesToMonth} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105">
          <PlusIcon className="w-5 h-5" /> {t.addToMonth}
        </button>
      </div>
      <ul>
        {recurringExpenses.length > 0 ? (
          recurringExpenses.map((item: RecurringExpense) => (
            <li key={item.id} className="flex justify-between items-center p-3 mb-2 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition duration-150">
              <div>
                <span className="font-medium">{item.description}</span>
                <span className="text-sm text-yellow-300 ml-2">({item.category})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-yellow-400">{formatCurrency(item.amount)}</span>
                <button onClick={() => removeRecurringExpense(item.id)} className="text-gray-400 hover:text-red-400 transition duration-150">
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))
        ) : (
          <p className="text-gray-400 italic">{t.noRecurringExpenses}</p>
        )}
      </ul>
    </section>
  );
};

export default RecurringExpenses;
