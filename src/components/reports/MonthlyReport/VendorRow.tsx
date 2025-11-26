// src/components/reports/MonthlyReport/VendorRow.tsx
import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, Plus } from 'lucide-react';
import { VendorData, CategoryData, MonthlyData, Transaction } from '../../../types/reportTypes';
import { SupplierRow } from './SupplierRow';
import _ from 'lodash';

interface SupplierData {
  key: number;
  name: string;
  data: MonthlyData;
  transactions: Transaction[];
}

interface VendorRowProps {
  vendor: VendorData;
  category: CategoryData;
  months: number[];
  onShowBiur: (month?: number) => void;
  formatCurrency: (amount: number) => string;
  bgColor?: string;
}

export const VendorRow: React.FC<VendorRowProps> = ({
  vendor,
  category,
  months,
  onShowBiur,
  formatCurrency,
  bgColor = 'bg-gray-50'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // קיבוץ התנועות לפי ספק (counterAccountNumber)
  const suppliers: SupplierData[] = React.useMemo(() => {
    const grouped = _.groupBy(vendor.transactions, tx => {
      const counterNum = tx.counterAccountNumber || 0;
      const counterName = tx.counterAccountName || tx.details?.split(' ')[0] || 'לא ידוע';
      return `${counterNum}|||${counterName}`;
    });

    return Object.entries(grouped)
      .map(([key, txs]) => {
        const [counterNum, counterName] = key.split('|||');
        const supplierData: MonthlyData = { total: 0 };
        months.forEach(m => supplierData[m] = 0);
        
        (txs as Transaction[]).forEach(tx => {
          const month = parseInt(tx.date.split('/')[1]);
          if (months.includes(month)) {
            supplierData[month] += tx.amount;
            supplierData.total += tx.amount;
          }
        });
        
        return {
          key: parseInt(counterNum) || 0,
          name: counterName || 'לא ידוע',
          data: supplierData,
          transactions: txs as Transaction[]
        };
      })
      .filter(s => s.data.total !== 0)
      .sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));
  }, [vendor.transactions, months]);

  const hasSuppliers = suppliers.length > 1;

  return (
    <>
      <tr className={`${bgColor} hover:bg-opacity-80 transition-colors`}>
        <td className={`border border-gray-200 px-4 py-2 sticky right-0 ${bgColor}`}>
          <div className="flex items-center gap-2 pr-8">
            {hasSuppliers ? (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500"
              >
                {isExpanded ? 
                  <ChevronDown className="w-4 h-4" /> : 
                  <ChevronLeft className="w-4 h-4" />
                }
              </button>
            ) : (
              <span className="w-6"></span>
            )}
            <button
              onClick={() => onShowBiur()}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-green-600"
              title="הצג תנועות"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-gray-700 text-sm font-medium">
              {vendor.name}
            </span>
            {hasSuppliers && (
              <span className="text-xs text-gray-400">
                ({suppliers.length} ספקים)
              </span>
            )}
          </div>
        </td>
        {months.map(m => (
          <td 
            key={m} 
            className="border border-gray-200 px-3 py-2 text-center text-gray-600 text-sm cursor-pointer hover:bg-green-50"
            onClick={() => onShowBiur(m)}
          >
            {vendor.data[m] ? formatCurrency(vendor.data[m]) : ''}
          </td>
        ))}
        <td className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">
          {formatCurrency(vendor.data.total)}
        </td>
        <td className="border border-gray-200"></td>
      </tr>

      {/* שורות ספקים - רמה 3 */}
      {isExpanded && suppliers.map((supplier, idx) => (
        <SupplierRow
          key={`${vendor.name}-${supplier.key}-${idx}`}
          supplier={supplier}
          months={months}
          onShowBiur={(month) => {
            // TODO: implement supplier-level biur
            onShowBiur(month);
          }}
          formatCurrency={formatCurrency}
          bgColor={bgColor === 'bg-green-50' ? 'bg-green-25' : 
                   bgColor === 'bg-orange-50' ? 'bg-orange-25' : 
                   'bg-gray-25'}
        />
      ))}
    </>
  );
};
