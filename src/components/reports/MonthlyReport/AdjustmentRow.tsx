// src/components/reports/MonthlyReport/AdjustmentRow.tsx

import React from 'react';
import { Edit3 } from 'lucide-react';
import { Adjustments2024 } from '../../../types/reportTypes';

interface AdjustmentRowProps {
  categoryCode: string;
  months: number[];
  adjustments: Adjustments2024;
  onChange: (categoryCode: string, month: number, value: string | number) => void;
  getAdjustmentValue: (categoryCode: string, month: number) => number;
  formatCurrency: (amount: number) => string;
}

export const AdjustmentRow: React.FC<AdjustmentRowProps> = ({
  categoryCode,
  months,
  adjustments,
  onChange,
  getAdjustmentValue,
  formatCurrency
}) => {
  const totalAdjustments = months.reduce((sum, m) => sum + getAdjustmentValue(categoryCode, m), 0);

  return (
    <tr className="bg-yellow-50">
      <td className="border border-gray-300 px-6 py-2 sticky right-0 bg-yellow-50">
        <div className="flex items-center gap-2">
          <Edit3 className="w-3 h-3 text-amber-600" />
          <span className="font-medium text-amber-800">התאמה 2024+</span>
        </div>
      </td>
      {months.map(m => (
        <td key={m} className="border border-gray-300 px-2 py-2 text-center">
          <input
            type="text"
            inputMode="numeric"
            className="w-24 px-2 py-1 border border-amber-300 rounded text-center text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
            value={adjustments[categoryCode]?.[m] ?? ''}
            onChange={(e) => {
              onChange(categoryCode, m, e.target.value);
            }}
            onFocus={(e) => e.target.select()}
            placeholder="0"
          />
        </td>
      ))}
      <td className="border border-gray-300 px-3 py-2 text-center font-medium text-amber-800">
        {formatCurrency(totalAdjustments)}
      </td>
      <td className="border border-gray-300"></td>
    </tr>
  );
};