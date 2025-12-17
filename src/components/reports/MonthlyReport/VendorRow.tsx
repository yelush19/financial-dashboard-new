// src/components/reports/MonthlyReport/VendorRow.tsx
// גרסה עם סינון דינמי - 27/11/2025
import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, Plus } from 'lucide-react';
import { VendorData, CategoryData, MonthlyData, Transaction } from '../../../types/reportTypes';
import { SupplierRow } from './SupplierRow';
import { EXCLUDED_COUNTER_ACCOUNTS } from '../../../utils/transactionFilter';
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

  // קיבוץ התנועות לפי ספק (vendorKey - שם ממופה)
  // משתמש בעמודות vendorKey/vendorName הממופות
  const suppliers: SupplierData[] = React.useMemo(() => {
    // קיבוץ לפי ספק ממופה
    const grouped = _.groupBy(vendor.transactions, tx => {
      const vKey = tx.vendorKey || tx.counterAccountNumber || 0;
      const vName = tx.vendorName || tx.counterAccountName || tx.details?.split(' ')[0] || 'לא ידוע';
      return `${vKey}|||${vName}`;
    });

    return Object.entries(grouped)
      .map(([key, txs]) => {
        const [vKeyStr, vName] = key.split('|||');
        const vendorKey = parseInt(vKeyStr) || 0;

        // סינון חשבונות טכניים (37999) מהצגה כספקים
        if (EXCLUDED_COUNTER_ACCOUNTS.has(vendorKey)) {
          return null;
        }

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
          key: vendorKey,
          name: vName || 'לא ידוע',
          data: supplierData,
          transactions: txs as Transaction[]
        };
      })
      .filter((s): s is SupplierData => s !== null && s.data.total !== 0)
      .sort((a, b) => Math.abs(b.data.total) - Math.abs(a.data.total));
  }, [vendor.transactions, months]);

  const hasSuppliers = suppliers.length > 1;

  return (
    <>
      {/* שורת החשבון הראשית */}
      <tr className={`${bgColor} hover:bg-gray-100 transition-colors border-t border-gray-200`}>
        <td className="border border-gray-200 px-4 py-2 font-medium sticky right-0 z-10" style={{ backgroundColor: 'inherit' }}>
          <div className="flex items-center gap-2">
            {hasSuppliers && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => onShowBiur()}
              className="p-1 hover:bg-blue-100 rounded text-blue-500"
              title="הצג תנועות"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="mr-2">{vendor.name}</span>
          </div>
        </td>
        {months.map(m => (
          <td
            key={m}
            onClick={() => onShowBiur(m)}
            className="border border-gray-200 px-3 py-2 text-center cursor-pointer hover:bg-blue-50 transition-colors"
          >
            {vendor.data[m] !== 0 ? formatCurrency(Math.abs(vendor.data[m])) : '-'}
          </td>
        ))}
        <td className="border border-gray-200 px-3 py-2 text-center font-semibold bg-gray-100">
          {formatCurrency(Math.abs(vendor.data.total))}
        </td>
      </tr>

      {/* שורות ספקים פרוסות */}
      {isExpanded && suppliers.map(supplier => (
        <SupplierRow
          key={supplier.key}
          supplier={supplier}
          months={months}
          onShowBiur={onShowBiur}
          formatCurrency={formatCurrency}
        />
      ))}
    </>
  );
};
