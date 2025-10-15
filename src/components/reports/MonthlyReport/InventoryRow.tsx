// src/components/reports/MonthlyReport/InventoryRow.tsx

import React from 'react';
import { Edit3 } from 'lucide-react';
import { Inventory } from '../../../types/reportTypes';

interface InventoryRowProps {
  type: 'opening' | 'closing';
  months: number[];
  inventory: Inventory;
  onChange: (month: number, value: number) => void;
  formatCurrency: (amount: number) => string;
}

export const InventoryRow: React.FC<InventoryRowProps> = ({
  type,
  months,
  inventory,
  onChange,
  formatCurrency
}) => {
  const isOpening = type === 'opening';
  const label = isOpening ? 'מלאי פתיחה' : 'מלאי סגירה';
  const total = Object.values(inventory).reduce((a, b) => a + b, 0);

  return (
    <tr className="bg-blue-50">
      <td className="border border-gray-300 px-6 py-2 sticky right-0 bg-blue-50">
        <div className="flex items-center gap-2">
          <Edit3 className="w-3 h-3 text-gray-500" />
          <span className="font-medium">{label}</span>
        </div>
      </td>
      {months.map(m => (
        <td key={m} className="border border-gray-300 px-2 py-2 text-center">
          <input
            type="text"
            inputMode="numeric"
            className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={inventory[m] || ''}
            onChange={(e) => {
              const val = e.target.value;
              onChange(m, val === '' || val === '-' ? 0 : Number(val));
            }}
            onFocus={(e) => e.target.select()}
          />
        </td>
      ))}
      <td className="border border-gray-300 px-3 py-2 text-center font-medium">
        {isOpening 
          ? formatCurrency(total)
          : formatCurrency(-total)
        }
      </td>
      <td className="border border-gray-300"></td>
    </tr>
  );
};