
import React, { useEffect } from 'react';
import PlusIcon from '../assets/icons/PlusIcon';
import type { Translation } from '../translations';

interface AddEntryFormProps {
  description: string;
  setDescription: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  isRecurring: boolean;
  setIsRecurring: (value: boolean) => void;
  addIncome: () => void;
  addExpense: () => void;
  addSaving: () => void;
  t: Translation;
  categories: string[];
}

const AddEntryForm: React.FC<AddEntryFormProps> = ({
  description,
  setDescription,
  amount,
  setAmount,
  category,
  setCategory,
  isRecurring,
  setIsRecurring,
  addIncome,
  addExpense,
  addSaving,
  t,
  categories,
}) => {
  // Keyboard shortcuts for form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts if we're focused in the form area
      const target = e.target as HTMLElement;
      if (!target.closest('section')) return;

      if (e.key === 'Enter' && (description.trim() && amount.trim())) {
        e.preventDefault();
        if (e.ctrlKey) {
          addIncome(); // Ctrl+Enter for income
        } else if (e.shiftKey) {
          addSaving(); // Shift+Enter for saving
        } else {
          addExpense(); // Enter for expense (most common)
        }
      }
      
      if (e.key === 'Escape') {
        setDescription('');
        setAmount('');
        setIsRecurring(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [description, amount, addIncome, addExpense, addSaving, setDescription, setAmount, setIsRecurring]);

  return (
    <section className="mb-6 sm:mb-10 p-3 sm:p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-yellow-400 mb-3 sm:mb-4">{t.addEntry}</h2>
      
      {/* Help text - hide on mobile */}
      <div className="hidden sm:block mb-2 text-sm text-gray-400">
        <span>Kortkommandon: </span>
        <span className="text-yellow-300">Enter</span> = Utgift, 
        <span className="text-green-300"> Ctrl+Enter</span> = Inkomst, 
        <span className="text-blue-300"> Shift+Enter</span> = Sparande, 
        <span className="text-red-300"> Escape</span> = Rensa
      </div>
      
      {/* Input fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <input 
          type="text" 
          placeholder={t.description} 
          value={description} 
          onChange={e => setDescription(e.target.value)} 
          className="col-span-1 sm:col-span-2 lg:col-span-1 p-3 text-base bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" 
        />
        <input 
          type="number" 
          placeholder={`${t.amount} (SEK)`} 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
          className="p-3 text-base bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" 
        />
        <select 
          value={category} 
          onChange={e => setCategory(e.target.value)} 
          className="p-3 text-base bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
        >
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      
      {/* Recurring checkbox */}
      <div className="mb-4">
        <div className="flex items-center gap-2 p-3 bg-gray-700/50 rounded-lg">
          <input 
            id="recurring-checkbox" 
            type="checkbox" 
            checked={isRecurring} 
            onChange={e => setIsRecurring(e.target.checked)} 
            className="w-5 h-5 accent-yellow-400" 
          />
          <label htmlFor="recurring-checkbox" className="font-semibold text-yellow-400 cursor-pointer text-sm sm:text-base">
            {t.recurringExpenses}
          </label>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button 
          onClick={addIncome} 
          className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          <PlusIcon className="w-5 h-5" /> 
          <span className="text-sm sm:text-base">{t.addIncome}</span>
        </button>
        <button 
          onClick={addExpense} 
          className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          <PlusIcon className="w-5 h-5" /> 
          <span className="text-sm sm:text-base">{t.addExpense}</span>
        </button>
        <button 
          onClick={addSaving} 
          className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 active:scale-95 touch-manipulation"
        >
          <PlusIcon className="w-5 h-5" /> 
          <span className="text-sm sm:text-base">{t.addSaving}</span>
        </button>
      </div>
    </section>
  );
};

export default AddEntryForm;
