# 📋 תוכנית בדיקת עקביות - מעודכנת לפי הקוד הקיים

## 🎯 מטרה
השוואה אוטומטית בין טאב "ביאורים" (מתנועות) לטאב "יתרות מאזניות" (ממאזן בוחן)

---

## 📊 ניתוח הקוד הקיים

### ✅ מה כבר קיים ועובד:

#### 1. BiurimTab.tsx (שורה 97):
```typescript
const grandTotal = useMemo(() => {
  return filteredData.reduce((sum, codeGroup) => {
    const codeTotal = codeGroup.accounts.reduce((codeSum, account) => {
      return codeSum + account.total;
    }, 0);
    return sum + codeTotal;
  }, 0);
}, [filteredData]);
```
**סה"כ:** 570,168 ₪ (מהצילום)

#### 2. BalancesTab.tsx (שורה 81):
```typescript
const grandTotal = useMemo(() => {
  return filteredData.reduce((sum, code) => sum + code.total, 0);
}, [filteredData]);
```
**סה"כ:** 481,116 ₪ (מהצילום)

#### 3. BiurimSystem.tsx כבר מחשב:
- `dataByCode` (שורה 706) - מקובץ ביאורים
- `trialBalance` (state) - מקובץ מאזן בוחן
- `activeMonths` (שורה 688) - חודשים פעילים

---

## ⚠️ כללי אישור מעודכנים

| רמה | סף אישור | פעולה |
|-----|----------|-------|
| סה"כ כללי | עד 5 ₪ | ✅ תקין |
| קוד מיון | עד 5 ₪ | ✅ תקין |
| חשבון | עד 1 ₪ | ✅ תקין |
| חודש | **0 ₪ בדיוק!** | רק אם 0 - תקין |

**הפרש מעל הסף → בעיה שדורשת פירוט ❌**

---

## 🔧 מה צריך להוסיף ל-BiurimSystem.tsx

### 📍 מיקום 1: שורה 730 (אחרי dataByCode)

**הוסף state חדש:**
```typescript
const [showConsistencyCard, setShowConsistencyCard] = useState(false);
```

**הוסף useMemo חדש:**
```typescript
// ==========================================
// 🆕 בדיקת עקביות נתונים
// ==========================================
const consistencyCheck = useMemo(() => {
  // לוגיקת חישוב ההשוואה כאן
  // פירוט מלא בשלבים למטה
}, [dataByCode, trialBalance, activeMonths]);
```

---

### 📍 מיקום 2: שורה 825 (אחרי tab-content, לפני DataValidationModal)

**הוסף כרטיס חדש:**
```tsx
{/* 🆕 כרטיס בדיקת עקביות */}
{!loading && (
  <div style={{...}}>
    {/* התצוגה כאן */}
  </div>
)}
```

---

## 📝 שלבי הלוגיקה המדויקים

### שלב 1: חישוב סה"כ מביאורים

```typescript
const biurimGrandTotal = dataByCode.reduce((sum, code) => {
  const codeTotal = code.accounts.reduce((accSum, acc) => 
    accSum + acc.total, 0
  );
  return sum + codeTotal;
}, 0);
```

### שלב 2: חישוב סה"כ ממאזן בוחן

```typescript
const balanceGrandTotal = trialBalance.reduce((sum, record) => {
  const accountTotal = activeMonths.reduce((monthSum, month) => 
    monthSum + (record.months[month] || 0), 0
  );
  return sum + accountTotal;
}, 0);
```

### שלב 3: השוואה כללית

```typescript
const generalDiff = biurimGrandTotal - balanceGrandTotal;
const isGeneralMatch = Math.abs(generalDiff) <= 5;
```

### שלב 4: השוואה לפי קוד מיון (אם יש בעיה)

```typescript
if (!isGeneralMatch) {
  const codeIssues = dataByCode.map(code => {
    // סה"כ מביאורים לקוד זה
    const biurimCodeTotal = code.accounts.reduce(
      (sum, acc) => sum + acc.total, 0
    );
    
    // סה"כ ממאזן בוחן לקוד זה
    const balanceCodeTotal = trialBalance
      .filter(tb => tb.sortCode === parseInt(code.code))
      .reduce((sum, tb) => {
        const tbTotal = activeMonths.reduce(
          (mSum, m) => mSum + (tb.months[m] || 0), 0
        );
        return sum + tbTotal;
      }, 0);
    
    const codeDiff = biurimCodeTotal - balanceCodeTotal;
    
    return {
      code: code.code,
      name: code.name,
      biurimTotal: biurimCodeTotal,
      balanceTotal: balanceCodeTotal,
      diff: codeDiff,
      hasIssue: Math.abs(codeDiff) > 5
    };
  }).filter(c => c.hasIssue);
}
```

