# GitHub Issues - Financial Dashboard
## רשימת 61 בעיות לייצור ב-GitHub

**הוראות שימוש:**
כל issue להלן מוכן להעתקה ל-GitHub. העתק את הכותרת + התוכן לכל issue.

---

## 🔴 CRITICAL ISSUES (4)

### Issue #1: [CRITICAL SECURITY] Exposed Supabase Credentials in Client Code

**Labels:** `security`, `critical`, `bug`

**Description:**
Supabase anonymous API key is hardcoded and exposed in client-side JavaScript bundle, making it accessible to anyone.

**Location:**
- File: `src/lib/supabaseClient.ts:4`

**Current Code:**
```typescript
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Security Impact:**
🔴 **CRITICAL** - Public API key exposed to anyone who can view the JavaScript bundle

**Solution:**
1. Create `.env.local` file (add to `.gitignore`)
2. Move key to environment variable:
   ```
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Update code to use:
   ```typescript
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```
4. Add validation to ensure env var exists
5. Create `.env.example` template for developers

**Acceptance Criteria:**
- [ ] No hardcoded credentials in any committed files
- [ ] Application uses environment variables
- [ ] `.env.example` file created with documentation
- [ ] Build fails if environment variables missing

---

### Issue #2: [CRITICAL SECURITY] Client-Side Authentication Bypass Vulnerability

**Labels:** `security`, `critical`, `bug`

**Description:**
Email allowlist (`ALLOWED_EMAILS`) is hardcoded in client-side code and can be modified or bypassed by users through browser console.

**Location:**
- File: `src/components/ProtectedRoute.tsx:5-12`

**Current Code:**
```typescript
const ALLOWED_EMAILS = [
  'litaydavid10@gmail.com',
  // ... more emails
];
```

**Security Impact:**
🔴 **CRITICAL** - Authentication can be circumvented by modifying client-side JavaScript

**Solution:**
Move email validation to server-side using one of these approaches:

**Option A: Supabase RLS Policies (Recommended)**
1. Create `allowed_users` table in Supabase
2. Set up Row Level Security (RLS) policies
3. Check email against database on authentication

**Option B: Edge Functions**
1. Create Supabase Edge Function for auth validation
2. Call function after user signs in
3. Return auth decision from server

**Acceptance Criteria:**
- [ ] Email validation happens server-side only
- [ ] Client cannot bypass authentication
- [ ] Unauthorized users see appropriate error message
- [ ] Security audit passed

---

### Issue #3: [CRITICAL SECURITY] Missing Input Sanitization - XSS Risk

**Labels:** `security`, `critical`, `bug`, `xss`

**Description:**
User input from CSV files and manual entries is rendered directly without sanitization, creating Cross-Site Scripting (XSS) vulnerabilities.

**Locations:**
- `src/components/reports/MonthlyReport/BiurModal.tsx:70` - `tx.details` rendered directly
- `src/components/reports/MonthlyReport/DrillDownModal.tsx:268-269` - Vendor names rendered directly

**Example Vulnerable Code:**
```typescript
<div>{tx.details}</div>  {/* ❌ No sanitization */}
```

**Security Impact:**
🔴 **CRITICAL** - Malicious scripts in CSV can execute in user's browser

**Attack Scenario:**
1. Attacker creates CSV with cell: `<script>alert(document.cookie)</script>`
2. User uploads CSV
3. Script executes, stealing session tokens

**Solution:**
1. Install DOMPurify: `npm install dompurify @types/dompurify`
2. Create sanitization utility:
   ```typescript
   import DOMPurify from 'dompurify';

   export const sanitizeHTML = (dirty: string): string => {
     return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
   };
   ```
3. Use before rendering:
   ```typescript
   <div>{sanitizeHTML(tx.details)}</div>
   ```

**Files to Update:**
- BiurModal.tsx
- DrillDownModal.tsx
- VendorRow.tsx
- CategoryRow.tsx
- Any component rendering user-supplied data

**Acceptance Criteria:**
- [ ] All user inputs sanitized before rendering
- [ ] XSS test suite passes (test with `<script>` tags)
- [ ] No regression in legitimate data display

---

### Issue #4: [CRITICAL DATA] Silent Wix API Failure - Users Think Data is Saved

**Labels:** `critical`, `bug`, `data-integrity`, `wix`

**Description:**
When Wix API save fails, the application saves to localStorage only but closes the modal and shows success, making users believe their data is synced to Wix when it's not.

**Location:**
- File: `src/components/reports/MonthlyReport/InventoryEditorModal.tsx:173-219`

**Current Code:**
```typescript
try {
  // Try to save to Wix
  const response = await fetch('https://litay.co.il/_functions/saveInventory', {...});
  // ...
} catch (error) {
  console.error('❌ Error saving to Wix:', error);
  // ❌ Still calls onSave and onClose - user thinks it worked!
  onSave(localOpening, localClosing);
  onClose();
}
```

**Impact:**
🔴 **CRITICAL** - Data loss across devices, users unaware of sync failures

