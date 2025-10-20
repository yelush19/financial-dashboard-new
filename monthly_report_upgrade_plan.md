# 📋 תוכנית שדרוג - דוח רווח והפסד חודשי
**תאריך:** 20 אוקטובר 2025  
**קבצים במערכת:** 7 קבצים עובדים (לא ליצור חדשים!)

---

## 🎯 סיכום השדרוג - drill-down חודשי

הוספת 3 רמות ביאור **לכל חודש בנפרד**:

| רמה | מה רואים | דוגמה | פעולה |
|-----|-----------|--------|--------|
| **רמה 1 (קיימת)** | קוד מיון 800 - עלות מכר | ינואר: 50,000 \| פברואר: 45,000 \| מרץ: 60,000 | **לחץ על חודש** (למשל ינואר) |
| **רמה 2 (חדשה)** | פירוט לפי מפתח חשבון | **רק בינואר:** חשבון 45003: 30,000 \| חשבון 50004: 20,000 | **לחץ על חשבון בינואר** |
| **רמה 3 (חדשה)** | פירוט לפי ח-ן נגדי (ספקים) | **רק בינואר, רק לחשבון 45003:** ספק 20035: 18,000 \| ספק 30000: 12,000 | **לחץ על ספק** |
| **רמה 4 (חדשה)** | תנועות פרטניות | **רק תנועות של ספק 20035 בינואר לחשבון 45003** | BiurModal |

**חריגה:** מפתח 40000 + ח-ן נגדי 30000 = **סיכום חודשי בלבד** (ללא אפשרות לחיצה - רכישות לקוחות באתר)

---

## 💡 הרעיון המרכזי

**הלקוח רוצה לענות על השאלה:**
> "בחודש ינואר היתה עלות מכר של 50,000 ₪ - **מי הספקים שהרכיבו את זה?**"

**זרימת הקליקים:**
```
קוד 800: ינואר 50,000 ₪
    ↓ (לחיצה על התא "ינואר")
    
חשבון 45003: 30,000 ₪  ← רק בינואר!
חשבון 50004: 20,000 ₪  ← רק בינואר!
    ↓ (לחיצה על חשבון 45003)
    
ספק 20035: 18,000 ₪   ← רק בינואר, רק לחשבון 45003!
ספק 30000: 12,000 ₪   ← רק בינואר, רק לחשבון 45003!
    ↓ (לחיצה על ספק 20035)
    
תנועות: 5 תנועות של ספק 20035 בינואר ← BiurModal
```

**כל רמה = פירוט של החודש שנלחץ עליו!**

---

## ⚠️ החריגה החשובה - הכנסות מהאתר

**שורת "הכנסות מכירות - אתר" (חשבון 40000 + ח-ן נגדי 30000):**
- ✅ מציגה סכומים חודשיים רגילים
- ❌ **אין אפשרות לחיצה על החודשים** 
- 💡 **סיבה:** 16,845 תנועות של רכישות לקוחות - אין משמעות לניתוח PnL
- 🎨 **עיצוב:** התאים לא יהיו clickable (ללא hover effect)

---

## 🗂️ מבנה קבצים קיימים

```
MonthlyReport/
├── index.tsx              ← הקובץ הראשי (250 שורות)
├── BiurModal.tsx          ← חלון תנועות (קיים, לשדרג)
├── CategoryRow.tsx        ← שורת קטגוריה (לשדרג)
├── VendorRow.tsx          ← שורת ספק (נחליף בשורת חשבון)
├── TableHeader.tsx        ← כותרות טבלה (ללא שינוי)
├── AdjustmentRow.tsx      ← התאמות (ללא שינוי)
└── StatsCards.tsx         ← כרטיסי סטטיסטיקה (ללא שינוי)
```

---

## 🔧 שלבי העבודה - גישה חדשה!

### **✅ מערכת מלאי - משודרגת לרב-שנתי!**

**חלון עדכון מלאי חכם עם מעבר בין שנים:**

