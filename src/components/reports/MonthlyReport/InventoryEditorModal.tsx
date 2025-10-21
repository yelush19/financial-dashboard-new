// src/components/reports/MonthlyReport/InventoryEditorModal.tsx
// מערכת עדכון מלאי רב-שנתי עם העברה אוטומטית בין חודשים

import React, { useState, useEffect } from 'react';
import { X, Save, Package, AlertCircle, ArrowLeft } from 'lucide-react';

// ============ TYPES ============
interface Inventory {
  [monthKey: string]: number; // פורמט: "YYYY-MM" (לדוגמה: "2025-01", "2026-01")
}

interface InventoryEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  openingInventory: Inventory;
  closingInventory: Inventory;
  onSave: (opening: Inventory, closing: Inventory) => void;
  formatCurrency: (amount: number) => string;
}

interface MonthDisplay {
  key: string;      // "2025-01"
  year: number;     // 2025
  month: number;    // 1
  display: string;  // "ינואר 2025"
}

// ============ CONSTANTS ============
const MONTH_NAMES = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
];

// ============ HELPER FUNCTIONS ============

// יצירת מפתח חודש
const createMonthKey = (year: number, month: number): string => {
  return `${year}-${String(month).padStart(2, '0')}`;
};

// פענוח מפתח חודש
const parseMonthKey = (key: string): { year: number; month: number } => {
  const [yearStr, monthStr] = key.split('-');
  return {
    year: parseInt(yearStr),
    month: parseInt(monthStr)
  };
};

// חישוב החודש הבא (כולל מעבר שנה)
const getNextMonthKey = (currentKey: string): string => {
  const { year, month } = parseMonthKey(currentKey);
  
  if (month === 12) {
    // מעבר לשנה הבאה
    return createMonthKey(year + 1, 1);
  } else {
    // אותה שנה, חודש הבא
    return createMonthKey(year, month + 1);
  }
};

