import React, { useState, useMemo, useEffect, useRef } from 'react';
import DiagramTab from './DiagramTab';
import YearOverviewTab from './YearOverviewTab';
import translations, { type Translation } from './translations';
import Incomes from './components/Incomes';
import Expenses from './components/Expenses';
import Savings from './components/Savings';
import Totals from './components/Totals';
import AddEntryForm from './components/AddEntryForm';
import RecurringExpenses from './RecurringExpenses';
import { useMonthSwipe } from './hooks/useMonthSwipe';

const SUPPORTED_CURRENCIES = [
  { code: 'SEK', label: 'SEK (kr)' },
  { code: 'EUR', label: 'EUR (€)' },
  { code: 'USD', label: 'USD ($)' },
  { code: 'NOK', label: 'NOK (kr)' },
  { code: 'DKK', label: 'DKK (kr)' },
];

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Hook to get the previous value of a prop or state
function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const App: React.FC = () => {
  // Tabbar och månadsväljare
  const [activeTab, setActiveTab] = useState<'budget' | 'diagram' | 'year'>('budget');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Budgetdata per månad
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [savingsList, setSavingsList] = useState<any[]>([]);

  // Formfält
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [maxSavings, setMaxSavings] = useState(10000);
  const [currency, setCurrency] = useState(() => localStorage.getItem('budget-currency') || 'SEK');

  // State for recurring expenses
  const [recurringExpenses, setRecurringExpenses] = useState<any[]>(() => {
    const saved = localStorage.getItem('budget-recurring-expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // Undo functionality
  const [undoStack, setUndoStack] = useState<Array<{
    action: string;
    data: any;
    timestamp: number;
  }>>([]);

  // Bulk operations
  const [selectedExpenses, setSelectedExpenses] = useState<Set<number>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);

  const prevSelectedMonth = usePrevious(selectedMonth);

  // Add to undo stack
  const addToUndoStack = (action: string, data: any) => {
    setUndoStack(prev => [...prev.slice(-9), { action, data, timestamp: Date.now() }]);
  };

  // Undo last action
  const undoLastAction = () => {
    if (undoStack.length === 0) return;
    
    const lastAction = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    
    switch (lastAction.action) {
      case 'ADD_INCOME':
        setIncomes(prev => prev.filter(item => item.id !== lastAction.data.id));
        break;
      case 'ADD_EXPENSE':
        setExpenses(prev => prev.filter(item => item.id !== lastAction.data.id));
        break;
      case 'ADD_SAVING':
        setSavingsList(prev => prev.filter(item => item.id !== lastAction.data.id));
        break;
      case 'REMOVE_INCOME':
        setIncomes(prev => [...prev, lastAction.data]);
        break;
      case 'REMOVE_EXPENSE':
        setExpenses(prev => [...prev, lastAction.data]);
        break;
      case 'REMOVE_SAVING':
        setSavingsList(prev => [...prev, lastAction.data]);
        break;
      case 'TOGGLE_EXPENSE_PAID':
        setExpenses(prev => prev.map(item =>
          item.id === lastAction.data.id ? { ...item, paid: lastAction.data.oldPaidStatus } : item
        ));
        break;
      case 'BULK_MARK_PAID':
        setExpenses(prev => prev.map(item => {
          const originalExpense = lastAction.data.expenses.find((exp: any) => exp.id === item.id);
          return originalExpense ? { ...item, paid: originalExpense.paid } : item;
        }));
        break;
      case 'BULK_DELETE':
        setExpenses(prev => [...prev, ...lastAction.data.expenses]);
        break;
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo with Ctrl+Z
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undoLastAction();
      }
      // Escape to cancel bulk mode
      if (e.key === 'Escape') {
        setBulkMode(false);
        setSelectedExpenses(new Set());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoStack]);

  // Kombinerad logik för att spara föregående månad och ladda aktuell månad
  useEffect(() => {
    // Spara bara om det finns en föregående månad och den har ändrats
    if (prevSelectedMonth && prevSelectedMonth !== selectedMonth) {
      const dataToSave = {
        incomes,
        expenses,
        savingsList,
        maxSavings,
        currency,
      };
      console.log(`Saving data for ${prevSelectedMonth}`, dataToSave);
      localStorage.setItem(`budget-data-${prevSelectedMonth}`, JSON.stringify(dataToSave));
    }

    // Ladda sedan data för den valda månaden
    console.log(`Loading data for ${selectedMonth}`);
    const savedData = localStorage.getItem(`budget-data-${selectedMonth}`);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      setIncomes(parsedData.incomes || []);
      setExpenses(parsedData.expenses || []);
      setSavingsList(parsedData.savingsList || []);
      setMaxSavings(parsedData.maxSavings || 10000);
      if (parsedData.currency) {
        setCurrency(parsedData.currency);
      }
    } else {
      // Om ingen data finns, återställ till ett tomt state
      setIncomes([]);
      setExpenses([]);
      setSavingsList([]);
      setMaxSavings(10000);
    }
    // Denna effekt ska ENDAST köras när selectedMonth ändras.
    // Vi hanterar state-uppdateringar för data i en separat effekt.
  }, [selectedMonth]);

  // Spara data till localStorage när datan ändras
  useEffect(() => {
    // Undvik att spara en tom state direkt efter en månadsbyte,
    // låt laddningseffekten hantera det initiala statet.
    if (prevSelectedMonth === selectedMonth || !prevSelectedMonth) {
      const dataToSave = { incomes, expenses, savingsList, maxSavings, currency };
      console.log(`Saving data for current month ${selectedMonth} due to data change`);
      localStorage.setItem(`budget-data-${selectedMonth}`, JSON.stringify(dataToSave));
    }
  }, [incomes, expenses, savingsList, maxSavings, currency]);

  useEffect(() => {
    localStorage.setItem('budget-currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('budget-recurring-expenses', JSON.stringify(recurringExpenses));
  }, [recurringExpenses]);

  // Summeringar
  const totalIncomes = useMemo(() => incomes.reduce((sum, item) => sum + item.amount, 0), [incomes]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const unpaidExpenses = useMemo(() => expenses.filter(item => !item.paid).reduce((sum, item) => sum + item.amount, 0), [expenses]);
  const savings = useMemo(() => totalIncomes - totalExpenses, [totalIncomes, totalExpenses]);
  const totalSaved = useMemo(() => savingsList.reduce((sum, item) => sum + item.amount, 0), [savingsList]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency }).format(amount);
  };

  // Lägg till inkomst
  const addIncome = () => {
    if (!description || !amount) return;
    setIncomes(prev => [...prev, { id: Date.now(), description, amount: parseFloat(amount) }]);
    addToUndoStack('ADD_INCOME', { id: Date.now(), description, amount: parseFloat(amount) });
    setDescription('');
    setAmount('');
  };

  // Lägg till utgift
  const addExpense = () => {
    if (!description || !amount) return;
    const newExpense = { id: Date.now(), description, amount: parseFloat(amount), category, paid: false };

    setExpenses(prev => [...prev, newExpense]);
    addToUndoStack('ADD_EXPENSE', newExpense);

    if (isRecurring) {
      const exists = recurringExpenses.some((exp: any) => 
        exp.description === description && 
        exp.amount === parseFloat(amount) && 
        exp.category === category
      );
      if (!exists) {
        setRecurringExpenses((prev: any) => [
          ...prev,
          { id: Date.now() + Math.random(), description, amount: parseFloat(amount), category }
        ]);
      }
    }

    setDescription('');
    setAmount('');
    setIsRecurring(false);
  };

  // Markera utgift som betald/obetalad
  const toggleExpensePaid = (id: number) => {
    const expense = expenses.find(item => item.id === id);
    if (expense) {
      addToUndoStack('TOGGLE_EXPENSE_PAID', { id, oldPaidStatus: expense.paid });
      setExpenses(prev => prev.map(item =>
        item.id === id ? { ...item, paid: !item.paid } : item
      ));
    }
  };

  // Lägg till sparande
  const addSaving = () => {
    if (!description || !amount) return;
    const val = parseFloat(amount);
    // Begränsa mot möjligt sparande (savings)
    if (savings <= 0) {
      alert('Det finns inget möjligt sparande denna månad.');
      return;
    }
    if (totalSaved + val > savings) {
      alert('Du kan inte spara mer än det möjliga sparbeloppet!');
      return;
    }
    setSavingsList(prev => [...prev, { id: Date.now(), description, amount: val }]);
    addToUndoStack('ADD_SAVING', { id: Date.now(), description, amount: val });
    setDescription('');
    setAmount('');
  };

  // Ta bort post med bekräftelse
  const removeIncome = (id: number) => {
    const income = incomes.find(item => item.id === id);
    if (income && window.confirm(`Är du säker på att du vill ta bort inkomsten "${income.description}"?`)) {
      addToUndoStack('REMOVE_INCOME', income);
      setIncomes(prev => prev.filter(item => item.id !== id));
    }
  };
  const removeExpense = (id: number) => {
    const expense = expenses.find(item => item.id === id);
    if (expense && window.confirm(`Är du säker på att du vill ta bort utgiften "${expense.description}"?`)) {
      addToUndoStack('REMOVE_EXPENSE', expense);
      setExpenses(prev => prev.filter(item => item.id !== id));
    }
  };
  const removeSaving = (id: number) => {
    const saving = savingsList.find(item => item.id === id);
    if (saving && window.confirm(`Är du säker på att du vill ta bort sparandet "${saving.description}"?`)) {
      addToUndoStack('REMOVE_SAVING', saving);
      setSavingsList(prev => prev.filter(item => item.id !== id));
    }
  };

  // ---- Recurring Expenses Logic ----
  const removeRecurringExpense = (id: number) => {
    if (window.confirm(t.confirmDeleteRecurring)) {
      setRecurringExpenses((prev: any) => prev.filter((item: any) => item.id !== id));
    }
  };

  const addRecurringExpensesToMonth = () => {
    const newExpensesToAdd = recurringExpenses.filter(rec =>
      !expenses.some(exp => exp.description === rec.description && exp.amount === rec.amount && exp.category === rec.category)
    );

    if (newExpensesToAdd.length === 0) {
      alert("Alla återkommande utgifter finns redan i denna månad.");
      return;
    }

    const expensesWithIds = newExpensesToAdd.map((exp: any) => ({
      ...exp,
      id: Date.now() + Math.random(),
      paid: false,
    }));

    setExpenses(prev => [...prev, ...expensesWithIds]);
  };
  // --------------------------------

  // Exportera all data till CSV
  const exportAllDataCSV = () => {
    const rows = [
      ['År', 'Månad', 'Typ', 'Beskrivning', 'Belopp', 'Kategori', 'Betald']
    ];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('budget-data-')) {
        try {
          const monthData = JSON.parse(localStorage.getItem(key)!);
          const [year, month] = key.replace('budget-data-', '').split('-');

          monthData.incomes?.forEach((item: any) => {
            rows.push([year, month, t.income, item.description, item.amount.toString(), '', '']);
          });
          monthData.expenses?.forEach((item: any) => {
            rows.push([year, month, t.expense, item.description, item.amount.toString(), item.category, item.paid ? t.yes : t.no]);
          });
          monthData.savingsList?.forEach((item: any) => {
            rows.push([year, month, t.saving, item.description, item.amount.toString(), '', '']);
          });
        } catch (error) {
          console.error(`Could not parse data for key: ${key}`, error);
          // Gå vidare till nästa nyckel om en är korrupt
        }
      }
    }

    // Sortera rader baserat på år och månad
    rows.sort((a, b) => {
      if (a[0] === 'År') return -1; // Håll rubriken överst
      if (b[0] === 'År') return 1;
      const dateA = `${a[0]}-${a[1]}`;
      const dateB = `${b[0]}-${b[1]}`;
      return dateA.localeCompare(dateB);
    });

    const csv = rows.map(r => r.join(';')).join('\n');
    // Lägg till BOM (Byte Order Mark) för att säkerställa att Excel hanterar UTF-8 korrekt
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().slice(0, 10);
    a.download = `budget-export-all-${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importera från CSV
  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').slice(1); // hoppa över header
      
      // Gruppera data per månad
      const monthlyData: { [key: string]: { incomes: any[], expenses: any[], savings: any[] } } = {};
      
      lines.forEach(line => {
        const [year, month, typ, desc, belopp, kat, betald] = line.split(';');
        if (!year || !month || !typ || !desc || !belopp) return; // Hoppa över tomma rader
        
        const monthKey = `${year}-${month}`;
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { incomes: [], expenses: [], savings: [] };
        }
        
        const amount = parseFloat(belopp);
        if (isNaN(amount)) return;
        
        if (typ === t.income || typ === 'Inkomst' || typ === 'Income') {
          monthlyData[monthKey].incomes.push({ 
            id: Date.now() + Math.random(), 
            description: desc, 
            amount 
          });
        } else if (typ === t.expense || typ === 'Utgift' || typ === 'Expense') {
          monthlyData[monthKey].expenses.push({ 
            id: Date.now() + Math.random(), 
            description: desc, 
            amount, 
            category: kat || t.categories[0],
            paid: betald === t.yes || betald === 'Ja' || betald === 'Yes'
          });
        } else if (typ === t.saving || typ === 'Sparande' || typ === 'Saving') {
          monthlyData[monthKey].savings.push({ 
            id: Date.now() + Math.random(), 
            description: desc,
            amount 
          });
        }
      });
      
      // Spara data för varje månad (skriver över befintlig data)
      Object.entries(monthlyData).forEach(([monthKey, data]) => {
        const newData = {
          incomes: data.incomes,
          expenses: data.expenses,
          savingsList: data.savings,
          maxSavings: 10000,
          currency: currency
        };
        
        localStorage.setItem(`budget-data-${monthKey}`, JSON.stringify(newData));
      });
      
      // Uppdatera aktuell vy om data importerades för den valda månaden
      if (monthlyData[selectedMonth]) {
        const currentData = localStorage.getItem(`budget-data-${selectedMonth}`);
        if (currentData) {
          const parsedData = JSON.parse(currentData);
          setIncomes(parsedData.incomes || []);
          setExpenses(parsedData.expenses || []);
          setSavingsList(parsedData.savingsList || []);
          setMaxSavings(parsedData.maxSavings || 10000);
          if (parsedData.currency) {
            setCurrency(parsedData.currency);
          }
        }
      }
      
      alert(`Data importerad! ${Object.keys(monthlyData).length} månader uppdaterades.`);
    };
    reader.readAsText(file);
  };

  // Sök och filter för utgifter
  const [expenseSearch, setExpenseSearch] = useState('');
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);

  const [language, setLanguage] = useState(() => localStorage.getItem('budget-lang') || 'sv');
  const t = translations[language as 'sv' | 'en'] as Translation;

  useEffect(() => {
    localStorage.setItem('budget-lang', language);
  }, [language]);

  const EXPENSE_CATEGORIES = t.categories;
  useEffect(() => {
    setCategory(EXPENSE_CATEGORIES[0]);
  }, [language]);

  // Month navigation functions
  const goToNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const nextDate = new Date(year, month, 1); // month is 0-indexed in Date
    const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(nextMonth);
  };

  const goToPreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1); // month-2 because month is 1-indexed but Date expects 0-indexed
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(prevMonth);
  };

  // Month swipe gesture
  const monthSwipeRef = useMonthSwipe({
    onSwipeLeft: goToNextMonth,
    onSwipeRight: goToPreviousMonth,
  });

  // Bulk operations
  const toggleExpenseSelection = (id: number) => {
    setSelectedExpenses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const bulkMarkAsPaid = () => {
    if (selectedExpenses.size === 0) return;
    
    const expensesToUpdate = expenses.filter(exp => selectedExpenses.has(exp.id));
    addToUndoStack('BULK_MARK_PAID', { expenses: expensesToUpdate });
    
    setExpenses(prev => prev.map(item =>
      selectedExpenses.has(item.id) ? { ...item, paid: true } : item
    ));
    setSelectedExpenses(new Set());
  };

  const bulkDelete = () => {
    if (selectedExpenses.size === 0) return;
    
    const expensesToDelete = expenses.filter(exp => selectedExpenses.has(exp.id));
    if (window.confirm(`Är du säker på att du vill ta bort ${selectedExpenses.size} utgifter?`)) {
      addToUndoStack('BULK_DELETE', { expenses: expensesToDelete });
      setExpenses(prev => prev.filter(item => !selectedExpenses.has(item.id)));
      setSelectedExpenses(new Set());
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div ref={monthSwipeRef} className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
        {/* Språkväxlare */}
        <div className="flex justify-end mb-2 gap-2">
          <select 
            id="lang" 
            value={language} 
            onChange={e => setLanguage(e.target.value)}
            className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none text-sm font-semibold min-w-[90px] touch-manipulation"
          >
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </div>
        
        {/* Tabbar */}
        <div className="flex gap-2 sm:gap-4 mb-4 sm:mb-8 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('budget')} 
            className={`px-3 sm:px-4 py-2 rounded-t-lg font-semibold whitespace-nowrap touch-manipulation transition-colors ${
              activeTab === 'budget' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'
            }`}
          >
            {t.budget}
          </button>
          <button 
            onClick={() => setActiveTab('diagram')} 
            className={`px-3 sm:px-4 py-2 rounded-t-lg font-semibold whitespace-nowrap touch-manipulation transition-colors ${
              activeTab === 'diagram' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'
            }`}
          >
            {t.diagram}
          </button>
          <button 
            onClick={() => setActiveTab('year')} 
            className={`px-3 sm:px-4 py-2 rounded-t-lg font-semibold whitespace-nowrap touch-manipulation transition-colors ${
              activeTab === 'year' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'
            }`}
          >
            {t.year}
          </button>
        </div>
        
        {/* Månadsväljare och kontroller */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="flex gap-2 flex-1">
            <div className="flex items-center gap-1 flex-1 sm:flex-none">
              <button 
                onClick={goToPreviousMonth}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded px-2 py-2 h-12 touch-manipulation transition-colors"
                title="Föregående månad"
              >
                ◀
              </button>
              <input 
                type="month" 
                id="month" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value)} 
                className="flex-1 sm:flex-none bg-gray-700 text-white rounded px-3 py-2 h-12 text-base border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none touch-manipulation" 
              />
              <button 
                onClick={goToNextMonth}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded px-2 py-2 h-12 touch-manipulation transition-colors"
                title="Nästa månad"
              >
                ▶
              </button>
            </div>
            <select 
              value={currency} 
              onChange={e => setCurrency(e.target.value)} 
              className="flex-1 sm:flex-none bg-gray-700 text-white rounded px-3 py-2 h-12 text-base border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none touch-manipulation"
            >
              {SUPPORTED_CURRENCIES.map(c => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            <button 
              onClick={exportAllDataCSV} 
              className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-3 sm:px-4 py-3 rounded h-12 text-sm sm:text-base touch-manipulation transition-colors"
            >
              {t.exportCSV}
            </button>
            <label className="flex-shrink-0 cursor-pointer bg-green-500 hover:bg-green-600 active:bg-green-700 text-white px-3 sm:px-4 py-3 rounded h-12 flex items-center text-sm sm:text-base touch-manipulation transition-colors">
              {t.importCSV}
              <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
            </label>
            {undoStack.length > 0 && (
              <button 
                onClick={undoLastAction} 
                className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white px-3 sm:px-4 py-3 rounded h-12 flex items-center gap-1 sm:gap-2 text-sm sm:text-base touch-manipulation transition-colors"
                title="Ctrl+Z"
              >
                <span className="text-lg">↶</span>
                <span className="hidden sm:inline">Ångra</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Swipe hint for mobile */}
        <div className="sm:hidden text-center text-gray-400 text-xs mb-4">
          💡 Swipe vänster/höger för att byta månad
        </div>
        
        {/* Tabbinnehåll */}
        {activeTab === 'budget' && (
          <div className="space-y-6">
            <Totals
              t={t}
              formatCurrency={formatCurrency}
              totalIncomes={totalIncomes}
              totalExpenses={totalExpenses}
              savings={savings}
              totalSaved={totalSaved}
            />
            <AddEntryForm
              description={description}
              setDescription={setDescription}
              amount={amount}
              setAmount={setAmount}
              category={category}
              setCategory={setCategory}
              isRecurring={isRecurring}
              setIsRecurring={setIsRecurring}
              addIncome={addIncome}
              addExpense={addExpense}
              addSaving={addSaving}
              t={t}
              categories={EXPENSE_CATEGORIES}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <Incomes
                incomes={incomes}
                removeIncome={removeIncome}
                t={t}
                formatCurrency={formatCurrency}
              />
              <Expenses
                expenses={expenses}
                removeExpense={removeExpense}
                toggleExpensePaid={toggleExpensePaid}
                t={t}
                formatCurrency={formatCurrency}
                expenseSearch={expenseSearch}
                setExpenseSearch={setExpenseSearch}
                showOnlyUnpaid={showOnlyUnpaid}
                setShowOnlyUnpaid={setShowOnlyUnpaid}
                unpaidExpenses={unpaidExpenses}
                bulkMode={bulkMode}
                setBulkMode={setBulkMode}
                selectedExpenses={selectedExpenses}
                toggleExpenseSelection={toggleExpenseSelection}
                bulkMarkAsPaid={bulkMarkAsPaid}
                bulkDelete={bulkDelete}
              />
              <Savings
                savings={savingsList}
                removeSaving={removeSaving}
                t={t}
                formatCurrency={formatCurrency}
                totalSaved={totalSaved}
              />
            </div>
            <RecurringExpenses
              recurringExpenses={recurringExpenses}
              removeRecurringExpense={removeRecurringExpense}
              addRecurringExpensesToMonth={addRecurringExpensesToMonth}
              t={t}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
        {activeTab === 'diagram' && (
          <DiagramTab incomes={incomes} expenses={expenses} savings={savingsList} />
        )}
        {activeTab === 'year' && (
          <div>
            <div className="mb-4 flex gap-2 items-center">
              <label htmlFor="year" className="text-yellow-400 font-semibold">{t.yearLabel}</label>
              <input 
                type="number" 
                id="year" 
                value={year} 
                onChange={e => setYear(e.target.value)} 
                className="bg-gray-700 text-white rounded px-3 py-1 w-24 touch-manipulation" 
              />
            </div>
            <YearOverviewTab year={year} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
