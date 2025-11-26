// src/components/reports/MonthlyReport/AdjustmentsEditorModal.tsx
// מודל עריכת עדכוני 2024

import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, AlertCircle } from 'lucide-react';

interface Adjustments2024 {
  [categoryCode: string]: {
    [month: number]: number | string;
  };
}

interface AdjustmentsEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  adjustments: Adjustments2024;
  onSave: (adjustments: Adjustments2024) => void;
  formatCurrency: (amount: number) => string;
}

const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

const CATEGORIES = [
  { code: '800', name: 'עלות המכר - רכש' },
  { code: '806', name: 'עלות המכר - הובלות' },
  { code: '801', name: 'הוצאות שיווק' },
  { code: '802', name: 'הוצאות משרד' },
  { code: '804', name: 'שכר עבודה' },
  { code: '805', name: 'הוצאות הנהלה' },
  { code: '811', name: 'פחת' },
  { code: '813', name: 'הוצאות מימון' },
  { code: '990', name: 'הוצאות אחרות' },
  { code: '991', name: 'הכנסות אחרות' }
];

export const AdjustmentsEditorModal: React.FC<AdjustmentsEditorModalProps> = ({
  isOpen,
  onClose,
  adjustments,
  onSave,
  formatCurrency
}) => {
  const [localAdjustments, setLocalAdjustments] = useState<Adjustments2024>({});
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    if (isOpen) {
      setLocalAdjustments({ ...adjustments });
    }
  }, [isOpen, adjustments]);

  if (!isOpen) return null;

  const handleChange = (categoryCode: string, month: number, value: string) => {
    const numValue = value === '' || value === '-' ? 0 : parseFloat(value) || 0;
    
    setLocalAdjustments(prev => ({
      ...prev,
      [categoryCode]: {
        ...(prev[categoryCode] || {}),
        [month]: numValue
      }
    }));
  };

  const getValue = (categoryCode: string, month: number): string => {
    const val = localAdjustments[categoryCode]?.[month];
    if (val === undefined || val === '' || val === 0) return '';
    return String(val);
  };

  const handleSave = () => {
    onSave(localAdjustments);
    onClose();
  };

  // חישוב סיכומים
  const getCategoryTotal = (categoryCode: string): number => {
    const catAdj = localAdjustments[categoryCode] || {};
    return Object.values(catAdj).reduce((sum: number, val) => {
      const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      return sum + num;
    }, 0);
  };

  const getMonthTotal = (month: number): number => {
    return CATEGORIES.reduce((sum, cat) => {
      const val = localAdjustments[cat.code]?.[month];
      const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0;
      return sum + num;
    }, 0);
  };

  const grandTotal = CATEGORIES.reduce((sum, cat) => sum + getCategoryTotal(cat.code), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b" style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white'
        }}>
          <div className="flex items-center gap-3">
            <Calculator className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">עדכוני 2024</h3>
              <p className="text-sm opacity-90">התאמות והוספות חד-פעמיות לשנת 2024</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* הודעת הסבר */}
        <div className="p-4 bg-amber-50 border-b border-amber-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <strong>איך זה עובד:</strong> כאן תוכל להוסיף סכומים חד-פעמיים לכל קטגוריה וחודש. 
              למשל: תשלום מיוחד, תיקון חשבונאי, או התאמה משנה קודמת.
            </div>
          </div>
        </div>

        {/* טבלת עדכונים */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-220px)]">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-48">
                  קטגוריה
                </th>
                {months.map(m => (
                  <th key={m} className="border border-gray-300 px-2 py-3 text-center font-semibold">
                    {MONTH_NAMES[m - 1]}
                  </th>
                ))}
                <th className="border border-gray-300 px-3 py-3 text-center font-semibold bg-amber-50">
                  סה"כ
                </th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map(cat => (
                <tr key={cat.code} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="font-medium text-gray-700">{cat.code}</div>
                    <div className="text-xs text-gray-500">{cat.name}</div>
                  </td>
                  {months.map(m => (
                    <td key={m} className="border border-gray-300 px-1 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        value={getValue(cat.code, m)}
                        onChange={(e) => handleChange(cat.code, m, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="-"
                      />
                    </td>
                  ))}
                  <td className="border border-gray-300 px-3 py-2 text-center font-bold bg-amber-50 text-black">
                    {formatCurrency(getCategoryTotal(cat.code))}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 sticky bottom-0">
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                  סה"כ חודשי
                </td>
                {months.map(m => (
                  <td key={m} className="border border-gray-300 px-2 py-3 text-center font-bold text-green-600">
                    {formatCurrency(getMonthTotal(m))}
                  </td>
                ))}
                <td className="border border-gray-300 px-3 py-3 text-center font-bold text-green-700 text-base bg-amber-100">
                  {formatCurrency(grandTotal)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* כפתורי פעולה */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg font-medium transition-colors shadow-sm"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
          >
            <Save className="w-4 h-4" />
            שמור עדכונים
          </button>
        </div>
      </div>
    </div>
  );
};