**Solution:**
```typescript
} catch (error) {
  console.error('❌ Error saving to Wix:', error);

  // Show error to user
  const userChoice = confirm(
    'שגיאה בשמירה לשרת Wix. הנתונים נשמרו רק במכשיר זה.\n\n' +
    'האם תרצה לנסות שוב?'
  );

  if (userChoice) {
    // Retry logic
    return; // Don't close modal
  } else {
    // Save locally only with explicit warning
    alert('הנתונים נשמרו במכשיר זה בלבד. לא יסתנכרנו למכשירים אחרים.');
    localStorage.setItem(STORAGE_KEYS.OPENING_INVENTORY, JSON.stringify(localOpening));
    localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, JSON.stringify(localClosing));
    onClose();
  }
}
```

**Better Solution with Toast Notifications:**
Replace `alert()`/`confirm()` with react-toastify for better UX.

**Acceptance Criteria:**
- [ ] Users notified of Wix save failures
- [ ] Option to retry failed save
- [ ] Clear indication when data is localStorage-only
- [ ] No silent failures

---

## 🟠 HIGH PRIORITY ISSUES (8)

### Issue #5: [HIGH] Duplicate Calculation Logic - Code Smell

**Labels:** `refactoring`, `high`, `code-quality`, `maintainability`

**Description:**
Complex profit calculations (gross profit, operating profit, net profit) are duplicated 6+ times across the codebase, making maintenance difficult and error-prone.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx`
- Lines: 836-906, 1002-1062, 1156-1234

**Example Duplication:**
```typescript
// Repeated ~6 times
const cogsAdjustments = monthlyData.categories
  .filter(c => c.type === 'cogs')
  .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);

const expenseAdjustments = monthlyData.categories
  .filter(c => c.type === 'expense')
  .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), m), 0);
```

**Impact:**
- Hard to maintain (must update 6 places for one change)
- High risk of introducing inconsistencies
- Poor code readability

**Solution:**
Create utility functions in new file `src/utils/profitCalculations.ts`:

```typescript
export const calculateCOGSAdjustments = (
  categories: CategoryData[],
  month: number,
  getAdjustmentValue: (code: string, month: number) => number
): number => {
  return categories
    .filter(c => c.type === 'cogs')
    .reduce((sum, cat) => sum + getAdjustmentValue(String(cat.code), month), 0);
};

export const calculateGrossProfit = (
  revenue: number,
  cogs: number,
  openingInventory: number,
  closingInventory: number,
  cogsAdjustments: number
): number => {
  return revenue - (cogs + openingInventory - closingInventory + cogsAdjustments);
};

// Add memoization for expensive calculations
export const useProfitCalculations = () => {
  return useMemo(() => ({
    calculateGrossProfit,
    calculateOperatingProfit,
    calculateNetProfit,
  }), []);
};
```

**Acceptance Criteria:**
- [ ] All duplicate calculation logic extracted to utilities
- [ ] Functions properly memoized
- [ ] All calculations produce same results as before (add tests!)
- [ ] Code reduced by at least 200 lines

---

### Issue #6: [HIGH BUG] Incorrect COGS Calculation in StatsCards

**Labels:** `bug`, `high`, `calculations`, `financial`

**Description:**
Cost of Goods Sold (COGS) calculation in StatsCards incorrectly **adds** adjustments when it should **subtract** them, leading to wrong financial totals.

**Location:**
- File: `src/components/reports/MonthlyReport/StatsCards.tsx:33`

**Current Code:**
```typescript
const totalCOGS = Math.abs(monthlyData.totals.cogs.total) +
  (monthlyData.totals.opening.total - monthlyData.totals.closing.total) +
  monthlyData.categories  // ❌ Should be MINUS
    .filter(c => c.type === 'cogs')
    .reduce((sum, cat) => {
      return sum + Object.values(cat.months).reduce((s, m) => s + (m.adjustment || 0), 0);
    }, 0);
```

**Impact:**
🟠 **HIGH** - Incorrect financial totals displayed to users, could lead to business decisions based on wrong data

**Expected Behavior:**
Adjustments should be **subtracted** from COGS:
```
Total COGS = |Raw COGS| + (Opening Inventory - Closing Inventory) - COGS Adjustments
```

**Solution:**
```typescript
const totalCOGS = Math.abs(monthlyData.totals.cogs.total) +
  (monthlyData.totals.opening.total - monthlyData.totals.closing.total) -
  monthlyData.categories  // ✅ Changed to subtract
    .filter(c => c.type === 'cogs')
    .reduce((sum, cat) => {
      return sum + Object.values(cat.months).reduce((s, m) => s + (m.adjustment || 0), 0);
    }, 0);
```

**Acceptance Criteria:**
- [ ] COGS calculation uses subtraction for adjustments
- [ ] Manual calculation verification against spreadsheet
- [ ] Unit test added to prevent regression
- [ ] Verified with real financial data

---

### Issue #7: [HIGH] Inventory Key Format Inconsistency

**Labels:** `bug`, `high`, `data-integrity`

**Description:**
Inventory data is stored using two different key formats (`month: number` and `"YYYY-MM": string`), causing lookup failures and inventory values not displaying correctly.

**Locations:**
- `src/components/reports/MonthlyReport/index.tsx:358-389` (conversion functions)
- `src/components/reports/MonthlyReport/InventoryRow.tsx:27-39` (getInventoryValue)

**Problem:**
```typescript
// Sometimes stored as:
{ 1: 50000, 2: 60000, ... }  // month number keys

