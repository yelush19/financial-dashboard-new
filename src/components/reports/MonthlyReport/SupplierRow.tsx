// src/components/reports/MonthlyReport/SupplierRow.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { MonthlyData, Transaction } from '../../../types/reportTypes';

interface SupplierData {
  key: number;
  name: string;
  data: MonthlyData;
  transactions: Transaction[];
}

interface SupplierRowProps {
  supplier: SupplierData;
  months: number[];
  onShowBiur: (month?: number) => void;
  formatCurrency: (amount: number) => string;
  bgColor?: string;
}

export const SupplierRow: React.FC<SupplierRowProps> = ({
  supplier,
  months,
  onShowBiur,
  formatCurrency,
  bgColor = 'bg-gray-50'
}) => {
  return (
    <tr className={`${bgColor} hover:bg-opacity-80 transition-colors`}>
      <td className={`border border-gray-200 px-4 py-2 sticky right-0 ${bgColor}`}>
        <div className="flex items-center gap-2 pr-16">
          <button
            onClick={() => onShowBiur()}
            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-green-600"
            title="הצג תנועות"
          >
            <Plus className="w-3 h-3" />
          </button>
          <span className="text-gray-500 text-xs">
            {supplier.key !== 0 ? `${supplier.name} - ${supplier.key}` : supplier.name}
          </span>
        </div>
      </td>
      {months.map(m => (
        <td 
          key={m} 
          className="border border-gray-200 px-3 py-2 text-center text-gray-500 text-xs cursor-pointer hover:bg-green-50"
          onClick={() => onShowBiur(m)}
        >
          {supplier.data[m] ? formatCurrency(supplier.data[m]) : ''}
        </td>
      ))}
      <td className="border border-gray-200 px-3 py-2 text-center font-medium text-gray-600 text-xs">
        {formatCurrency(supplier.data.total)}
      </td>
      <td className="border border-gray-200"></td>
    </tr>
  );
};
