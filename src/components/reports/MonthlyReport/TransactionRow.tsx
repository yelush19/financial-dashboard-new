// src/components/reports/MonthlyReport/TransactionRow.tsx

import React from 'react';
import { Transaction } from '../../../types/reportTypes';

interface TransactionRowProps {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  categoryType: 'income' | 'cogs' | 'operating' | 'financial';
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  formatCurrency,
  categoryType
}) => {
  return (
    <tr className="bg-white hover:bg-yellow-50 transition-colors">
      <td className="border border-gray-300 px-4 py-2 sticky right-0 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-700" style={{ paddingRight: '60px' }}>
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded">
            רמה 4
          </span>
          <span className="text-gray-600">{transaction.date}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-800">{transaction.details || 'ללא פרטים'}</span>
        </div>
      </td>

      <td 
        colSpan={1} 
        className="border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-900"
      >
        {categoryType === 'income' 
          ? formatCurrency(transaction.amount || 0)
          : formatCurrency(Math.abs(transaction.amount || 0))
        }
      </td>

      <td colSpan={100} className="border border-gray-300 bg-gray-50"></td>
    </tr>
  );
};