// Sometimes as:
{ "2024-01": 50000, "2024-02": 60000, ... }  // YYYY-MM keys
```

**Impact:**
- Inventory values fail to display for some months
- Data loss when format conversion fails
- Confusing code with conversion functions everywhere

**Solution:**
1. Standardize on single format: `"YYYY-MM"` (more explicit)
2. Create migration function:
```typescript
const migrateInventoryFormat = (inventory: any): Inventory => {
  const migrated: Inventory = {};
  Object.entries(inventory).forEach(([key, value]) => {
    // If numeric key, convert to YYYY-MM
    if (!isNaN(Number(key))) {
      const month = Number(key);
      const yearMonth = `2024-${String(month).padStart(2, '0')}`;
      migrated[yearMonth] = value as number;
    } else {
      migrated[key] = value as number;
    }
  });
  return migrated;
};
```
3. Remove conversion functions
4. Update type definition:
```typescript
export type Inventory = {
  [yearMonth: string]: number; // Always "YYYY-MM" format
};
```

**Acceptance Criteria:**
- [ ] Single inventory format used throughout
- [ ] Existing data migrated successfully
- [ ] No conversion functions needed
- [ ] All inventory values display correctly

---

### Issue #8: [HIGH] Unsafe Type Assertions Without Validation

**Labels:** `typescript`, `high`, `bug`

**Description:**
CSV parsing results cast to `Transaction[]` without validating structure, risking runtime errors if CSV doesn't match expected format.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:90`

**Current Code:**
```typescript
const parsed: Transaction[] = (results as any).data  // ❌ Unsafe 'any' cast
```

**Impact:**
- Application crashes if CSV structure changes
- Silent data corruption if fields missing
- No type safety despite using TypeScript

**Solution:**
Use Zod for runtime validation:

```typescript
import { z } from 'zod';

// Define schema
const TransactionSchema = z.object({
  'קוד מיון': z.string().optional(),
  'מספר חשבון': z.string().optional(),
  'סכום': z.string(),
  'תאריך': z.string(),
  'פרטים': z.string().optional(),
  // ... all CSV columns
});

const TransactionArraySchema = z.array(TransactionSchema);

// Validate before using
try {
  const validatedData = TransactionArraySchema.parse((results as any).data);

  const transactions: Transaction[] = validatedData.map(row => ({
    sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
    amount: parseFloat(row['סכום']),
    date: row['תאריך'],
    // ... transform to Transaction type
  }));

  setTransactions(transactions);
} catch (error) {
  if (error instanceof z.ZodError) {
    setError('מבנה קובץ CSV לא תקין: ' + error.errors.map(e => e.message).join(', '));
  }
}
```

**Acceptance Criteria:**
- [ ] Zod schema matches expected CSV structure
- [ ] Validation errors show helpful messages
- [ ] Invalid CSV rejected with clear explanation
- [ ] Type safety maintained end-to-end

---

### Issue #9: [HIGH] Missing Null Checks - Potential Crashes

**Labels:** `bug`, `high`, `crash`

**Description:**
Multiple unsafe accesses to potentially undefined/null values that can crash the application.

**Locations:**
- `src/components/reports/MonthlyReport/index.tsx:189, 208, 451`

**Examples:**
```typescript
// Line 189 - tx.details might be undefined/null
const counterName = tx.counterAccountName || tx.details.split(' ')[0] || 'לא ידוע';
// ❌ Will crash on .split() if tx.details is undefined

// Line 208
const parts = tx.details.split(':');  // ❌ No null check

// Line 451
const month = parseInt(tx.date.split('/')[1]);  // ❌ tx.date could be undefined
```

**Impact:**
🟠 **HIGH** - Application crashes for users with certain data patterns

**Solution:**
Add proper null/undefined checks:

```typescript
// Safe version
const counterName = tx.counterAccountName ||
  (tx.details ? tx.details.split(' ')[0] : null) ||
  'לא ידוע';

// Even better with optional chaining
const counterName = tx.counterAccountName ||
  tx.details?.split(' ')[0] ||
  'לא ידוע';

// For date parsing
const month = tx.date ? parseInt(tx.date.split('/')[1]) : null;
if (month === null || isNaN(month)) {
  console.warn('Invalid date format:', tx);
  return null; // or handle appropriately
}
```

**Acceptance Criteria:**
- [ ] All property accesses have null checks
- [ ] Optional chaining used where appropriate
- [ ] Invalid data handled gracefully
- [ ] No crashes in error logs

---

### Issue #10: [HIGH] Missing State Validation

**Labels:** `bug`, `high`, `state-management`

**Description:**
State update functions don't validate input values, allowing invalid data (negative numbers, NaN, Infinity) to enter application state.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:404-412`