#### הקומפוננט: `InventoryEditorModal.tsx` (בארטיפאקט נפרד!)
```
┌──────────────────────────────────────────────┐
│  📦 עדכון מלאי                              │
├──────────────┬──────────────┬───────────────┤
│  חודש ושנה  │ מלאי פתיחה  │ מלאי סגירה  │
├──────────────┼──────────────┼───────────────┤
│ אוקטובר 25  │  720,000     │ [730,000] ✏️ │
│ נובמבר 25   │  730,000 ⚡  │ [740,000] ✏️ │
│ דצמבר 25    │  740,000 ⚡  │ [750,000] ✏️ │ → יועבר
│ ינואר 26    │  750,000 ⚡  │ [760,000] ✏️ │ ← מדצמבר!
│ פברואר 26   │  760,000 ⚡  │ [770,000] ✏️ │
└──────────────┴──────────────┴───────────────┘
```

#### תכונות מיוחדות:
- ✅ **פורמט YYYY-MM** - "2025-12", "2026-01" וכו'
- ✅ **מעבר שנים אוטומטי** - דצמבר 2025 → ינואר 2026
- ✅ **זיהוי חודשים חכם** - מזהה מהנתונים הקיימים
- ✅ **אינדיקטור העברה** - רואים חץ ירוק "יועבר"
- ✅ **פורמט עם פסיקים** - 750,000

#### איך זה עובד בקוד:
```typescript
interface Inventory {
  [monthKey: string]: number;  // "2025-12": 750000
}

// דוגמה:
openingInventory = {
  "2025-12": 740000,
  "2026-01": 740000,  // ← העתקה אוטומטית
  "2026-02": 750000
}
```

#### שינויים נדרשים ב-index.tsx:
**הממשק הנוכחי משתמש במספרים (1-12), צריך לשנות לפורמט YYYY-MM!**

**זמן הוספה:** 15 דקות (כולל המרת הפורמט)

---

### **שלב 1: הוספת InventoryEditorModal רב-שנתי** ⏱️ 15 דק'

**קובץ חדש:** `InventoryEditorModal.tsx` 

**📦 הקוד המלא נמצא בארטיפאקט נפרד בשם "InventoryEditorModal - קומפוננט מוכן להעתקה"**

**מה לעשות:**
1. צור קובץ: `src/components/reports/MonthlyReport/InventoryEditorModal.tsx`
2. **העתק את כל הקוד מהארטיפאקט הנפרד** (לא מהתוכנית הזו!)
3. שמור

**⚠️ חשוב:** הקומפוננט משתמש בפורמט `YYYY-MM` (לדוגמה: "2025-01", "2026-12").
אם המערכת הנוכחית שלך משתמשת במספרים פשוטים (1-12), תצטרך להמיר!

---

### **שלב 2: המרת פורמט מלאי (אם נדרש)** ⏱️ 10 דק'

**קובץ:** `index.tsx`

**אם המערכת הנוכחית שלך משתמשת במספרים פשוטים:**

```typescript
// ❌ פורמט ישן
openingInventory = {
  1: 650000,    // ינואר
  2: 680000,    // פברואר
  ...
}

// ✅ פורמט חדש רב-שנתי
openingInventory = {
  "2025-01": 650000,
  "2025-02": 680000,
  ...
}
```

**פונקציית המרה:**
```typescript
// המרה מפורמט ישן לחדש
const convertInventoryFormat = (oldFormat: {[month: number]: number}, year: number = 2025) => {
  const newFormat: {[key: string]: number} = {};
  Object.entries(oldFormat).forEach(([month, value]) => {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    newFormat[monthKey] = value;
  });
  return newFormat;
};

// המרה מפורמט חדש לישן (לתאימות עם קוד קיים)
const getMonthValue = (inventory: {[key: string]: number}, month: number, year: number = 2025) => {
  const monthKey = `${year}-${String(month).padStart(2, '0')}`;
  return inventory[monthKey] || 0;
};
```

**עדכון בטעינה:**
```typescript
useEffect(() => {
  // טעינה מ-localStorage
  const savedOpening = localStorage.getItem(STORAGE_KEYS.OPENING_INVENTORY);
  if (savedOpening) {
    const parsed = JSON.parse(savedOpening);
    // בדיקה אם זה פורמט ישן (מספרים) או חדש (מחרוזות)
    const firstKey = Object.keys(parsed)[0];
    if (!isNaN(Number(firstKey))) {
      // פורמט ישן - המרה
      setOpeningInventory(convertInventoryFormat(parsed, 2025));
    } else {
      // פורמט חדש
      setOpeningInventory(parsed);
    }
  }
}, []);
```

**⚠️ אם המערכת כבר משתמשת ב-YYYY-MM - דלג על שלב זה!**

