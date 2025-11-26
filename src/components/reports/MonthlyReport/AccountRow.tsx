// src/components/reports/MonthlyReport/AccountRow.tsx

import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface AccountData {
  accountKey: number;
  accountName: string;
  data: {
    [month: number]: number;
    total: number;
  };
  vendorCount: number;
}

interface AccountRowProps {
  account: AccountData;
  months: number[];
  isExpanded: boolean;
  onToggle: () => void;
  formatCurrency: (amount: number) => string;
  categoryType: 'income' | 'cogs' | 'operating' | 'financial';
  bgColor?: string;
}

export const AccountRow: React.FC<AccountRowProps> = ({
  account,
  months,
  isExpanded,
  onToggle,
  formatCurrency,
  categoryType,
  bgColor = 'bg-gray-50'
}) => {
  const hasVendors = account.vendorCount > 0;

  return (
    <tr 
      className={`${bgColor} hover:bg-gray-100 cursor-pointer transition-colors`}
      onClick={onToggle}
    >
      <td className={`border border-gray-300 px-4 py-2 sticky right-0 ${bgColor}`}>
        <div className="flex items-center gap-2" style={{ paddingRight: '20px' }}>
          {hasVendors && (
            <div className="flex-shrink-0">
              {isExpanded ? 
                <Minus className="w-4 h-4 text-blue-600" /> : 
                <Plus className="w-4 h-4 text-blue-600" />
              }
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
              רמה 2
            </span>
            <span className="font-medium text-gray-900">
              {account.accountKey}
            </span>
            <span className="text-gray-600">—</span>
            <span className="text-gray-800">
              {account.accountName}
            </span>
            {hasVendors && (
              <span className="text-xs text-gray-500">
                ({account.vendorCount} ספקים)
              </span>
            )}
          </div>
        </div>
      </td>

      {months.map(m => (
        <td 
          key={m} 
          className="border border-gray-300 px-3 py-2 text-center font-medium text-gray-800 hover:bg-blue-50 transition-colors"
        >
          {categoryType === 'income' 
            ? formatCurrency(account.data[m] || 0)
            : formatCurrency(Math.abs(account.data[m] || 0))
          }
        </td>
      ))}

      <td className="border border-gray-300 px-3 py-2 text-center font-bold text-gray-900">
        {categoryType === 'income'
          ? formatCurrency(account.data.total)
          : formatCurrency(Math.abs(account.data.total))
        }
      </td>

      <td className="border border-gray-300 px-2 py-2 text-center">
        <span className="text-xs text-gray-400">📊</span>
      </td>
    </tr>
  );
};