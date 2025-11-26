// src/components/reports/MonthlyReport/SupplierRow.tsx
// שורת ספק (רמה 3) - מתחת לחשבון הוצאה

import React from 'react';
import { Plus } from 'lucide-react';
import { Transaction } from '../../../types/reportTypes';

interface SupplierRowProps {
  supplierKey: number;
  supplierName: string;
  transactions: Transaction[];
  months: number[];
  onShowTransactions: () => void;
  formatCurrency: (amount: number) => string;
  isIncome: boolean;
}

export const SupplierRow: React.FC<SupplierRowProps> = ({
  supplierKey,
  supplierName,
  transactions,
  months,
  onShowTransactions,
  formatCurrency,
  isIncome
}) => {
  // חישוב סכום לכל חודש
  const monthlyTotals: Record<number, number> = {};
  let total = 0;
  
  months.forEach(m => monthlyTotals[m] = 0);
  
  transactions.forEach(tx => {
    const month = parseInt(tx.date.split('/')[1]);
    if (months.includes(month)) {
      monthlyTotals[month] += tx.amount;
      total += tx.amount;
    }
  });

  return (
    <tr className="bg-gray-100 hover:bg-gray-200">
      <td className="border border-gray-300 px-12 py-1 text-xs text-gray-800 sticky right-0 bg-gray-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onShowTransactions}
            className="w-4 h-4 flex items-center justify-center rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors"
            title="הצג תנועות"
          >
            <Plus className="w-2.5 h-2.5" />
          </button>
          <span className="text-gray-400">│ └─</span>
          <span className="truncate">{supplierName}</span>
          <span className="text-gray-700 text-xs">({supplierKey})</span>
        </div>
      </td>
      {months.map(m => (
        <td 
          key={m} 
          className="border border-gray-300 px-2 py-1 text-center text-xs"
        >
          {isIncome
            ? formatCurrency(monthlyTotals[m] || 0)
            : formatCurrency(Math.abs(monthlyTotals[m] || 0))
          }
        </td>
      ))}
      <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">
        {isIncome
          ? formatCurrency(total)
          : formatCurrency(Math.abs(total))
        }
      </td>
      <td className="border border-gray-300"></td>
    </tr>
  );
};