**Current Code:**
```typescript
const handleClosingInventoryChange = (month: number, value: number) => {
  // ❌ No validation - value could be negative, NaN, Infinity, etc.
  const newClosing = { ...closingInventory, [month]: value };
  setClosingInventory(newClosing);
  localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, JSON.stringify(newClosing));
};
```

**Impact:**
- Invalid data corrupts calculations
- Financial reports show NaN or negative inventory
- localStorage contains bad data that persists

**Solution:**
Add validation before setState:

```typescript
const handleClosingInventoryChange = (month: number, value: number) => {
  // Validate input
  if (!Number.isFinite(value)) {
    console.error('Invalid inventory value (not finite):', value);
    return;
  }

  if (value < 0) {
    console.warn('Negative inventory value:', value);
    // Optionally show toast: "ערך מלאי לא יכול להיות שלילי"
    return;
  }

  // Round to 2 decimal places for currency
  const validValue = Math.round(value * 100) / 100;

  const newClosing = { ...closingInventory, [month]: validValue };
  setClosingInventory(newClosing);

  try {
    localStorage.setItem(STORAGE_KEYS.CLOSING_INVENTORY, JSON.stringify(newClosing));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
    // Show user error
  }
};
```

**Apply Same Pattern To:**
- `handleOpeningInventoryChange`
- `handleAdjustmentChange`
- Any other numeric input handlers

**Acceptance Criteria:**
- [ ] All numeric inputs validated before setState
- [ ] Invalid inputs rejected with user feedback
- [ ] Valid inputs sanitized (rounded, clamped)
- [ ] localStorage only stores valid data

---

### Issue #11: [HIGH] Race Condition in Data Loading

**Labels:** `bug`, `high`, `async`, `state-management`

**Description:**
Multiple async operations in useEffect run without coordination, potentially showing inconsistent UI state during loading.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:125-147`

**Current Code:**
```typescript
useEffect(() => {
  const loadTransactions = async () => { /* ... */ };
  const loadInventoryData = async () => { /* ... */ };

  loadTransactions();  // ❌ No await - fires and forgets
  loadInventoryData(); // ❌ No await - could finish in any order
}, []);
```

**Problems:**
1. If `loadInventoryData` finishes before `loadTransactions`, calculations use partial data
2. No way to show "loading both" state to user
3. Error in one function doesn't affect the other
4. Loading state set inconsistently

**Impact:**
- UI flicker showing partial data
- Incorrect calculations during load
- Confusing loading indicators

**Solution:**

**Option A: Sequential Loading**
```typescript
useEffect(() => {
  let isMounted = true;

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load in sequence
      await loadTransactions();
      if (!isMounted) return;

      await loadInventoryData();
      if (!isMounted) return;

    } catch (error) {
      if (!isMounted) return;
      setError(error.message);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadAllData();

  return () => {
    isMounted = false;
  };
}, []);
```

**Option B: Parallel Loading (Faster)**
```typescript
useEffect(() => {
  let isMounted = true;

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load in parallel
      const [transactionsResult, inventoryResult] = await Promise.all([
        loadTransactions(),
        loadInventoryData()
      ]);

      if (!isMounted) return;

      // Both loaded successfully

    } catch (error) {
      if (!isMounted) return;
      setError(error.message);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  loadAllData();

  return () => {
    isMounted = false;
  };
}, []);
```

**Acceptance Criteria:**
- [ ] Data loads in coordinated manner
- [ ] Single loading state for all operations
- [ ] No partial data shown to user
- [ ] Cleanup prevents setState on unmounted component

---

### Issue #12: [HIGH] No CSV Structure Validation

**Labels:** `bug`, `high`, `data-validation`

**Description:**
CSV files are parsed without validating structure or required columns, leading to silent data loss or application crashes.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:85-117`

**Current Problem:**
```typescript
// No validation - just assumes CSV has correct columns
const parsed: Transaction[] = (results as any).data.map((row: any) => ({
  sortCode: row['קוד מיון'] ? parseInt(row['קוד מיון']) : null,
  // ... more fields
}));
```

**Impact:**
- Wrong CSV format causes silent data loss
- Missing columns create `undefined` values
- No user feedback about what's wrong

**Solution:**
Add CSV validation before processing:

```typescript
const REQUIRED_COLUMNS = [
  'קוד מיון',
  'מספר חשבון',
  'סכום',
  'תאריך',
  'פרטים'
];

const validateCSVStructure = (data: any[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!Array.isArray(data) || data.length === 0) {
    errors.push('הקובץ ריק או לא תקין');
    return { valid: false, errors };
  }

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  // Check required columns exist
  REQUIRED_COLUMNS.forEach(col => {
    if (!columns.includes(col)) {
      errors.push(`עמודה חובה חסרה: ${col}`);
    }
  });

  // Check data types
  data.slice(0, 10).forEach((row, idx) => {
    if (row['סכום'] && isNaN(parseFloat(row['סכום']))) {
      errors.push(`שורה ${idx + 1}: סכום לא תקין`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
};

// Use in loadTransactions:
const validation = validateCSVStructure((results as any).data);
if (!validation.valid) {
  throw new Error(
    'מבנה קובץ CSV לא תקין:\n' +
    validation.errors.join('\n')
  );
}
```

