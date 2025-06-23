import React from 'react';

interface YearOverviewProps {
  year: string;
}

const YearOverviewTab: React.FC<YearOverviewProps> = ({ year }) => {
  // Hämta all data för året från localStorage
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
  let totalIncome = 0;
  let totalExpense = 0;
  let totalSavings = 0;
  let totalSaved = 0;
  let monthsWithData = 0;

  months.forEach(month => {
    const data = localStorage.getItem(`budget-data-${month}`);
    if (data) {
      const parsed = JSON.parse(data);
      const incomeSum = (parsed.incomes || []).reduce((sum: number, i: any) => sum + i.amount, 0);
      const expenseSum = (parsed.expenses || []).reduce((sum: number, i: any) => sum + i.amount, 0);
      if (incomeSum > 0 || expenseSum > 0) {
        monthsWithData++;
        totalIncome += incomeSum;
        totalExpense += expenseSum;
        totalSavings += incomeSum - expenseSum;
        totalSaved += (parsed.savingsList || []).reduce((sum: number, i: any) => sum + i.amount, 0);
      }
    }
  });

  const avgIncome = monthsWithData ? totalIncome / monthsWithData : 0;
  const avgExpense = monthsWithData ? totalExpense / monthsWithData : 0;
  const avgSavings = monthsWithData ? totalSavings / monthsWithData : 0;
  const avgSaved = monthsWithData ? totalSaved / monthsWithData : 0;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);

  return (
    <div className="w-full"> {/* Gör årsöversikten lika bred som övriga tabbar */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full">
        <h2 className="text-2xl font-semibold text-yellow-400 mb-6">Årsöversikt {year}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-300 mb-2">Totalt för året</h3>
            <ul className="text-gray-200">
              <li>Inkomster: <span className="font-bold">{formatCurrency(totalIncome)}</span></li>
              <li>Utgifter: <span className="font-bold">{formatCurrency(totalExpense)}</span></li>
              <li>Sparande (möjligt): <span className="font-bold">{formatCurrency(totalSavings)}</span></li>
              <li>Sparat (registrerat): <span className="font-bold">{formatCurrency(totalSaved)}</span></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Genomsnitt per månad</h3>
            <ul className="text-gray-200">
              <li>Inkomster: <span className="font-bold">{formatCurrency(avgIncome)}</span></li>
              <li>Utgifter: <span className="font-bold">{formatCurrency(avgExpense)}</span></li>
              <li>Sparande (möjligt): <span className="font-bold">{formatCurrency(avgSavings)}</span></li>
              <li>Sparat (registrerat): <span className="font-bold">{formatCurrency(avgSaved)}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-400">Antal månader med data: {monthsWithData}</div>
      </div>
    </div>
  );
};

export default YearOverviewTab;