### שלב 5: השוואה לפי חשבון (לקודים בעייתיים)

```typescript
const accountIssues = [];

codeIssues.forEach(codeIssue => {
  const codeAccounts = dataByCode
    .find(c => c.code === codeIssue.code)?.accounts || [];
  
  codeAccounts.forEach(acc => {
    const biurimAccountTotal = acc.total;
    
    const balanceAccount = trialBalance.find(
      tb => tb.accountKey === acc.accountKey
    );
    
    const balanceAccountTotal = balanceAccount
      ? activeMonths.reduce(
          (sum, m) => sum + (balanceAccount.months[m] || 0), 0
        )
      : 0;
    
    const accountDiff = biurimAccountTotal - balanceAccountTotal;
    
    if (Math.abs(accountDiff) > 1) {
      accountIssues.push({
        code: codeIssue.code,
        codeName: codeIssue.name,
        accountKey: acc.accountKey,
        accountName: acc.accountName,
        biurimTotal: biurimAccountTotal,
        balanceTotal: balanceAccountTotal,
        diff: accountDiff
      });
    }
  });
});
```

### שלב 6: השוואה חודשית (לחשבונות בעייתיים)

```typescript
accountIssues.forEach(accIssue => {
  const monthlyIssues = [];
  
  const biurimAccount = dataByCode
    .find(c => c.code === accIssue.code)?.accounts
    .find(a => a.accountKey === accIssue.accountKey);
  
  const balanceAccount = trialBalance.find(
    tb => tb.accountKey === accIssue.accountKey
  );
  
  activeMonths.forEach(month => {
    // חישוב מביאורים לחודש זה
    const biurimMonthTotal = biurimAccount?.transactions
      .filter(tx => tx.month === month)
      .reduce((sum, tx) => sum + tx.amount, 0) || 0;
    
    // יתרה ממאזן בוחן
    const balanceMonthTotal = balanceAccount?.months[month] || 0;
    
    const monthDiff = biurimMonthTotal - balanceMonthTotal;
    
    // חייב להיות 0 מדויק!
    if (Math.abs(monthDiff) > 0.01) {
      monthlyIssues.push({
        month,
        biurimTotal: biurimMonthTotal,
        balanceTotal: balanceMonthTotal,
        diff: monthDiff
      });
    }
  });
  
  accIssue.monthlyIssues = monthlyIssues;
});
```

---

## 🎨 תצוגה בממשק

### כרטיס ראשי (תמיד נראה):

```tsx
<div style={{
  marginTop: '2rem',
  padding: '1rem',
  background: isGeneralMatch ? '#f0fdf4' : '#fef2f2',
  border: `2px solid ${isGeneralMatch ? '#10b981' : '#dc2626'}`,
  borderRadius: '8px',
  cursor: 'pointer'
}}
onClick={() => setShowConsistencyCard(!showConsistencyCard)}
>
  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
    <div>
      <h3 style={{ 
        fontSize: '18px', 
        fontWeight: 'bold',
        color: isGeneralMatch ? '#166534' : '#dc2626'
      }}>
        {isGeneralMatch ? '✅' : '❌'} בדיקת עקביות נתונים
      </h3>
      <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '0.5rem' }}>
        הפרש: {formatCurrency(generalDiff)}
      </div>
    </div>
    <div style={{ fontSize: '20px' }}>
      {showConsistencyCard ? '▼' : '◀'}
    </div>
  </div>
</div>
```

### פירוט מורחב (בלחיצה):