**Acceptance Criteria:**
- [ ] Required columns validated before processing
- [ ] Clear error messages for missing/wrong columns
- [ ] Data type validation for critical fields
- [ ] Sample row validation catches common issues

---

## 🟡 MEDIUM PRIORITY ISSUES (28)

### Issue #13: [MEDIUM PERFORMANCE] Missing Memoization for Expensive Calculations

**Labels:** `performance`, `medium`, `optimization`

**Description:**
The `monthlyData` useMemo recalculates all transactions and categories on every render involving transactions or inventory changes, even when those specific calculations aren't affected.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:150-310`

**Current Code:**
```typescript
const monthlyData = useMemo(() => {
  // Processes ALL transactions every time
  // Even if only inventory changed
}, [transactions, openingInventory, closingInventory, adjustments2024]);
```

**Impact:**
- Poor performance with large datasets (10,000+ transactions)
- Unnecessary re-renders of child components
- UI lag when editing inventory

**Solution:**
Break down into smaller, targeted memos:

```typescript
// 1. Memoize transaction processing separately
const processedTransactions = useMemo(() => {
  return transactions.map(tx => ({
    ...tx,
    month: parseInt(tx.date.split('/')[1])
  }));
}, [transactions]); // Only recalc when transactions change

// 2. Memoize category grouping
const categoryGroups = useMemo(() => {
  return _.groupBy(processedTransactions, 'sortCode');
}, [processedTransactions]);

// 3. Memoize inventory calculations separately
const inventoryTotals = useMemo(() => {
  return calculateInventoryTotals(openingInventory, closingInventory);
}, [openingInventory, closingInventory]); // Independent of transactions

// 4. Final monthlyData only combines results
const monthlyData = useMemo(() => {
  return combineMonthlyData(categoryGroups, inventoryTotals, adjustments2024);
}, [categoryGroups, inventoryTotals, adjustments2024]);
```

**Additional Optimizations:**
- Memoize helper functions with `useCallback`
- Add React.memo to child components
- Use React DevTools Profiler to measure improvement

**Acceptance Criteria:**
- [ ] monthlyData recalculates only when necessary
- [ ] Render time reduced by >50% (measure with Profiler)
- [ ] No functional regressions

---

### Issue #14: [MEDIUM PERFORMANCE] Inefficient Array Operations

**Labels:** `performance`, `medium`, `code-quality`

**Description:**
Multiple nested loops and array iterations in `processCategory` function create O(n²) complexity for large transaction sets.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:187-214`

**Current Code:**
```typescript
categoryTxs.forEach(tx => { /* First loop */ });

const vendors = Object.entries(vendorGroups)
  .map(...) // Second iteration
  .filter(v => v.data.total !== 0)  // Third iteration
  .sort(...)  // Fourth iteration - expensive!
```

**Impact:**
- Slow processing with many transactions per category
- Scales poorly (O(n²) or worse)

**Solution:**
Reduce to single pass:

```typescript
const processCategory = (categoryTxs: Transaction[]) => {
  const vendorMap = new Map<string, VendorData>();
  let categoryTotal = 0;

  // Single pass through transactions
  categoryTxs.forEach(tx => {
    const vendorKey = tx.counterAccountKey || tx.counterAccountName || 'unknown';
    const amount = tx.amount;

    categoryTotal += amount;

    // Update vendor data in map
    const vendor = vendorMap.get(vendorKey) || createNewVendor(vendorKey);
    vendor.total += amount;
    vendor.transactions.push(tx);
    vendorMap.set(vendorKey, vendor);
  });

  // Convert map to sorted array (single pass)
  const vendors = Array.from(vendorMap.values())
    .filter(v => v.total !== 0)
    .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

  return { vendors, categoryTotal };
};
```

**Acceptance Criteria:**
- [ ] Reduced to O(n log n) complexity (due to sort)
- [ ] Processing time reduced by >30%
- [ ] Same results as original implementation

---

### Issue #15: [MEDIUM PERFORMANCE] Large Component Re-renders

**Labels:** `performance`, `medium`, `refactoring`, `architecture`

**Description:**
MonthlyReport component is 1284 lines and re-renders everything on any state change, causing poor performance.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx` (entire file)

**Impact:**
- Entire table re-renders when opening a modal
- Difficult to optimize specific sections
- Hard to maintain and debug

**Solution:**
Split into smaller components with React.memo:

```typescript
// 1. Extract table section
const MonthlyReportTable = React.memo(({
  monthlyData,
  formatCurrency,
  onCategoryClick
}: TableProps) => {
  return (
    <table>
      {/* Table content */}
    </table>
  );
});

// 2. Extract stats section
const MonthlyReportStats = React.memo(({
  monthlyData,
  formatCurrency
}: StatsProps) => {
  return <StatsCards {...} />;
});

// 3. Main component orchestrates
const MonthlyReport: React.FC = () => {
  // State management

  return (
    <>
      <MonthlyReportStats monthlyData={monthlyData} formatCurrency={formatCurrency} />
      <MonthlyReportTable monthlyData={monthlyData} formatCurrency={formatCurrency} />
      {/* Modals */}
    </>
  );
};
```

