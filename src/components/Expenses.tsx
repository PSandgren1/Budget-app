import React, { useState } from 'react';
import TrashIcon from '../assets/icons/TrashIcon';
import type { Translation } from '../translations';
import { useSwipeGestures } from '../hooks/useSwipeGestures';
import { useTheme } from '../hooks/useTheme';

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

const ExpenseItem: React.FC<{
  item: Expense;
  formatCurrency: (amount: number) => string;
  removeExpense: (id: number) => void;
  toggleExpensePaid: (id: number) => void;
  bulkMode: boolean;
  isSelected: boolean;
  toggleSelection: (id: number) => void;
}> = ({ item, formatCurrency, removeExpense, toggleExpensePaid, bulkMode, isSelected, toggleSelection }) => {
  const [showActions, setShowActions] = useState(false);

  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => setShowActions(true),
    onSwipeRight: () => setShowActions(false),
    onTap: () => {
      if (showActions) {
        setShowActions(false);
      } else if (!bulkMode) {
        toggleExpensePaid(item.id);
      }
    }
  });

  return (
    <li 
      ref={swipeRef}
      className={`relative flex justify-between items-center p-3 mb-2 rounded-lg shadow-sm transition-all duration-150 touch-manipulation ${
        item.paid ? 'bg-green-700/80 hover:bg-green-600/80' : 'bg-gray-700 hover:bg-gray-600'
      } ${bulkMode && isSelected ? 'ring-2 ring-yellow-400' : ''} ${showActions ? 'pr-20 sm:pr-24' : ''}`}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {bulkMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(item.id)}
            className="accent-yellow-500 w-5 h-5 flex-shrink-0 touch-manipulation"
          />
        )}
        <input 
          type="checkbox" 
          checked={!!item.paid} 
          onChange={() => toggleExpensePaid(item.id)} 
          className="accent-green-500 w-5 h-5 flex-shrink-0 touch-manipulation" 
          title="Markera som betald" 
        />
        <div className="min-w-0 flex-1">
          <span className={`${item.paid ? 'line-through text-green-200' : 'text-white'} block truncate text-sm sm:text-base`}>
            {item.description}
          </span>
          <span className="text-xs text-yellow-300 block truncate">({item.category})</span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <span className={`font-medium text-sm sm:text-base ${item.paid ? 'text-green-200' : 'text-red-300'}`}>
          {formatCurrency(item.amount)}
        </span>
        {!showActions && (
          <button 
            onClick={() => removeExpense(item.id)} 
            className="text-gray-400 hover:text-red-400 transition duration-150 p-1 touch-manipulation"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Touch action overlay */}
      {showActions && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center bg-red-600 rounded-r-lg px-3 gap-2 min-w-[80px] sm:min-w-[96px]">
          <button
            onClick={() => {
              toggleExpensePaid(item.id);
              setShowActions(false);
            }}
            className="text-white text-lg font-bold p-1 hover:bg-red-700 rounded touch-manipulation"
            title={item.paid ? 'Markera som obetald' : 'Markera som betald'}
          >
            {item.paid ? '↶' : '✓'}
          </button>
          <button
            onClick={() => {
              removeExpense(item.id);
              setShowActions(false);
            }}
            className="text-white text-lg font-bold p-1 hover:bg-red-700 rounded touch-manipulation"
            title="Ta bort"
          >
            🗑
          </button>
        </div>
      )}
    </li>
  );
};

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
  const { getThemeClasses } = useTheme();
  const theme = getThemeClasses();
  
  const filteredExpenses = expenses.filter(item =>
    (!showOnlyUnpaid || !item.paid) &&
    (
      item.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(expenseSearch.toLowerCase()))
    )
  );

  return (
    <section className={`${theme.spacing.padding} ${theme.bg.secondary} rounded-lg shadow-xl`}>
      <h2 className={`text-xl sm:text-2xl font-semibold ${theme.status.error} ${theme.spacing.margin} border-b-2 accent-primary-border pb-2`}>{t.expenses}</h2>
      
      {/* Search and filters */}
      <div className="mb-3 sm:mb-4 space-y-2">
        <input
          type="text"
          placeholder={t.searchExpense}
          value={expenseSearch}
          onChange={e => setExpenseSearch(e.target.value)}
          className={`w-full p-2 sm:p-3 text-base ${theme.bg.tertiary} border ${theme.border.primary} rounded-lg ${theme.text.primary} focus:ring-2 accent-primary-text focus:border-transparent outline-none`}
        />
        <div className="flex gap-2">
          <button
            onClick={() => setShowOnlyUnpaid(v => !v)}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-3 rounded-lg font-semibold border transition text-sm whitespace-nowrap touch-manipulation ${
              showOnlyUnpaid 
                ? `${theme.status.errorBg} ${theme.text.primary} border-red-600` 
                : `${theme.bg.tertiary} ${theme.status.error} ${theme.border.primary}`
            }`}
          >
            {showOnlyUnpaid ? t.showAll : t.showOnlyUnpaid}
          </button>
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`flex-1 sm:flex-none px-3 py-2 sm:py-3 rounded-lg font-semibold border transition text-sm whitespace-nowrap touch-manipulation ${
              bulkMode 
                ? 'accent-primary-bg text-gray-900 accent-primary-border' 
                : `${theme.bg.tertiary} accent-primary-text ${theme.border.primary}`
            }`}
          >
            {bulkMode ? 'Avsluta val' : 'Välj flera'}
          </button>
        </div>
      </div>
      
      {/* Bulk actions */}
      {bulkMode && selectedExpenses.size > 0 && (
        <div className="mb-4 p-3 bg-yellow-900/80 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <span className="text-yellow-200 text-sm font-medium">
              {selectedExpenses.size} valda
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={bulkMarkAsPaid}
                className="flex-1 sm:flex-none px-3 py-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded text-sm font-medium touch-manipulation"
              >
                Markera som betalda
              </button>
              <button
                onClick={bulkDelete}
                className="flex-1 sm:flex-none px-3 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded text-sm font-medium touch-manipulation"
              >
                Ta bort valda
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Unpaid total */}
      <div className="mb-4 bg-red-900/80 rounded-lg p-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
          <span className="text-red-200 font-semibold text-sm sm:text-base">{t.unpaidExpenses}:</span>
          <span className="text-lg sm:text-xl font-bold text-red-300">{formatCurrency(unpaidExpenses)}</span>
        </div>
      </div>
      
      {/* Expenses list */}
      <ul className="space-y-2">
        {filteredExpenses.map((item) => (
          <ExpenseItem
            key={item.id}
            item={item}
            formatCurrency={formatCurrency}
            removeExpense={removeExpense}
            toggleExpensePaid={toggleExpensePaid}
            bulkMode={bulkMode}
            isSelected={selectedExpenses.has(item.id)}
            toggleSelection={toggleExpenseSelection}
          />
        ))}
      </ul>
      
      {filteredExpenses.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <p>Inga utgifter att visa</p>
        </div>
      )}
    </section>
  );
};

export default Expenses;
