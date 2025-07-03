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

  const prevSelectedMonth = usePrevious(selectedMonth);

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
    setDescription('');
    setAmount('');
  };

  // Lägg till utgift
  const addExpense = () => {
    if (!description || !amount) return;
    const newExpense = { id: Date.now(), description, amount: parseFloat(amount), category, paid: false };

    setExpenses(prev => [...prev, newExpense]);

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
    setExpenses(prev => prev.map(item =>
      item.id === id ? { ...item, paid: !item.paid } : item
    ));
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
    setDescription('');
    setAmount('');
  };

  // Ta bort post
  const removeIncome = (id: number) => {
    setIncomes(prev => prev.filter(item => item.id !== id));
  };
  const removeExpense = (id: number) => {
    setExpenses(prev => prev.filter(item => item.id !== id));
  };
  const removeSaving = (id: number) => {
    setSavingsList(prev => prev.filter(item => item.id !== id));
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

  // Exportera till CSV
  const exportCSV = () => {
    const rows = [
      ['Typ', 'Beskrivning', 'Belopp', 'Kategori'],
      ...incomes.map(i => ['Inkomst', i.description, i.amount, '']),
      ...expenses.map(e => ['Utgift', e.description, e.amount, e.category]),
      ...savingsList.map(s => ['Sparande', '', s.amount, '']),
    ];
    const csv = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${selectedMonth}.csv`;
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
      const lines = text.split('\n').slice(1); // hoppa header
      const newIncomes: any[] = [], newExpenses: any[] = [], newSavingsList: any[] = [];
      lines.forEach(line => {
        const [typ, desc, belopp, kat] = line.split(';');
        if (typ === 'Inkomst') newIncomes.push({ id: Date.now() + Math.random(), description: desc, amount: parseFloat(belopp) });
        if (typ === 'Utgift') newExpenses.push({ id: Date.now() + Math.random(), description: desc, amount: parseFloat(belopp), category: kat });
        if (typ === 'Sparande') newSavingsList.push({ id: Date.now() + Math.random(), amount: parseFloat(belopp) });
      });
      setIncomes(newIncomes);
      setExpenses(newExpenses);
      setSavingsList(newSavingsList);
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

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl">
        {/* Språkväxlare */}
        <div className="flex justify-end mb-2 gap-2">
          <select id="lang" value={language} onChange={e => setLanguage(e.target.value)}
            className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none text-sm font-semibold flex items-center min-w-[90px]">
            <option value="sv">Svenska</option>
            <option value="en">English</option>
          </select>
        </div>
        {/* Tabbar */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('budget')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'budget' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'}`}>{t.budget}</button>
          <button onClick={() => setActiveTab('diagram')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'diagram' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'}`}>{t.diagram}</button>
          <button onClick={() => setActiveTab('year')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'year' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'}`}>{t.year}</button>
        </div>
        {/* Månadsväljare och valutaväljare */}
        <div className="flex gap-4 mb-8 items-center flex-wrap">
          <input type="month" id="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-gray-700 text-white rounded px-3 py-2 h-12 text-base border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-gray-700 text-white rounded px-3 py-2 h-12 text-base border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none">
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded h-12">{t.exportCSV}</button>
          <label className="ml-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded h-12 flex items-center">
            {t.importCSV}
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
        </div>
        {/* Tabbinnehåll */}
        {activeTab === 'budget' && (
          <>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
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
          </>
        )}
        {activeTab === 'diagram' && (
          <DiagramTab incomes={incomes} expenses={expenses} savings={savingsList} />
        )}
        {activeTab === 'year' && (
          <div>
            <div className="mb-4 flex gap-2 items-center">
              <label htmlFor="year" className="text-yellow-400 font-semibold">{t.yearLabel}</label>
              <input type="number" id="year" value={year} onChange={e => setYear(e.target.value)} className="bg-gray-700 text-white rounded px-3 py-1 w-24" />
            </div>
            <YearOverviewTab year={year} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
