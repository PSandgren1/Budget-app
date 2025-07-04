import React from 'react';
import TrashIcon from '../assets/icons/TrashIcon';
import type { Translation } from '../translations';

interface Expense {
  id: number;
  description: string;
  amount: number;
  category: string;
  paid: boolean;
}

interface ExpensesProps {
  expenses: Expense[];
  removeExpense: (id: number) => void;
  toggleExpensePaid: (id: number) => void;
  t: Translation;
  formatCurrency: (amount: number) => string;
  expenseSearch: string;
  setExpenseSearch: (value: string) => void;
  showOnlyUnpaid: boolean;
  setShowOnlyUnpaid: (value: boolean | ((v: boolean) => boolean)) => void;
  unpaidExpenses: number;
  // Bulk operations props
  bulkMode: boolean;
  setBulkMode: (value: boolean) => void;
  selectedExpenses: Set<number>;
  toggleExpenseSelection: (id: number) => void;
  bulkMarkAsPaid: () => void;
  bulkDelete: () => void;
}

const Expenses: React.FC<ExpensesProps> = ({
  expenses,
  removeExpense,
  toggleExpensePaid,
  t,
  formatCurrency,
  expenseSearch,
  setExpenseSearch,
  showOnlyUnpaid,
  setShowOnlyUnpaid,
  unpaidExpenses,
  bulkMode,
  setBulkMode,
  selectedExpenses,
  toggleExpenseSelection,
  bulkMarkAsPaid,
  bulkDelete
}) => {
  const filteredExpenses = expenses.filter(item =>
    (!showOnlyUnpaid || !item.paid) &&
    (
      item.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(expenseSearch.toLowerCase()))
    )
  );

  return (
    <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-semibold text-red-400 mb-4 border-b-2 border-yellow-400 pb-2">{t.expenses}</h2>
      <div className="mb-2 flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="text"
          placeholder={t.searchExpense}
          value={expenseSearch}
          onChange={e => setExpenseSearch(e.target.value)}
          className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-full max-w-[180px] sm:max-w-[220px]"
        />
        <button
          onClick={() => setShowOnlyUnpaid(v => !v)}
          className={`px-3 py-2 rounded-lg font-semibold border transition text-sm whitespace-nowrap ${showOnlyUnpaid ? 'bg-red-500 text-white border-red-600' : 'bg-gray-700 text-red-300 border-gray-600'}`}
        >
          {showOnlyUnpaid ? t.showAll : t.showOnlyUnpaid}
        </button>
        <button
          onClick={() => setBulkMode(!bulkMode)}
          className={`px-3 py-2 rounded-lg font-semibold border transition text-sm whitespace-nowrap ${bulkMode ? 'bg-yellow-500 text-gray-900 border-yellow-600' : 'bg-gray-700 text-yellow-300 border-gray-600'}`}
        >
          {bulkMode ? 'Avsluta val' : 'Välj flera'}
        </button>
      </div>
      
      {bulkMode && selectedExpenses.size > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/80 rounded-lg flex gap-2 items-center">
          <span className="text-yellow-200">{selectedExpenses.size} valda</span>
          <button
            onClick={bulkMarkAsPaid}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
          >
            Markera som betalda
          </button>
          <button
            onClick={bulkDelete}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Ta bort valda
          </button>
        </div>
      )}
      
      <div className="mb-4 bg-red-900/80 rounded-lg p-3 text-red-200 font-semibold flex items-center gap-2">
        <span>{t.unpaidExpenses}:</span>
        <span className="text-lg">{formatCurrency(unpaidExpenses)}</span>
      </div>
      <ul>
        {filteredExpenses.map((item) => (
          <li key={item.id} className={`flex justify-between items-center p-3 mb-2 rounded-lg shadow-sm transition duration-150 ${item.paid ? 'bg-green-700/80 hover:bg-green-600/80' : 'bg-gray-700 hover:bg-gray-600'} ${bulkMode && selectedExpenses.has(item.id) ? 'ring-2 ring-yellow-400' : ''}`}>
            <div className="flex items-center gap-2">
              {bulkMode && (
                <input
                  type="checkbox"
                  checked={selectedExpenses.has(item.id)}
                  onChange={() => toggleExpenseSelection(item.id)}
                  className="accent-yellow-500 w-5 h-5"
                />
              )}
              <input 
                type="checkbox" 
                checked={!!item.paid} 
                onChange={() => toggleExpensePaid(item.id)} 
                className="accent-green-500 w-5 h-5" 
                title="Markera som betald" 
              />
              <span className={item.paid ? 'line-through text-green-200' : ''}>{item.description} <span className="text-xs text-yellow-300">({item.category})</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`font-medium ${item.paid ? 'text-green-200' : 'text-red-300'}`}>{formatCurrency(item.amount)}</span>
              <button onClick={() => removeExpense(item.id)} className="text-gray-400 hover:text-red-400 transition duration-150">
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default Expenses;
