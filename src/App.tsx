import React, { useState, useMemo, useEffect } from 'react';
import TrashIcon from './assets/icons/TrashIcon.tsx';
import PlusIcon from './assets/icons/PlusIcon.tsx';
import DiagramTab from './DiagramTab';
import YearOverviewTab from './YearOverviewTab';

const EXPENSE_CATEGORIES = [
  'Boende', 'Mat', 'Transport', 'Nöjen', 'Hälsa', 'Shopping', 'Övrigt'
];

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

const App: React.FC = () => {
  // Tabbar och månadsväljare
  const [activeTab, setActiveTab] = useState<'budget' | 'diagram' | 'year'>('budget');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // Budgetdata per månad
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(`budget-data-${getCurrentMonth()}`);
    return saved ? JSON.parse(saved) : { incomes: [], expenses: [], savingsList: [], maxSavings: 0 };
  });

  // Formfält
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [maxSavings, setMaxSavings] = useState(data.maxSavings || 10000);
  const [currency, setCurrency] = useState(() => localStorage.getItem('budget-currency') || 'SEK');

  // Synka data med localStorage när månad byts
  useEffect(() => {
    const saved = localStorage.getItem(`budget-data-${selectedMonth}`);
    if (saved) {
      setData(JSON.parse(saved));
      setMaxSavings(JSON.parse(saved).maxSavings || 10000);
    } else {
      setData({ incomes: [], expenses: [], savingsList: [], maxSavings, currency });
    }
  }, [selectedMonth]);

  // Spara data till localStorage vid ändring
  useEffect(() => {
    localStorage.setItem(`budget-data-${selectedMonth}`,
      JSON.stringify({ ...data, maxSavings }));
  }, [data, selectedMonth, maxSavings]);

  useEffect(() => {
    localStorage.setItem('budget-currency', currency);
  }, [currency]);

  // Summeringar
  const totalIncomes = useMemo(() => (data.incomes || []).reduce((sum: number, item: any) => sum + item.amount, 0), [data]);
  const totalExpenses = useMemo(() => (data.expenses || []).reduce((sum: number, item: any) => sum + item.amount, 0), [data]);
  const unpaidExpenses = useMemo(() => (data.expenses || []).filter((item: any) => !item.paid).reduce((sum: number, item: any) => sum + item.amount, 0), [data]);
  const savings = useMemo(() => totalIncomes - totalExpenses, [totalIncomes, totalExpenses]);
  const totalSaved = useMemo(() => (data.savingsList || []).reduce((sum: number, item: any) => sum + item.amount, 0), [data]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency }).format(amount);
  };

  // Lägg till inkomst
  const addIncome = () => {
    if (!description || !amount) return;
    setData((prev: any) => ({
      ...prev,
      incomes: [...(prev.incomes || []), { id: Date.now(), description, amount: parseFloat(amount) }],
    }));
    setDescription('');
    setAmount('');
  };

  // Lägg till utgift
  const addExpense = () => {
    if (!description || !amount) return;
    setData((prev: any) => ({
      ...prev,
      expenses: [...(prev.expenses || []), { id: Date.now(), description, amount: parseFloat(amount), category, paid: false }],
    }));
    setDescription('');
    setAmount('');
  };

  // Markera utgift som betald/obetalad
  const toggleExpensePaid = (id: number) => {
    setData((prev: any) => ({
      ...prev,
      expenses: (prev.expenses || []).map((item: any) =>
        item.id === id ? { ...item, paid: !item.paid } : item
      ),
    }));
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
    setData((prev: any) => ({
      ...prev,
      savingsList: [...(prev.savingsList || []), { id: Date.now(), description, amount: val }],
    }));
    setDescription('');
    setAmount('');
  };

  // Ta bort post
  const removeItem = (type: 'income' | 'expense' | 'saving', id: number) => {
    setData((prev: any) => ({
      ...prev,
      [type === 'saving' ? 'savingsList' : type + 's']: (prev[type === 'saving' ? 'savingsList' : type + 's'] || []).filter((item: any) => item.id !== id),
    }));
  };

  // Exportera till CSV
  const exportCSV = () => {
    const rows = [
      ['Typ', 'Beskrivning', 'Belopp', 'Kategori'],
      ...(data.incomes || []).map((i: any) => ['Inkomst', i.description, i.amount, '']),
      ...(data.expenses || []).map((e: any) => ['Utgift', e.description, e.amount, e.category]),
      ...(data.savingsList || []).map((s: any) => ['Sparande', '', s.amount, '']),
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
      const incomes: any[] = [], expenses: any[] = [], savingsList: any[] = [];
      lines.forEach(line => {
        const [typ, desc, belopp, kat] = line.split(';');
        if (typ === 'Inkomst') incomes.push({ id: Date.now() + Math.random(), description: desc, amount: parseFloat(belopp) });
        if (typ === 'Utgift') expenses.push({ id: Date.now() + Math.random(), description: desc, amount: parseFloat(belopp), category: kat });
        if (typ === 'Sparande') savingsList.push({ id: Date.now() + Math.random(), amount: parseFloat(belopp) });
      });
      setData({ incomes, expenses, savingsList, maxSavings });
    };
    reader.readAsText(file);
  };

  // Sök och filter för utgifter
  const [expenseSearch, setExpenseSearch] = useState('');
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);

  const filteredExpenses = useMemo(() => {
    return (data.expenses || [])
      .filter((item: any) =>
        (!showOnlyUnpaid || !item.paid) &&
        (
          item.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
          (item.category && item.category.toLowerCase().includes(expenseSearch.toLowerCase()))
        )
      );
  }, [data.expenses, expenseSearch, showOnlyUnpaid]);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-6xl">
        {/* Tabbar */}
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('budget')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'budget' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'}`}>Budget</button>
          <button onClick={() => setActiveTab('diagram')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'diagram' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'}`}>Diagram</button>
          <button onClick={() => setActiveTab('year')} className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'year' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-700 text-yellow-400'}`}>Årsöversikt</button>
        </div>
        {/* Månadsväljare och valutaväljare */}
        <div className="flex gap-4 mb-8 items-center flex-wrap">
          <input type="month" id="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-gray-700 text-white rounded px-3 py-2 h-12 text-base border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none" />
          <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-gray-700 text-white rounded px-3 py-2 h-12 text-base border-none focus:ring-2 focus:ring-yellow-400 focus:outline-none">
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
          <button onClick={exportCSV} className="ml-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded h-12">Exportera CSV</button>
          <label className="ml-2 cursor-pointer bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded h-12 flex items-center">
            Importera CSV
            <input type="file" accept=".csv" onChange={importCSV} className="hidden" />
          </label>
        </div>
        {/* Tabbinnehåll */}
        {activeTab === 'budget' && (
          <>
            <header className="mb-10 p-6 bg-gray-800 rounded-lg shadow-xl">
              <h1 className="text-4xl font-bold text-yellow-400 mb-6 text-center">Månadsbudget</h1>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-700 p-4 rounded-lg shadow-md">
                  <h2 className="text-lg text-green-400">Totala Inkomster</h2>
                  <p className="text-2xl font-semibold">{formatCurrency(totalIncomes)}</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg shadow-md">
                  <h2 className="text-lg text-red-400">Totala Utgifter</h2>
                  <p className="text-2xl font-semibold">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className={`bg-gray-700 p-4 rounded-lg shadow-md ${savings < 0 ? 'border border-red-500' : 'border border-yellow-400'}`}>
                  <h2 className="text-lg text-yellow-400">Att Spara</h2>
                  <p className={`text-2xl font-semibold ${savings < 0 ? 'text-red-500' : 'text-yellow-400'}`}>{formatCurrency(savings)}</p>
                  <div className="text-xs text-gray-300 mt-2">
                    {savings > 0
                      ? `Kvar att spara: ${formatCurrency(Math.max(0, savings - totalSaved))}`
                      : 'Kvar att spara: 0 kr'}
                  </div>
                </div>
                {/* Sparande-box */}
                <div className="bg-gray-700 p-4 rounded-lg shadow-md flex flex-col items-center">
                  <h2 className="text-lg text-blue-400">Sparande</h2>
                  <p className="text-2xl font-semibold">{formatCurrency(savings > 0 ? savings : 0)}</p>
                  <div className="mt-2 w-full bg-gray-600 rounded h-3">
                    <div className="bg-yellow-400 h-3 rounded" style={{ width: `${savings > 0 ? Math.min(100, (totalSaved / savings) * 100) : 0}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-300 mt-1">{savings > 0 ? Math.round((totalSaved / savings) * 100) : 0}% av möjligt sparande</div>
                </div>
              </div>
            </header>
            <section className="mb-10 p-6 bg-gray-800 rounded-lg shadow-xl">
              <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Lägg till post</h2>
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <input type="text" placeholder="Beskrivning" value={description} onChange={e => setDescription(e.target.value)} className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none" />
                <input type="number" placeholder="Belopp (SEK)" value={amount} onChange={e => setAmount(e.target.value)} className="p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none md:w-48" />
                <select value={category} onChange={e => setCategory(e.target.value)} className="p-3 bg-gray-700 border border-gray-600 rounded-lg text-white md:w-48">
                  {EXPENSE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <button onClick={addIncome} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 w-full md:w-auto">
                  <PlusIcon className="w-5 h-5" /> Lägg till Inkomst
                </button>
                <button onClick={addExpense} className="flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 w-full md:w-auto">
                  <PlusIcon className="w-5 h-5" /> Lägg till Utgift
                </button>
                <button onClick={addSaving} className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 w-full md:w-auto">
                  <PlusIcon className="w-5 h-5" /> Lägg till Sparande
                </button>
              </div>
            </section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold text-green-400 mb-4 border-b-2 border-yellow-400 pb-2">Inkomster</h2>
                <ul>
                  {(data.incomes || []).map((item: any) => (
                    <li key={item.id} className="flex justify-between items-center p-3 mb-2 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition duration-150">
                      <span>{item.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-green-300">{formatCurrency(item.amount)}</span>
                        <button onClick={() => removeItem('income', item.id)} className="text-gray-400 hover:text-red-400 transition duration-150">
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold text-red-400 mb-4 border-b-2 border-yellow-400 pb-2">Utgifter</h2>
                <div className="mb-2 flex flex-col sm:flex-row gap-2 sm:items-center">
                  <input
                    type="text"
                    placeholder="Sök utgift..."
                    value={expenseSearch}
                    onChange={e => setExpenseSearch(e.target.value)}
                    className="p-2 bg-gray-700 border border-gray-600 rounded-lg text-white w-full max-w-[180px] sm:max-w-[220px]"
                  />
                  <button
                    onClick={() => setShowOnlyUnpaid(v => !v)}
                    className={`px-3 py-2 rounded-lg font-semibold border transition text-sm whitespace-nowrap ${showOnlyUnpaid ? 'bg-red-500 text-white border-red-600' : 'bg-gray-700 text-red-300 border-gray-600'}`}
                  >
                    {showOnlyUnpaid ? 'Visa alla' : 'Visa bara obetalda'}
                  </button>
                </div>
                <div className="mb-4 bg-red-900/80 rounded-lg p-3 text-red-200 font-semibold flex items-center gap-2">
                  <span>Obetalda utgifter:</span>
                  <span className="text-lg">{formatCurrency(unpaidExpenses)}</span>
                </div>
                <ul>
                  {filteredExpenses.map((item: any) => (
                    <li key={item.id} className={`flex justify-between items-center p-3 mb-2 rounded-lg shadow-sm transition duration-150 ${item.paid ? 'bg-green-700/80 hover:bg-green-600/80' : 'bg-gray-700 hover:bg-gray-600'}`}> 
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={!!item.paid} onChange={() => toggleExpensePaid(item.id)} className="accent-green-500 w-5 h-5" title="Markera som betald" />
                        <span className={item.paid ? 'line-through text-green-200' : ''}>{item.description} <span className="text-xs text-yellow-300">({item.category})</span></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-medium ${item.paid ? 'text-green-200' : 'text-red-300'}`}>{formatCurrency(item.amount)}</span>
                        <button onClick={() => removeItem('expense', item.id)} className="text-gray-400 hover:text-red-400 transition duration-150">
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="p-6 bg-gray-800 rounded-lg shadow-xl">
                <h2 className="text-2xl font-semibold text-blue-400 mb-4 border-b-2 border-yellow-400 pb-2">Sparande</h2>
                <ul>
                  {(data.savingsList || []).map((item: any) => (
                    <li key={item.id} className="flex justify-between items-center p-3 mb-2 bg-gray-700 rounded-lg shadow-sm hover:bg-gray-600 transition duration-150">
                      <span>{item.description}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-blue-300">{formatCurrency(item.amount)}</span>
                        <button onClick={() => removeItem('saving', item.id)} className="text-gray-400 hover:text-red-400 transition duration-150">
                          <TrashIcon />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 text-right text-lg font-semibold text-blue-200">
                  Totalt sparat: {formatCurrency(totalSaved)}
                </div>
              </section>
            </div>
          </>
        )}
        {activeTab === 'diagram' && (
          <DiagramTab incomes={data.incomes || []} expenses={data.expenses || []} savings={data.savingsList || []} />
        )}
        {activeTab === 'year' && (
          <div>
            <div className="mb-4 flex gap-2 items-center">
              <label htmlFor="year" className="text-yellow-400 font-semibold">År:</label>
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