// יצירת תצוגת חודש
const formatMonthDisplay = (key: string): string => {
  const { year, month } = parseMonthKey(key);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

// יצירת חודשים דינמית - רב-שנתית!
const getExistingMonths = (opening: Inventory, closing: Inventory): MonthDisplay[] => {
  const allKeys = new Set([
    ...Object.keys(opening),
    ...Object.keys(closing)
  ]);
  
  // אם יש חודשים קיימים - השתמש בהם
  if (allKeys.size > 0) {
    return Array.from(allKeys)
      .sort()
      .map(key => {
        const { year, month } = parseMonthKey(key);
        return {
          key,
          year,
          month,
          display: formatMonthDisplay(key)
        };
      });
  }
  
  // אם אין חודשים - צור מינואר 2025 והלאה (3 שנים)
  const months: MonthDisplay[] = [];
  const startYear = 2025;
  const endYear = 2027; // 2025, 2026, 2027
  
  // 📅 כל החודשים מ-2025 עד 2027
  for (let year = startYear; year <= endYear; year++) {
    for (let month = 1; month <= 12; month++) {
      const key = createMonthKey(year, month);
      months.push({
        key,
        year,
        month,
        display: formatMonthDisplay(key)
      });
    }
  }
  
  return months;
};

// פורמט מספר עם פסיקים
const formatNumber = (num: number): string => {
  if (!num) return '';
  return new Intl.NumberFormat('he-IL').format(num);
};

// המרת טקסט למספר
const parseNumber = (text: string): number => {
  if (!text || text === '-') return 0;
  return parseFloat(text.replace(/,/g, '')) || 0;
};

// ============ MAIN COMPONENT ============
export const InventoryEditorModal: React.FC<InventoryEditorModalProps> = ({
  isOpen,
  onClose,
  openingInventory,
  closingInventory,
  onSave,
  formatCurrency
}) => {
  const [localClosing, setLocalClosing] = useState<Inventory>({});
  const [localOpening, setLocalOpening] = useState<Inventory>({});
  const [months, setMonths] = useState<MonthDisplay[]>([]);

  // טעינת נתונים כשהמודל נפתח
  useEffect(() => {
    if (isOpen) {
      setLocalClosing({ ...closingInventory });
      setLocalOpening({ ...openingInventory });
      
      // זיהוי החודשים הקיימים
      const existingMonths = getExistingMonths(openingInventory, closingInventory);
      setMonths(existingMonths);
    }
  }, [isOpen, closingInventory, openingInventory]);

  if (!isOpen) return null;

  // עדכון מלאי סגירה + אוטומטי לפתיחה של החודש הבא
  const handleClosingChange = (monthKey: string, value: string) => {
    const numValue = parseNumber(value);
    
    const newClosing = { ...localClosing, [monthKey]: numValue };
    const newOpening = { ...localOpening };
    
    // העתקה אוטומטית לחודש הבא (גם אם זה שנה אחרת!)
    const nextMonthKey = getNextMonthKey(monthKey);
    
    // בדיקה אם החודש הבא קיים ברשימה
    const nextMonthExists = months.some(m => m.key === nextMonthKey);
    
    if (nextMonthExists) {
      newOpening[nextMonthKey] = numValue;
    }
    
    setLocalClosing(newClosing);
    setLocalOpening(newOpening);
  };

  // שמירה
  const handleSave = () => {
    onSave(localOpening, localClosing);
    onClose();
  };

  // חישוב סכומים
  const totalOpening = Object.values(localOpening).reduce((a, b) => a + b, 0);
  const totalClosing = Object.values(localClosing).reduce((a, b) => a + b, 0);
  const totalDiff = totalClosing - totalOpening;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-bold text-gray-800">עדכון מלאי</h3>
              <p className="text-sm text-gray-600">תומך במעבר בין שנים - מלאי סגירה מועבר אוטומטי</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* הודעת הסבר */}
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>איך זה עובד:</strong> ערוך רק את מלאי הסגירה. 
              מלאי סגירה של דצמבר 2025 יועבר אוטומטית לפתיחת ינואר 2026.
            </div>
          </div>
        </div>

        {/* טבלת מלאי */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-280px)]">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold w-40">
                  חודש ושנה
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  מלאי פתיחה
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold bg-blue-50">
                  מלאי סגירה
                </th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold w-24">
                  העברה
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((monthData, index) => {
                const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                const hasNextMonth = nextMonth !== null;
                const nextMonthKey = hasNextMonth ? getNextMonthKey(monthData.key) : null;
                const willTransfer = nextMonthKey && months.some(m => m.key === nextMonthKey);
                
                return (
                  <tr key={monthData.key} className="hover:bg-gray-50">
                    {/* שם החודש */}
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium text-gray-700">{monthData.display}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{monthData.key}</div>
                    </td>
                    
                  {/* מלאי פתיחה - עריכה רק לינואר 2025 */}
<td className="border border-gray-300 px-4 py-3 text-center bg-gray-50">
  {monthData.key === '2025-01' ? (
    // ✅ ינואר 2025 - ניתן לעריכה
    <input
      type="text"
      inputMode="numeric"
      className="w-full px-3 py-2 border-2 border-green-300 rounded-lg text-center font-medium focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none bg-white"
      value={formatNumber(localOpening[monthData.key] || 0)}
      onChange={(e) => {
        const numValue = parseNumber(e.target.value);
        setLocalOpening({...localOpening, [monthData.key]: numValue});
      }}
      onFocus={(e) => e.target.select()}
      placeholder="0"
    />
  ) : (
    // ❌ שאר החודשים - קריאה בלבד
    <>
      <div className="text-gray-600 font-medium">
        {formatNumber(localOpening[monthData.key] || 0)}
      </div>
      <div className="text-xs text-gray-400 mt-1">
        (אוטומטי)
      </div>
    </>
  )}
</td>
                    
                    {/* מלאי סגירה - ניתן לעריכה */}
                    <td className="border border-gray-300 px-4 py-3 text-center">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-center font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                        value={formatNumber(localClosing[monthData.key] || 0)}
                        onChange={(e) => handleClosingChange(monthData.key, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                      />
                    </td>
                    
                    {/* אינדיקטור העברה */}
                    <td className="border border-gray-300 px-2 py-3 text-center">
                      {willTransfer && (
                        <div className="flex flex-col items-center gap-1">
                          <ArrowLeft className="w-4 h-4 text-green-600" />
                          <span className="text-xs text-green-600">יועבר</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 sticky bottom-0">
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800">
                  סה"כ
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-blue-600">
                  {formatCurrency(totalOpening)}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-bold text-green-600">
                  {formatCurrency(totalClosing)}
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  <div className="text-xs font-bold" style={{ 
                    color: totalDiff > 0 ? '#16a34a' : totalDiff < 0 ? '#dc2626' : '#6b7280' 
                  }}>
                    {totalDiff > 0 ? '+' : ''}{formatCurrency(totalDiff)}
                  </div>
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
            className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            שמור ועדכן
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== DEMO ====================
export default function Demo() {
  const [showModal, setShowModal] = useState(false);
  
  // דוגמה: נתונים שעוברים משנת 2025 ל-2026
  const [openingInventory, setOpeningInventory] = useState<Inventory>({
    '2025-01': 650000,
    '2025-02': 680000,
    '2025-03': 700000,
    '2025-10': 720000,
    '2025-11': 730000,
    '2025-12': 740000,
    '2026-01': 740000,  // מועבר אוטומטי מדצמבר 2025
    '2026-02': 750000,
    '2026-03': 760000,
  });
  
  const [closingInventory, setClosingInventory] = useState<Inventory>({
    '2025-01': 680000,
    '2025-02': 700000,
    '2025-03': 720000,
    '2025-10': 730000,
    '2025-11': 740000,
    '2025-12': 740000,  // יועבר ל-2026-01
    '2026-01': 750000,
    '2026-02': 760000,
    '2026-03': 770000,
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleSave = (opening: Inventory, closing: Inventory) => {
    setOpeningInventory(opening);
    setClosingInventory(closing);
    
    console.log('✅ מלאי עודכן:', {
      opening,
      closing
    });
    
    alert('המלאי עודכן בהצלחה! ✅\nבדוק את הקונסול לפרטים');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-4 mb-6">
            <Package className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                מערכת עדכון מלאי רב-שנתי
              </h1>
              <p className="text-gray-600 mt-1">
                תומך במעבר בין שנים - דצמבר 2025 ← ינואר 2026
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6 mb-6 border border-blue-200">
            <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              תכונות המערכת:
            </h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>מעבר בין שנים:</strong> מלאי סגירה 12/2025 ← פתיחה 01/2026</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>פורמט גמיש:</strong> פורמט YYYY-MM (2025-01, 2026-12)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>העתקה אוטומטית:</strong> עריכת סגירה ← עדכון פתיחה החודש הבא</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span><strong>אינדיקטור ויזואלי:</strong> רואים איזה ערך יועבר לחודש הבא</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold text-lg transition-all shadow-md hover:shadow-xl"
          >
            <Package className="w-6 h-6" />
            פתח עדכון מלאי
          </button>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-blue-600">📥</span>
                מלאי פתיחה
              </h3>
              <div className="space-y-1 text-sm font-mono text-gray-600 max-h-64 overflow-auto">
                {Object.entries(openingInventory)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-semibold">{key}:</span>
                      <span>{formatCurrency(value)}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-green-600">📤</span>
                מלאי סגירה
              </h3>
              <div className="space-y-1 text-sm font-mono text-gray-600 max-h-64 overflow-auto">
                {Object.entries(closingInventory)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-semibold">{key}:</span>
                      <span>{formatCurrency(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <InventoryEditorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        onSave={handleSave}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}