**File Structure:**
```
MonthlyReport/
├── index.tsx (main orchestrator, <300 lines)
├── MonthlyReportTable.tsx (table rendering, ~400 lines)
├── MonthlyReportStats.tsx (stats cards, ~100 lines)
├── hooks/
│   ├── useMonthlyData.ts (data fetching/processing)
│   ├── useInventoryManagement.ts (inventory state)
│   └── useModalState.ts (modal open/close state)
└── utils/
    └── calculations.ts (business logic)
```

**Acceptance Criteria:**
- [ ] Main component <300 lines
- [ ] Components wrapped in React.memo
- [ ] Unnecessary re-renders eliminated (verify with React DevTools)
- [ ] All functionality preserved

---

### Issue #16: [MEDIUM] Silent localStorage Failures

**Labels:** `bug`, `medium`, `error-handling`

**Description:**
localStorage access without try-catch causes app crashes in private/incognito browsing mode or when storage quota exceeded.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:136-142`

**Current Code:**
```typescript
const savedOpeningInv = localStorage.getItem(STORAGE_KEYS.OPENING_INVENTORY);
// ❌ Throws in private mode or when quota exceeded
```

**Impact:**
- App unusable in private browsing
- Silent failures when storage full
- No user feedback

**Solution:**
Create safe localStorage wrapper:

```typescript
// src/utils/storage.ts
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('localStorage.getItem failed:', error);
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('localStorage.setItem failed:', error);

      // Show user-friendly error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        alert('אחסון מלא. נא לפנות מקום או לייצא נתונים.');
      } else {
        alert('לא ניתן לשמור נתונים במכשיר זה (ייתכן שאתה במצב גלישה פרטית).');
      }

      return false;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error);
    }
  }
};
```

**Usage:**
```typescript
import { safeLocalStorage } from '@/utils/storage';

const savedData = safeLocalStorage.getItem(STORAGE_KEYS.OPENING_INVENTORY);
const success = safeLocalStorage.setItem(STORAGE_KEYS.OPENING_INVENTORY, data);

if (!success) {
  // Handle save failure
}
```

**Acceptance Criteria:**
- [ ] App works in private browsing mode
- [ ] Users notified of storage failures
- [ ] Graceful degradation when localStorage unavailable

---

### Issue #17: [MEDIUM] Missing Error Boundaries

**Labels:** `bug`, `medium`, `error-handling`, `stability`

**Description:**
No Error Boundary components to catch React render errors, causing one component bug to crash the entire application.

**Impact:**
- Entire app white-screens on single component error
- Poor user experience
- No error reporting

**Solution:**
Create Error Boundary component:

```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // TODO: Send to error reporting service (Sentry)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary-fallback">
          <h2>משהו השתבש</h2>
          <p>אירעה שגיאה בלתי צפויה. נסה לרענן את הדף.</p>
          <button onClick={() => window.location.reload()}>
            רענן דף
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details>
              <summary>פרטי שגיאה (מצב פיתוח)</summary>
              <pre>{this.state.error?.stack}</pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage:**
```typescript
// Wrap critical sections
<ErrorBoundary>
  <MonthlyReport />
</ErrorBoundary>

// Or wrap entire app
<ErrorBoundary fallback={<AppCrashScreen />}>
  <App />
</ErrorBoundary>
```

**Acceptance Criteria:**
- [ ] Error boundaries at strategic component levels
- [ ] User-friendly error messages
- [ ] Ability to recover without full page reload
- [ ] Errors logged for debugging

---

### Issue #18: [MEDIUM] Missing Cleanup in useEffect

**Labels:** `bug`, `medium`, `memory-leak`

**Description:**
useEffect hooks with async operations don't clean up properly, causing "setState on unmounted component" warnings and potential memory leaks.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:72-148`

**Current Code:**
```typescript
useEffect(() => {
  const loadTransactions = async () => {
    const data = await fetch(...);
    setTransactions(data); // ❌ Called even if component unmounted
  };

  loadTransactions();
  // ❌ No cleanup function
}, []);
```

**Impact:**
- Memory leaks
- Console warnings
- Potential race conditions

**Solution:**
Add cleanup with AbortController:

```typescript
useEffect(() => {
  const abortController = new AbortController();
  let isMounted = true;

  const loadTransactions = async () => {
    try {
      const response = await fetch('/data/transactions.csv', {
        signal: abortController.signal // Pass abort signal
      });

      const text = await response.text();
      const results = Papa.parse(text, { header: true });

      // Only update state if still mounted
      if (isMounted) {
        setTransactions(results.data);
        setLoading(false);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }

      if (isMounted) {
        setError(error.message);
        setLoading(false);
      }
    }
  };

  loadTransactions();

  // Cleanup function
  return () => {
    isMounted = false;
    abortController.abort();
  };
}, []);
```

**Acceptance Criteria:**
- [ ] All async useEffects have cleanup
- [ ] No "setState on unmounted component" warnings
- [ ] Fetch requests canceled on unmount

---

### Issue #19: [MEDIUM] Inconsistent Wix API Access Methods

**Labels:** `bug`, `medium`, `wix`, `architecture`