```tsx
{showConsistencyCard && (
  <div style={{ marginTop: '1rem', padding: '1rem', background: 'white' }}>
    
    {/* סיכום כללי */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>מביאורים</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
          {formatCurrency(biurimGrandTotal)}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>ממאזן בוחן</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
          {formatCurrency(balanceGrandTotal)}
        </div>
      </div>
    </div>

    {/* קודי מיון בעייתיים */}
    {codeIssues.length > 0 && (
      <div style={{ marginTop: '1.5rem' }}>
        <h4>📊 קודי מיון בעייתיים ({codeIssues.length})</h4>
        {codeIssues.map(code => (
          <div key={code.code} style={{ 
            padding: '0.75rem', 
            background: '#fef2f2',
            marginTop: '0.5rem',
            borderRadius: '6px'
          }}>
            <div style={{ fontWeight: 'bold' }}>
              {code.code} - {code.name}
            </div>
            <div style={{ fontSize: '14px', color: '#dc2626' }}>
              הפרש: {formatCurrency(code.diff)}
            </div>
          </div>
        ))}
      </div>
    )}

    {/* חשבונות בעייתיים */}
    {accountIssues.length > 0 && (
      <div style={{ marginTop: '1.5rem' }}>
        <h4>🔬 חשבונות בעייתיים ({accountIssues.length})</h4>
        {accountIssues.map(acc => (
          <div key={acc.accountKey} style={{ 
            padding: '0.75rem',
            background: '#fffbeb',
            marginTop: '0.5rem',
            borderRadius: '6px'
          }}>
            <div style={{ fontWeight: 'bold' }}>
              {acc.accountKey} - {acc.accountName}
            </div>
            <div style={{ fontSize: '14px' }}>
              קוד מיון: {acc.code} - {acc.codeName}
            </div>
            <div style={{ fontSize: '14px', color: '#dc2626' }}>
              הפרש: {formatCurrency(acc.diff)}
            </div>
            
            {/* פירוט חודשי */}
            {acc.monthlyIssues?.length > 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '13px' }}>
                <strong>חודשים בעייתיים:</strong>
                {acc.monthlyIssues.map(m => (
                  <div key={m.month}>
                    חודש {m.month}: הפרש {formatCurrency(m.diff)}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

---

## 📁 קבצים לעבודה

### ⚠️ קובץ יחיד לעדכן:
```
src/components/biurim/BiurimSystem.tsx
```

### 📋 קבצים לעיון (אין לשנות!):
```
src/components/biurim/BiurimTab.tsx (שורה 97 - grandTotal)
src/components/biurim/BalancesTab.tsx (שורה 81 - grandTotal)
```

---

## ⏱️ זמן ביצוע מעודכן

| שלב | זמן | הערה |
|-----|-----|------|
| גיבוי | 2 דק' | חובה! |
| הוספת state | 2 דק' | שורה 1 |
| לוגיקת חישוב | 25 דק' | useMemo מלא |
| תצוגה | 15 דק' | כרטיס + פירוט |
| בדיקה | 5 דק' | לוודא שלא נשבר |
| **סה"כ** | **49 דק'** | ~50 דקות |

---

## ✅ צ'קליסט ביצוע

### לפני התחלה:
- [ ] גיבוי של BiurimSystem.tsx
- [ ] פתח את 3 הקבצים בעורך
- [ ] הבן איפה grandTotal מחושב בכל טאב

### בזמן עבודה:
- [ ] הוסף state (שורה 1)
- [ ] הוסף useMemo (שורה ~70)
- [ ] הוסף כרטיס תצוגה (שורה ~20)
- [ ] אל תגע בקוד קיים!

### אחרי סיום:
- [ ] שמור (Ctrl+S)
- [ ] רענן דפדפן (F5)
- [ ] בדוק טאב ביאורים - עובד? ✅
- [ ] בדוק טאב יתרות - עובד? ✅
- [ ] בדוק כרטיס חדש - מופיע? ✅
- [ ] לחץ על הכרטיס - נפתח? ✅

---

## 🎯 תוצאה צפויה

### במצב תקין (הפרש ≤ 5 ₪):
```
✅ בדיקת עקביות נתונים
הפרש: 3 ₪
```

### במצב בעיה (הפרש > 5 ₪):
```
❌ בדיקת עקביות נתונים
הפרש: 89,052 ₪

[לחיצה מראה:]
📊 קודי מיון בעייתיים (4)
  • קוד 805 - שיווק: 56,825 ₪
  • קוד 806 - לוגיסטיקה: -17,262 ₪
  
🔬 חשבונות בעייתיים (2)
  • חשבון 80502: הפרש 56,825 ₪
    חודשים בעייתיים:
    - חודש מרץ: הפרש -5,000 ₪