---

### **שלב 3: חיבור המודל ל-index.tsx** ⏱️ 8 דק'

**קובץ:** `index.tsx`

#### 3.1 Import (שורה ~30):
```typescript
import { InventoryEditorModal } from './InventoryEditorModal';
import { Package } from 'lucide-react'; // אם עדיין לא מיובא
```

#### 3.2 הוסף State (שורה ~50):
```typescript
const [showInventoryEditor, setShowInventoryEditor] = useState(false);
```

#### 3.3 פונקציית שמירה (שורה ~100):
```typescript
const handleInventorySave = (opening: Inventory, closing: Inventory) => {
  setOpeningInventory(opening);
  setClosingInventory(closing);
  
  // שמירה ב-localStorage
  localStorage.setItem(STORAGE_KEYS.OPENING_INVENTORY, JSON.stringify(opening));
  localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, JSON.stringify(closing));
  
  console.log('✅ מלאי עודכן:', { opening, closing });
};
```

#### 3.4 הוסף כפתור "עדכן מלאי" (שורה ~450):

מצא את `InventoryBackupControls` והוסף כפתור לפניו:

```typescript
<div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
  {/* כפתור חדש - עדכן מלאי */}
  <button
    onClick={() => setShowInventoryEditor(true)}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 16px',
      background: '#8b5cf6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'background 0.2s'
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = '#7c3aed'}
    onMouseLeave={(e) => e.currentTarget.style.background = '#8b5cf6'}
  >
    <Package size={16} />
    עדכן מלאי
  </button>
</div>

{/* הקומפוננט הקיים */}
<InventoryBackupControls
  openingInventory={openingInventory}
  closingInventory={closingInventory}
  onImport={handleInventoryImport}
/>
```

#### 3.5 הוסף את המודל לפני סגירת ה-render (שורה ~700):
```typescript
      {/* InventoryEditorModal */}
      <InventoryEditorModal
        isOpen={showInventoryEditor}
        onClose={() => setShowInventoryEditor(false)}
        openingInventory={openingInventory}
        closingInventory={closingInventory}
        onSave={handleInventorySave}
        formatCurrency={formatCurrency}
      />

      {/* DrillDownModal - יווצר בשלבים הבאים */}
      ...
```

---

### **שלב 4: הוספת State לניהול drill-down** ⏱️ 3 דק'

**קובץ:** `index.tsx`

הוסף state חדש (אחרי שורה 50):

```typescript
// State לניהול drill-down חודשי
const [drillDownState, setDrillDownState] = useState<{
  categoryCode?: number | string;
  month?: number;
  accountKey?: number;
}>({});

// פונקציות לניהול drill-down
const openAccountsDrillDown = (categoryCode: number | string, month: number) => {
  setDrillDownState({ categoryCode, month });
};

const openCounterAccountsDrillDown = (categoryCode: number | string, month: number, accountKey: number) => {
  setDrillDownState({ categoryCode, month, accountKey });
};

const closeDrillDown = () => {
  setDrillDownState({});
};
```

---

### **שלב 4: יצירת קומפוננט DrillDownModal** ⏱️ 20 דק'

**קובץ חדש:** `DrillDownModal.tsx`