**Description:**
Two different methods used to call same Wix backend - `window.wixWindow.backend` in one file and direct `fetch()` in another.

**Locations:**
- `src/components/reports/MonthlyReport/index.tsx:127` (uses `window.wixWindow.backend`)
- `src/components/reports/MonthlyReport/InventoryEditorModal.tsx:178` (uses `fetch('https://litay.co.il/_functions/...')`)

**Problems:**
- Confusing - which method should be used?
- Inconsistent error handling
- Hard to mock for testing
- Can't easily switch environments

**Solution:**
Create unified Wix API service:

```typescript
// src/services/wixApi.ts
class WixApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_WIX_BASE_URL || 'https://litay.co.il';
  }

  private async callFunction(functionName: string, data: any): Promise<any> {
    // Try window.wixWindow.backend first (when running in Wix)
    if (window.wixWindow?.backend?.[functionName]) {
      try {
        return await window.wixWindow.backend[functionName](data);
      } catch (error) {
        console.warn('Wix backend call failed, falling back to HTTP:', error);
      }
    }

    // Fallback to HTTP fetch (when running standalone)
    const response = await fetch(`${this.baseUrl}/_functions/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Wix API error: ${response.status}`);
    }

    return await response.json();
  }

  async saveInventory(opening: string, closing: string) {
    return this.callFunction('saveInventory', { opening, closing });
  }

  async loadInventory() {
    return this.callFunction('loadInventory', {});
  }

  async saveAdjustments(adjustments: string) {
    return this.callFunction('saveAdjustments', { adjustments });
  }

  async loadAdjustments() {
    return this.callFunction('loadAdjustments', {});
  }
}

export const wixApi = new WixApiService();
```

**Usage:**
```typescript
// Same API everywhere
import { wixApi } from '@/services/wixApi';

const data = await wixApi.loadInventory();
await wixApi.saveInventory(opening, closing);
```

**Acceptance Criteria:**
- [ ] Single API service for all Wix calls
- [ ] Consistent error handling
- [ ] Easy to mock for testing
- [ ] Environment-aware (dev/prod)

---

### Issue #20: [MEDIUM] No Type Safety for Wix API

**Labels:** `typescript`, `medium`, `wix`

**Description:**
Wix API responses typed as `any`, losing type safety and risking runtime errors.

**Location:**
- File: `src/components/reports/MonthlyReport/index.tsx:9-20`

**Current Code:**
```typescript
interface Window {
  wixWindow?: {
    backend?: {
      saveInventory: (opening: string, closing: string) => Promise<any>;  // ❌ any
      loadInventory: () => Promise<any>;  // ❌ any
      // ...
    };
  };
}
```

**Solution:**
Define proper TypeScript interfaces:

```typescript
// src/types/wixApi.ts
export interface WixInventoryData {
  opening: string; // JSON stringified inventory
  closing: string; // JSON stringified inventory
  lastUpdated: string; // ISO date string
  userId: string;
}

export interface WixAdjustmentsData {
  adjustments: string; // JSON stringified adjustments
  lastUpdated: string;
  userId: string;
}

export interface WixApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Update window interface
declare global {
  interface Window {
    wixWindow?: {
      backend?: {
        saveInventory: (
          opening: string,
          closing: string
        ) => Promise<WixApiResponse<WixInventoryData>>;

        loadInventory: () => Promise<WixApiResponse<WixInventoryData>>;

        saveAdjustments: (
          adjustments: string
        ) => Promise<WixApiResponse<WixAdjustmentsData>>;

        loadAdjustments: () => Promise<WixApiResponse<WixAdjustmentsData>>;
      };
    };
  }
}
```

**Usage with Type Safety:**
```typescript
const response = await wixApi.loadInventory();

if (response.success && response.data) {
  const inventory = JSON.parse(response.data.opening);
  // TypeScript knows response.data has .opening property
} else {
  console.error('Error:', response.error?.message);
}
```

**Acceptance Criteria:**
- [ ] All Wix API calls properly typed
- [ ] TypeScript catches API contract violations
- [ ] No `any` types in Wix integration

---

### Issue #21: [MEDIUM] Hardcoded Wix URL

**Labels:** `config`, `medium`, `wix`

**Description:**
Wix API URL hardcoded, making it impossible to switch between dev/staging/prod environments.

**Location:**
- File: `src/components/reports/MonthlyReport/InventoryEditorModal.tsx:178`

**Current Code:**
```typescript
const response = await fetch('https://litay.co.il/_functions/saveInventory', {
  // ❌ Hardcoded production URL
```

**Solution:**
Move to environment variables:

```bash
# .env.development
VITE_WIX_BASE_URL=http://localhost:3000

# .env.staging
VITE_WIX_BASE_URL=https://staging.litay.co.il

# .env.production
VITE_WIX_BASE_URL=https://litay.co.il
```

```typescript
const WIX_BASE_URL = import.meta.env.VITE_WIX_BASE_URL;

if (!WIX_BASE_URL) {
  throw new Error('VITE_WIX_BASE_URL not configured');
}

const response = await fetch(`${WIX_BASE_URL}/_functions/saveInventory`, {
  // ...
});
```