```

---

---

## 🔄 שלב 7: עדכון טאב "השוואה למאזן בוחן"

### 📍 מיקום: ComparisonTab.tsx

**מטרה:** להפוך את הטאב למרוכז ומובן - מציג את כל הממצאים במקום אחד.

### ⚠️ הבעיה הנוכחית:
הטאב כנראה מציג טבלה פשוטה של השוואות, אבל לא נותן סיכום ברור של:
- מה תקין בדיוק?
- מה לא תקין?
- היכן הבעיות?
- כמה חמורה כל בעיה?

### ✅ המבנה החדש שנבנה:

```
┌─────────────────────────────────────────────┐
│ 🔍 טאב: השוואה למאזן בוחן                │
├─────────────────────────────────────────────┤
│                                             │
│ [1] סיכום כללי                             │
│ ┌─────────────────────────────────┐         │
│ │ ✅ תקין / ❌ נמצאו הפרשים      │         │
│ │ סה"כ מביאורים: 570,168 ₪       │         │
│ │ סה"כ ממאזן: 481,116 ₪          │         │
│ │ הפרש: 89,052 ₪                 │         │
│ └─────────────────────────────────┘         │
│                                             │
│ [2] ממצאים לפי רמת חומרה                   │
│ ┌─────────────────────────────────┐         │
│ │ 🔴 חמור (>1,000): 4 ממצאים     │         │
│ │ 🟡 בינוני (100-1,000): 2        │         │
│ │ 🟢 קל (<100): 0                 │         │
│ └─────────────────────────────────┘         │
│                                             │
│ [3] פירוט בעיות - קודי מיון                │
│ ▼ קוד 805 - שיווק (56,825 ₪) 🔴           │
│   ├─ חשבון 80502: 56,825 ₪               │
│   │  └─ חודש מרץ: חסר 56,825 ₪           │
│   │     במאזן בוחן                        │
│                                             │
│ ▼ קוד 806 - לוגיסטיקה (-17,262 ₪) 🔴      │
│   ├─ חשבון 80603: -17,262 ₪              │
│   │  └─ חודש אפריל: עודף 17,262 ₪        │
│   │     במאזן בוחן                        │
│                                             │
│ [4] טבלת השוואה מפורטת                     │
│ (רק אם המשתמש לוחץ "הצג פירוט מלא")       │
│                                             │
└─────────────────────────────────────────────┘
```

### 🎨 עיצוב התצוגה:

#### א. כרטיס סיכום כללי (תמיד למעלה):
```tsx
<div style={{
  background: isMatch ? '#f0fdf4' : '#fef2f2',
  border: `3px solid ${isMatch ? '#10b981' : '#dc2626'}`,
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem'
}}>
  <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '1rem' }}>
    {isMatch ? '✅ הנתונים תואמים!' : '❌ נמצאו הפרשים'}
  </div>
  
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>מביאורים</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {formatCurrency(biurimTotal)}
      </div>
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>ממאזן בוחן</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {formatCurrency(balanceTotal)}
      </div>
    </div>
    <div>
      <div style={{ fontSize: '12px', color: '#6b7280' }}>הפרש</div>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: 'bold',
        color: isMatch ? '#10b981' : '#dc2626'
      }}>
        {formatCurrency(totalDiff)}
      </div>
    </div>
  </div>
