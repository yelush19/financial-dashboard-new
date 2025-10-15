// src/components/reports/MonthlyReport/BiurModal.tsx

import React from 'react';
import { X } from 'lucide-react';
import { BiurData } from '../../../types/reportTypes';

interface BiurModalProps {
  isOpen: boolean;
  data: BiurData;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
}

export const BiurModal: React.FC<BiurModalProps> = ({
  isOpen,
  data,
  onClose,
  formatCurrency
}) => {
  if (!isOpen) return null;

  const totalAmount = data.transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{data.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {data.transactions.length} תנועות | סה"כ: {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="סגור"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* טבלת תנועות */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">תאריך</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">חשבון</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">שם חשבון</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">פרטים</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">ח-ן נגדי</th>
                <th className="border border-gray-300 px-3 py-2 text-right font-semibold">שם ח-ן נגדי</th>
                <th className="border border-gray-300 px-3 py-2 text-left font-semibold">סכום</th>
              </tr>
            </thead>
            <tbody>
              {data.transactions.map((tx, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-300 px-3 py-2 text-sm whitespace-nowrap">
                    {tx.date}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-blue-600">
                    {tx.accountKey}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {tx.accountName}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm max-w-xs truncate" title={tx.details}>
                    {tx.details}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm font-medium text-purple-600">
                    {tx.counterAccountNumber || '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm">
                    {tx.counterAccountName || '-'}
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-left font-medium">
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 sticky bottom-0">
              <tr>
                <td colSpan={6} className="border border-gray-300 px-3 py-2 text-right font-bold">
                  סה"כ:
                </td>
                <td className="border border-gray-300 px-3 py-2 text-left font-bold">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};