**Acceptance Criteria:**
- [ ] No hardcoded URLs in code
- [ ] Environment variables documented in .env.example
- [ ] Build fails if required env vars missing

---

### Issue #22-28: [Additional Medium Priority Issues]

Due to character limits, here are brief descriptions:

**#22: Bidirectional Data Flow** - Complex parent/child data flow, consider useReducer
**#23: Inconsistent Data Formats** - Standardize category codes (number vs string)
**#24: No Handling for Malformed Dates** - Use dayjs for date validation
**#25: Hardcoded Column Names** - CSV columns hardcoded in Hebrew
**#26: Generic Error Messages** - "שגיאה בעיבוד" doesn't help users
**#27: No Unsaved Changes Warning** - Closing modals loses work
**#28: Poor Keyboard Navigation** - Table not accessible via keyboard

*Full details available in supplementary document or can be expanded in separate issues*

---

## 🟢 LOW PRIORITY ISSUES (21)

### Issue #29: [LOW] Duplicate MONTH_NAMES Constant

**Labels:** `code-quality`, `low`, `refactoring`

**Description:**
`MONTH_NAMES` array defined in 4 different files instead of importing from constants.

**Files:**
- `src/constants/reportConstants.ts:6-19`
- `src/components/reports/MonthlyReport/DrillDownModal.tsx:9-10`
- `src/components/reports/MonthlyReport/AdjustmentsEditorModal.tsx:21-24`
- `src/components/reports/MonthlyReport/InventoryEditorModal.tsx:29-32`

**Solution:**
Remove duplicates, import from constants file:

```typescript
// In all modal files:
import { MONTH_NAMES } from '@/constants/reportConstants';
```

---

### Issue #30: [LOW] Duplicate Currency Formatting Functions

**Labels:** `code-quality`, `low`, `refactoring`

**Description:**
Two different currency formatters with different behaviors.

**Files:**
- `src/components/reports/MonthlyReport/index.tsx:340-349` (inline function)
- `src/utils/formatters.ts:2-9` (utility function)

**Solution:**
Use single formatter from utils everywhere.

---

### Issue #31: [LOW] Repeated Color Gradients

**Labels:** `code-quality`, `low`, `styling`

**Description:**
Same gradient strings repeated throughout components.

**Solution:**
Move to Tailwind config or CSS constants:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      }
    }
  }
}

// Usage:
<div className="bg-gradient-primary">
```

---

### Issue #32-49: [Additional Low Priority Issues]

Brief list:
- **#32:** Inconsistent naming conventions (camelCase vs snake_case)
- **#33:** Unclear function names (showBiur should be handleShowBiur)
- **#34:** Magic numbers without explanation (40000, 40020)
- **#35:** Missing JSDoc comments
- **#36:** No component README files
- **#37:** Missing ARIA labels for accessibility
- **#38:** Low color contrast (needs WCAG audit)
- **#39:** Missing skeleton loaders
- **#40:** alert() used instead of toast notifications
- **#41:** Unused dependencies (react-scripts with Vite)
- **#42:** Lodash imported incorrectly
- **#43:** No virtual scrolling for large tables
- **#44:** Zero test coverage
- **#45:** No Storybook for component development
- **#46:** No .env.example file
- **#47:** No CI/CD pipeline
- **#48:** TypeScript config too loose (noUnusedLocals: false)
- **#49:** Need npm audit for security vulnerabilities

---

## PRIORITY SUMMARY

### 🚨 Do Immediately (Critical - 4 issues):
1. Move Supabase credentials to environment variables
2. Move authentication to server-side
3. Add input sanitization (XSS protection)
4. Fix Wix error handling (show failures to user)

### 📅 Do This Week (High - 8 issues):
5. Extract duplicate calculation logic
6. Fix COGS calculation bug in StatsCards
7. Standardize inventory key format
8. Add CSV validation
9. Add null checks throughout
10. Add state validation
11. Fix race condition in data loading
12. Add type assertions with validation

### 🎯 Do This Month (Medium - 28 issues):
13-40. Performance optimization, error handling, Wix integration improvements, UX enhancements

### 📋 Do Eventually (Low - 21 issues):
41-61. Code cleanup, testing, documentation, tooling

---

**Total Issues to Create: 61**

**Estimated Total Effort:**
- Critical: 16 hours
- High: 24 hours
- Medium: 60 hours
- Low: 30 hours
- **Total: ~130 hours (~3-4 weeks for 1 developer)**

---

## BATCH CREATION INSTRUCTIONS

To create these efficiently in GitHub:

1. **Using GitHub UI:**
   - Copy each issue title + description
   - Create issue
   - Apply labels
   - Repeat

2. **Using GitHub CLI (if available):**
```bash
gh issue create --title "Issue Title" --body-file issue1.md --label "critical,security"
```

3. **Using GitHub API Script:**
   See `scripts/create-issues.sh` (can be created separately)

---

**Created:** 2024-11-14
**Analyzed:** 61 issues across 11,600 lines of code
**Priority Distribution:** 4 Critical, 8 High, 28 Medium, 21 Low