```typescript
// src/components/reports/MonthlyReport/DrillDownModal.tsx

import React, { useMemo } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { Transaction } from '../../../types/reportTypes';
import _ from 'lodash';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categoryCode: number | string;
  categoryName: string;
  month: number;
  monthName: string;
  accountKey?: number;
  formatCurrency: (amount: number) => string;
  onSelectAccount?: (accountKey: number) => void;
  onShowTransactions?: (counterAccount: number) => void;
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categoryCode,
  categoryName,
  month,
  monthName,
  accountKey,
  formatCurrency,
  onSelectAccount,
  onShowTransactions
}) => {
  if (!isOpen) return null;

  // סינון תנועות לפי קוד מיון וחודש
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // בדיקת קוד מיון מיוחד
      if (categoryCode === 'income_site') {
        return tx.sortCode === 600 && tx.counterAccountNumber !== 37999 && tx.month === month;
      }
      if (categoryCode === 'income_superpharm') {
        return tx.sortCode === 600 && tx.counterAccountNumber === 37999 && tx.month === month;
      }
      return tx.sortCode === categoryCode && tx.month === month;
    });
  }, [transactions, categoryCode, month]);

  // רמה 2: קיבוץ לפי מפתח חשבון (אם לא נבחר חשבון)
  const accountsData = useMemo(() => {
    if (accountKey) return null;
    
    const grouped = _.groupBy(filteredTransactions, 'accountKey');
    return Object.entries(grouped).map(([key, txs]) => ({
      accountKey: parseInt(key),
      accountName: txs[0].accountName,
      amount: txs.reduce((sum, tx) => sum + tx.amount, 0),
      count: txs.length
    })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [filteredTransactions, accountKey]);

  // רמה 3: קיבוץ לפי ח-ן נגדי (אם נבחר חשבון)
  const counterAccountsData = useMemo(() => {
    if (!accountKey) return null;
    
    const accountTxs = filteredTransactions.filter(tx => tx.accountKey === accountKey);
    const grouped = _.groupBy(accountTxs, 'counterAccountNumber');
    
    return Object.entries(grouped).map(([key, txs]) => ({
      counterAccount: parseInt(key),
      counterAccountName: txs[0].counterAccountName,
      amount: txs.reduce((sum, tx) => sum + tx.amount, 0),
      count: txs.length
    })).sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  }, [filteredTransactions, accountKey]);

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const selectedAccountName = accountKey 
    ? filteredTransactions.find(tx => tx.accountKey === accountKey)?.accountName 
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* כותרת */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
          <div>
            <div className="flex items-center gap-2">
              {accountKey && (
                <button
                  onClick={() => onSelectAccount?.(0)}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="חזור לרשימת חשבונות"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="text-lg font-bold text-gray-800">
                {categoryName} - {monthName}
                {accountKey && ` > חשבון ${accountKey} - ${selectedAccountName}`}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {filteredTransactions.length} תנועות | סה"כ: {formatCurrency(totalAmount)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* תוכן */}
        <div className="p-4 overflow-auto max-h-[calc(90vh-120px)]">
          {/* רמה 2: רשימת חשבונות */}
          {accountsData && (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">מפתח חשבון</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">שם חשבון</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">מספר תנועות</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">סכום</th>
                </tr>
              </thead>
              <tbody>
                {accountsData.map(account => (
                  <tr 
                    key={account.accountKey}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => onSelectAccount?.(account.accountKey)}
                  >
                    <td className="border border-gray-300 px-4 py-2 font-medium text-blue-600">
                      {account.accountKey}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {account.accountName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-gray-600">
                      {account.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-left font-medium">
                      {formatCurrency(Math.abs(account.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 sticky bottom-0">
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right font-bold">
                    סה"כ:
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-left font-bold">
                    {formatCurrency(Math.abs(totalAmount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {/* רמה 3: רשימת ח-ן נגדי (ספקים) */}
          {counterAccountsData && (
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 sticky top-0">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">ח-ן נגדי</th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">שם</th>
                  <th className="border border-gray-300 px-4 py-2 text-center font-semibold">מספר תנועות</th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">סכום</th>
                </tr>
              </thead>
              <tbody>
                {counterAccountsData.map(counter => (
                  <tr 
                    key={counter.counterAccount}
                    className="hover:bg-purple-50 cursor-pointer transition-colors"
                    onClick={() => onShowTransactions?.(counter.counterAccount)}
                  >
                    <td className="border border-gray-300 px-4 py-2 font-medium text-purple-600">
                      {counter.counterAccount}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {counter.counterAccountName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-gray-600">
                      {counter.count}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-left font-medium">
                      {formatCurrency(Math.abs(counter.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 sticky bottom-0">
                <tr>
                  <td colSpan={3} className="border border-gray-300 px-4 py-2 text-right font-bold">
                    סה"כ:
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-left font-bold">
                    {formatCurrency(Math.abs(totalAmount))}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### **שלב 5: עדכון CategoryRow לתמיכה בלחיצה על חודש** ⏱️ 10 דק'

**קובץ:** `CategoryRow.tsx`

מצא את השורה שמציגה את הסכומים החודשיים (בערך שורה 30-40) והוסף `onClick`:

```typescript
{months.map(m => {
  // בדיקה אם זו החריגה - הכנסות מהאתר
  const isException = (
    (category.code === 'income_site' || category.code === 'income_superpharm') &&
    // כאן צריך לבדוק אם כל התנועות הן 40000+30000
    // נעשה את זה בצד הפונקציה
  );
  
  return (
    <td 
      key={m} 
      className={`border border-gray-300 px-3 py-2 text-center ${
        !isException ? 'hover:bg-blue-50 cursor-pointer' : ''
      } transition-colors`}
      onClick={(e) => {
        e.stopPropagation(); // למנוע הרחבת הקטגוריה
        onMonthClick(m); // תקרא לפונקציה שבודקת חריגה
      }}
    >
      {category.type === 'income'
        ? formatCurrency(category.data[m] || 0)
        : formatCurrency(Math.abs(category.data[m] || 0))
      }
    </td>
  );
})}
```

**גישה פשוטה יותר - הבדיקה תהיה בפונקציה handleMonthClick!**

```typescript
{months.map(m => (
  <td 
    key={m} 
    className="border border-gray-300 px-3 py-2 text-center hover:bg-blue-50 cursor-pointer transition-colors"
    onClick={(e) => {
      e.stopPropagation();
      onMonthClick(m); // הפונקציה תחליט אם לפתוח או לא
    }}
  >
    {category.type === 'income'
      ? formatCurrency(category.data[m] || 0)
      : formatCurrency(Math.abs(category.data[m] || 0))
    }
  </td>
))}
```

הוסף prop חדש:
```typescript
interface CategoryRowProps {
  // ... props קיימים
  onMonthClick: (month: number) => void;  // ← הוסף זה
}
```

---

### **שלב 6: חיבור DrillDownModal ל-index.tsx** ⏱️ 15 דק'

**קובץ:** `index.tsx`

#### 4.1 Import המודל החדש (שורה 30):
```typescript
import { DrillDownModal } from './DrillDownModal';
```

#### 4.2 הוסף פונקציות טיפול (אחרי state, שורה ~70):
```typescript
// פתיחת drill-down לחשבונות
const handleMonthClick = (category: CategoryData, month: number) => {
  // בדיקה אם זו החריגה (40000 + 30000) - הכנסות מהאתר
  if (category.code === 'income_site' || category.code === 'income_superpharm') {
    const allTxs = transactions.filter(tx => {
      if (category.code === 'income_site') {
        return tx.sortCode === 600 && tx.counterAccountNumber !== 37999;
      }
      return tx.sortCode === 600 && tx.counterAccountNumber === 37999;
    });
    
    // אם כולם חשבון 40000 עם ח-ן נגדי 30000 - לא עושים כלום!
    const isException = allTxs.every(tx => 
      tx.accountKey === 40000 && tx.counterAccountNumber === 30000
    );
    
    if (isException) {
      // ❌ לא עושים כלום - זה רכישות לקוחות, אין טעם להציג
      console.log('הכנסות מהאתר - אין drill-down');
      return;
    }
  }
  
  // מקרה רגיל - פתח drill down
  setDrillDownState({
    categoryCode: category.code,
    month
  });
};