</div>
```

#### ב. כרטיס רמת חומרה:
```tsx
<div style={{
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '1rem',
  marginBottom: '1.5rem'
}}>
  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1rem' }}>
    📊 ממצאים לפי רמת חומרה
  </h3>
  
  <div style={{ display: 'flex', gap: '2rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '24px' }}>🔴</span>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>חמור (&gt;1,000 ₪)</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{severeCount}</div>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '24px' }}>🟡</span>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>בינוני (100-1,000 ₪)</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{moderateCount}</div>
      </div>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <span style={{ fontSize: '24px' }}>🟢</span>
      <div>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>קל (&lt;100 ₪)</div>
        <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{minorCount}</div>
      </div>
    </div>
  </div>
</div>
```

#### ג. רשימת בעיות מפורטת:
```tsx
<div style={{ marginBottom: '1.5rem' }}>
  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '1rem' }}>
    🔬 פירוט הפרשים
  </h3>
  
  {issues.map(issue => {
    const severity = Math.abs(issue.diff) > 1000 ? 'severe' :
                     Math.abs(issue.diff) > 100 ? 'moderate' : 'minor';
    const icon = severity === 'severe' ? '🔴' :
                 severity === 'moderate' ? '🟡' : '🟢';
    
    return (
      <div key={issue.id} style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        marginBottom: '0.75rem',
        overflow: 'hidden'
      }}>
        {/* כותרת קוד מיון */}
        <div style={{
          background: '#f9fafb',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          cursor: 'pointer'
        }}
        onClick={() => toggleIssue(issue.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                קוד {issue.code} - {issue.name}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {issue.accountsCount} חשבונות בעייתיים
              </div>
            </div>
          </div>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '18px',
            color: '#dc2626'
          }}>
            {formatCurrency(issue.diff)}
          </div>
        </div>
        
        {/* פירוט חשבונות (בלחיצה) */}
        {expandedIssues.has(issue.id) && (
          <div style={{ padding: '1rem', background: '#fff' }}>
            {issue.accounts.map(acc => (
              <div key={acc.accountKey} style={{
                padding: '0.75rem',
                background: '#fffbeb',
                borderRadius: '6px',
                marginBottom: '0.5rem'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  חשבון {acc.accountKey} - {acc.accountName}
                </div>
                <div style={{ fontSize: '14px', marginBottom: '0.25rem' }}>
                  מביאורים: {formatCurrency(acc.biurimTotal)} | 
                  ממאזן: {formatCurrency(acc.balanceTotal)}
                </div>
                <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '600' }}>
                  הפרש: {formatCurrency(acc.diff)}
                </div>
                
                {/* פירוט חודשי */}
                {acc.monthlyIssues?.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      📅 חודשים בעייתיים:
                    </div>
                    {acc.monthlyIssues.map(m => (
                      <div key={m.month} style={{ 
                        fontSize: '13px',
                        padding: '0.25rem 0'
                      }}>
                        • חודש {MONTH_NAMES[m.month - 1]}: 
                        {m.diff > 0 ? ' חסר ' : ' עודף '}
                        {formatCurrency(Math.abs(m.diff))} במאזן בוחן
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  })}
</div>
```

#### ד. כפתור לטבלה מפורטת (אופציונלי):
```tsx
<button
  onClick={() => setShowDetailedTable(!showDetailedTable)}
  style={{
    padding: '0.75rem 1.5rem',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '1rem'
  }}
>
  {showDetailedTable ? '📊 הסתר טבלה מפורטת' : '📊 הצג טבלה מפורטת'}
</button>

{showDetailedTable && (
  <div style={{ overflowX: 'auto' }}>
    <table>
      {/* הטבלה הקיימת כאן */}
    </table>
  </div>
)}
```

---

### 📋 תוכנית עבודה לעדכון ComparisonTab

#### שלב 1: גיבוי (2 דקות)
```
גיבוי: ComparisonTab.tsx → ComparisonTab.tsx.backup
```

#### שלב 2: הוספת state (5 דקות)
```typescript
const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
const [showDetailedTable, setShowDetailedTable] = useState(false);
```

#### שלב 3: חישוב הממצאים (20 דקות)
- חישוב סה"כ מביאורים VS מאזן
- זיהוי הפרשים לפי קוד מיון
- זיהוי הפרשים לפי חשבון
- זיהוי הפרשים לפי חודש
- סיווג לפי רמת חומרה

#### שלב 4: בניית התצוגה החדשה (25 דקות)
- כרטיס סיכום כללי
- כרטיס רמת חומרה
- רשימת בעיות מפורטת
- העברת הטבלה הקיימת לאופציונלי

#### שלב 5: בדיקה (5 דקות)
- וידוא תצוגה תקינה
- וידוא שכל הנתונים נכונים
- וידוא שלא נשבר דבר אחר

**סה"כ זמן:** 57 דקות

---

## 📊 סיכום מעודכן - 2 שלבי עבודה

### שלב א': BiurimSystem.tsx (49 דקות)
- כרטיס בדיקת עקביות למטה
- לא חובה - אפשר לדלג

### שלב ב': ComparisonTab.tsx (57 דקות) ⭐ עדיפות גבוהה!
- **זה השינוי החשוב יותר**
- הופך את הטאב למרכז מידע ברור
- מציג הכל במקום אחד
- הבנה מיידית ללא מעבר בין טאבים

---

## ✅ מה לעשות קודם?

**אופציה 1:** רק ComparisonTab (57 דקות)
- השינוי החשוב והשימושי ביותר
- מרכז את כל המידע במקום אחד

**אופציה 2:** גם BiurimSystem וגם ComparisonTab (106 דקות)
- שני כרטיסי השוואה במקומות שונים
- יותר מקיף

**מה תעדיף?** 🎯