// מעבר לרמת ספקים (ח-ן נגדי)
const handleAccountSelect = (accountKey: number) => {
  if (accountKey === 0) {
    // חזרה לרמת חשבונות
    setDrillDownState(prev => ({
      categoryCode: prev.categoryCode,
      month: prev.month
    }));
  } else {
    // מעבר לרמת ספקים
    setDrillDownState(prev => ({
      ...prev,
      accountKey
    }));
  }
};

// הצגת תנועות ספק מסוים
const handleShowCounterTransactions = (counterAccount: number) => {
  if (!drillDownState.categoryCode || !drillDownState.month || !drillDownState.accountKey) return;
  
  const category = monthlyData.categories.find(c => c.code === drillDownState.categoryCode);
  if (!category) return;
  
  // סינון תנועות
  let txs = transactions.filter(tx => {
    if (category.code === 'income_site') {
      return tx.sortCode === 600 && 
             tx.counterAccountNumber !== 37999 && 
             tx.month === drillDownState.month &&
             tx.accountKey === drillDownState.accountKey &&
             tx.counterAccountNumber === counterAccount;
    }
    if (category.code === 'income_superpharm') {
      return tx.sortCode === 600 && 
             tx.counterAccountNumber === 37999 && 
             tx.month === drillDownState.month &&
             tx.accountKey === drillDownState.accountKey &&
             tx.counterAccountNumber === counterAccount;
    }
    return tx.sortCode === category.code && 
           tx.month === drillDownState.month &&
           tx.accountKey === drillDownState.accountKey &&
           tx.counterAccountNumber === counterAccount;
  });
  
  const accountName = txs[0]?.accountName || '';
  const counterName = txs[0]?.counterAccountName || '';
  
  setBiurData({
    title: `${category.name} - ${MONTH_NAMES[drillDownState.month - 1]} - חשבון ${drillDownState.accountKey} (${accountName}) - ספק ${counterAccount} (${counterName})`,
    transactions: txs
  });
  setShowBiurModal(true);
};
```

#### 4.3 עדכן את CategoryRow בתוך ה-render (שורה ~450):
```typescript
<CategoryRow
  category={cat}
  months={monthlyData.months}
  isExpanded={expandedCategories.has(String(cat.code))}
  onToggle={() => toggleCategory(String(cat.code))}
  onShowBiur={(month) => handleShowBiur(cat, month)}
  onMonthClick={(month) => handleMonthClick(cat, month)} // ← הוסף זה
  formatCurrency={formatCurrency}
  bgColor="bg-orange-50"
/>
```

#### 4.4 הוסף את DrillDownModal לפני סגירת ה-div הראשי (שורה ~700):
```typescript
      {/* DrillDownModal */}
      <DrillDownModal
        isOpen={!!drillDownState.categoryCode}
        onClose={closeDrillDown}
        transactions={transactions}
        categoryCode={drillDownState.categoryCode || 0}
        categoryName={
          monthlyData.categories.find(c => c.code === drillDownState.categoryCode)?.name || ''
        }
        month={drillDownState.month || 1}
        monthName={MONTH_NAMES[(drillDownState.month || 1) - 1]}
        accountKey={drillDownState.accountKey}
        formatCurrency={formatCurrency}
        onSelectAccount={handleAccountSelect}
        onShowTransactions={handleShowCounterTransactions}
      />

      {/* BiurModal */}
      <BiurModal
        isOpen={showBiurModal}
        data={biurData}
        onClose={() => setShowBiurModal(false)}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};
```

---

## ✅ רשימת ביקורת סופית

### שלבי יישום:
- [ ] **שלב 1:** הוספת State לניהול drill-down (3 דק')
- [ ] **שלב 2:** יצירת DrillDownModal.tsx (20 דק')
- [ ] **שלב 3:** עדכון CategoryRow לתמיכה בלחיצה על חודש (10 דק')
- [ ] **שלב 4:** חיבור DrillDownModal ל-index.tsx (15 דק')

### בדיקות:
- [ ] לחיצה על חודש בשורת קוד מיון → פותח רשימת חשבונות
- [ ] לחיצה על חשבון → פותח רשימת ספקים (ח-ן נגדי)
- [ ] לחיצה על ספק → פותח BiurModal עם תנועות
- [ ] **החריגה "הכנסות מכירות - אתר"** → **לא קורה כלום בלחיצה** (console.log בלבד)
- [ ] צבעים נשמרים (שחור, ירוק, אפור בלבד)

---

## ⏱️ זמן משוער כולל: **50 דקות**

## 🎨 שמירה על העיצוב

**חובה לשמור:**
- ✅ צבע שחור לכל הסכומים
- ✅ סוגריים למספרים שליליים  
- ✅ ירוק רק לכותרות ראשיות
- ✅ אפור לרקעים וקווים
- ✅ כחול לחשבונות (מפתח חשבון)
- ✅ סגול לספקים (ח-ן נגדי)
- ✅ זהב רק לסיכומים ו-40000

---

## 📝 הערות חשובות

1. **גישת drill-down חודשי** - כל לחיצה על חודש פותחת חלון חדש
2. **לא ליצור קבצים רבים** - רק DrillDownModal.tsx אחד חדש
3. **חישוב רק לפי ת.אסמכ** - זה הקריטריון היחיד!
4. **החריגה 40000+30000** - ❌ **ללא כל אפשרות לחיצה** - זה רכישות לקוחות (16,845 תנועות!)
5. **3 רמות ביאור** - חשבונות → ספקים → תנועות
6. **עיצוב החריגה** - אפשר להשאיר hover effect כרגיל, הפונקציה פשוט לא תעשה כלום

---

**מוכן להתחיל? 🚀**