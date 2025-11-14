# CLAUDE.md - AI Assistant Guide for LITAY Finance Dashboard

**Last Updated:** November 14, 2025
**Project:** LITAY Finance - Financial Dashboard System
**Language:** TypeScript + React
**Direction:** RTL (Hebrew)

---

## 📋 Project Overview

LITAY Finance is an advanced financial reporting dashboard built with React, TypeScript, and Vite. The system provides comprehensive financial analysis tools for businesses, featuring hierarchical reports, monthly profit & loss statements, and a sophisticated drill-down system with Wix backend integration.

### Key Characteristics
- **Hebrew-first application** with full RTL support
- **Professional minimalist design** using LITAY brand colors (green/gray palette)
- **Component-driven architecture** with clear separation of concerns
- **Supabase integration** for data persistence
- **Wix backend integration** for inventory and adjustments sync
- **Local storage** for offline functionality

---

## 🎯 Core Principles for AI Assistants

### 1. Language & Direction
- **All user-facing text MUST be in Hebrew**
- **Always use RTL (dir="rtl")** for layouts
- Text alignment defaults to `text-right`
- Icons and navigation should follow RTL conventions

### 2. Design System - STRICT COMPLIANCE
```typescript
// LITAY Official Color Palette - USE ONLY THESE COLORS
const LITAY = {
  primaryDark: '#2d5f3f',    // Dark green
  primary: '#528163',         // Main brand green
  primaryLight: '#8dd1bb',    // Light green/teal
  darkGreen: '#17320b',       // Very dark green
  neutralDark: '#2d3436',     // Dark gray
  neutralMedium: '#636e72',   // Medium gray
  neutralLight: '#b2bec3',    // Light gray
  neutralBg: '#f5f6fa',       // Background gray
  white: '#ffffff',
  success: '#27ae60',
  warning: '#f39c12',
  error: '#e74c3c',
  info: '#3498db'
};
```

**Design Rules:**
- Minimalist and professional aesthetic
- Clean layouts with generous whitespace
- No flashy colors, gradients, or decorative fonts
- Subtle shadows: `shadow-sm`, `shadow-md` only
- Green/gray color scheme throughout
- Consistent spacing using Tailwind scale

### 3. Typography
- **Primary Font:** `'Assistant, Heebo, Arial Hebrew, sans-serif'`
- **Monospace:** `'Rubik, Arial'` for numbers
- **Font weights:** 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

---

## 📁 Project Structure

```
financial-dashboard-new/
├── src/
│   ├── components/
│   │   ├── reports/
│   │   │   ├── MonthlyReport/          # Monthly P&L report system
│   │   │   │   ├── index.tsx           # Main monthly report
│   │   │   │   ├── CategoryRow.tsx     # Category row component
│   │   │   │   ├── VendorRow.tsx       # Vendor drill-down row
│   │   │   │   ├── AdjustmentRow.tsx   # Adjustment calculations
│   │   │   │   ├── InventoryRow.tsx    # Inventory display
│   │   │   │   ├── BiurModal.tsx       # Transaction details modal
│   │   │   │   ├── DrillDownModal.tsx  # 4-level drill-down system
│   │   │   │   ├── InventoryEditorModal.tsx      # Inventory editor
│   │   │   │   ├── AdjustmentsEditorModal.tsx    # 2024 adjustments editor
│   │   │   │   ├── InventoryBackupControls.tsx   # Backup controls
│   │   │   │   ├── StatsCards.tsx      # Summary statistics cards
│   │   │   │   └── TableHeader.tsx     # Table header component
│   │   │   ├── biurim/                 # Biurim (explanations) system
│   │   │   │   ├── BiurimSystem.tsx    # Main biurim container
│   │   │   │   ├── BiurimTab.tsx       # Biurim main tab
│   │   │   │   ├── ComparisonTab.tsx   # Comparison analysis
│   │   │   │   ├── AnalyticsTab.tsx    # Analytics dashboard
│   │   │   │   ├── BalancesTab.tsx     # Balance sheet
│   │   │   │   ├── AlertsSystem.tsx    # Alert notifications
│   │   │   │   └── DataValidationModal.tsx
│   │   │   ├── HierarchicalReport.tsx  # Hierarchical P&L report
│   │   │   └── OLD/                    # Legacy components
│   │   ├── financial/                  # Financial components
│   │   ├── common/                     # Shared UI components
│   │   └── ProtectedRoute.tsx          # Authentication wrapper
│   ├── types/
│   │   └── reportTypes.ts              # TypeScript type definitions
│   ├── constants/
│   │   ├── reportConstants.ts          # Report configuration
│   │   ├── colors.ts                   # Color definitions
│   │   └── icons.ts                    # Icon mappings
│   ├── utils/
│   │   ├── formatters.ts               # Number/date formatters
│   │   ├── parsers.ts                  # CSV/data parsers
│   │   └── exporters.ts                # Export utilities
│   ├── lib/
│   │   └── supabaseClient.ts           # Supabase connection
│   ├── App.tsx                         # Main application
│   └── main.tsx                        # Entry point
├── public/
│   ├── LITAYLOGO.png                   # Company logo
│   └── TransactionMonthlyModi.csv      # Transaction data
├── ARCHITECTURE.md                      # System architecture
├── DEVELOPMENT_GUIDE.md                 # Development guide
├── DESIGN_GUIDE.md                      # Design guidelines
├── ROADMAP.md                           # Project roadmap
├── session_12_update.md                 # Latest session notes
└── package.json
```

---

## 🔧 Tech Stack

### Core Technologies
- **React 19.1.0** - UI library
- **TypeScript** - Type safety
- **Vite 6.3.5** - Build tool and dev server
- **Tailwind CSS 3.4.18** - Utility-first CSS

### Key Dependencies
- **@supabase/supabase-js ^2.75.0** - Database & authentication
- **recharts ^2.15.4** - Charts and visualizations
- **papaparse ^5.5.3** - CSV parsing
- **xlsx ^0.18.5** - Excel export
- **framer-motion ^12.15.0** - Animations
- **lucide-react ^0.511.0** - Icons
- **dayjs ^1.11.13** - Date handling

### Development Tools
- **ESLint 9.25.0** - Code quality
- **PostCSS 8.5.6** - CSS processing
- **TypeScript** - Type checking

---

## 🗂️ Data Model

### Core Types (src/types/reportTypes.ts)

```typescript
// Transaction from CSV
interface Transaction {
  sortCode: number | null;           // Category code (e.g., 800, 801)
  sortCodeName: string;              // Category name in Hebrew
  accountKey: number;                // Account number
  accountName: string;               // Account name in Hebrew
  amount: number;                    // Transaction amount
  details: string;                   // Transaction details
  date: string;                      // Date (format varies)
  counterAccountName: string;        // Counter-party account name
  counterAccountNumber: number;      // Counter-party account number
}

// Monthly aggregated data
interface MonthlyData {
  [month: number]: number;           // Months 1-12
  total: number;                     // Annual total
}

// Vendor/Supplier data
interface VendorData {
  name: string;                      // Vendor name
  data: MonthlyData;                 // Monthly amounts
  transactions: Transaction[];       // Detailed transactions
}

// Category data structure
interface CategoryData {
  code: number | string;             // Category code
  name: string;                      // Category name in Hebrew
  type: 'income' | 'cogs' | 'operating' | 'financial';
  data: MonthlyData;                 // Monthly totals
  vendors?: VendorData[];            // Vendor breakdown
}

// Inventory tracking
interface Inventory {
  [month: number]: number;           // Inventory value per month
}

// 2024 Adjustments
interface Adjustments2024 {
  [categoryCode: string]: {
    [month: number]: number | string;
  };
}
```

### Category Codes Structure

```typescript
// Income Categories: 600-799
600: "הכנסות"              // Revenue
700: "הכנסות סופרפארם"     // SuperPharm revenue

// Expense Categories: 800-999
800: "עלות המכר"           // Cost of Goods Sold
801: "הוצאות שיווק"        // Marketing expenses
802: "הוצאות משרד"         // Office expenses
804: "שכר עבודה"           // Payroll
805: "הוצאות הנהלה"        // Administrative expenses
806: "הובלות"              // Shipping costs
811: "פחת"                 // Depreciation
813: "הוצאות מימון"        // Financial expenses
990: "הוצאות אחרות"        // Other expenses
991: "הכנסות אחרות"        // Other income
```

---

## 🎨 Styling Conventions

### Tailwind Classes Pattern
```typescript
// Card/Container
className="bg-white rounded-lg shadow-sm p-6 border border-gray-200"

// Headers
className="text-xl font-bold text-right"
style={{ color: LITAY.primaryDark }}

// Buttons - Primary
className="px-4 py-2 rounded-lg font-medium transition-all"
style={{
  backgroundColor: LITAY.primary,
  color: 'white'
}}

// Buttons - Secondary
className="px-4 py-2 rounded-lg border-2 transition-all"
style={{
  borderColor: LITAY.primary,
  color: LITAY.primaryDark
}}

// Tables
className="min-w-full bg-white rounded-lg overflow-hidden"
```

### Number Formatting
```typescript
// Currency (ILS)
const formatCurrency = (amount: number): string => {
  return `₪${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

// Percentage
const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};
```

---

## 🔄 State Management

### Local Storage Keys (src/constants/reportConstants.ts)
```typescript
export const STORAGE_KEYS = {
  OPENING_INVENTORY: 'openingInventory',
  CLOSING_INVENTORY: 'closingInventory',
  ADJUSTMENTS_2024: 'adjustments2024'
} as const;
```

### React State Patterns
- Use `useState` for component-local state
- Use `useMemo` for expensive calculations
- Use `useEffect` for data loading/side effects
- Pass data down via props (no Context API currently used except for auth)

---

## 🚀 Development Workflow

### Scripts
```bash
npm run dev      # Start development server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### File Naming Conventions
- **Components:** PascalCase (e.g., `CategoryRow.tsx`)
- **Utilities:** camelCase (e.g., `formatters.ts`)
- **Constants:** camelCase with UPPER_CASE exports
- **Types:** PascalCase interfaces in `reportTypes.ts`

### Component Structure Template
```typescript
import React, { useState, useMemo } from 'react';

interface ComponentNameProps {
  // Props definition
}

const ComponentName: React.FC<ComponentNameProps> = ({
  /* props */
}) => {
  // State
  const [state, setState] = useState();

  // Memoized calculations
  const computed = useMemo(() => {
    // Expensive calculation
  }, [dependencies]);

  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };

  // Render
  return (
    <div className="..." dir="rtl">
      {/* Hebrew content */}
    </div>
  );
};

export default ComponentName;
```

---

## 🔌 Backend Integration

### Supabase (Current)
- **Client:** `src/lib/supabaseClient.ts`
- **Usage:** Authentication and data storage
- **URL:** `https://fcrmghhjdnnnvpzsqieb.supabase.co`

### Wix Backend (In Development)
Located in `/wix/backend/inventory.jsw`:
- `saveInventory(opening, closing)` - Save inventory data
- `loadInventory()` - Load inventory data
- `saveAdjustments(adjustments)` - Save 2024 adjustments
- `loadAdjustments()` - Load 2024 adjustments

**Wix Collections:**
1. **InventoryData**
   - `opening` (Text)
   - `closing` (Text)
   - `lastUpdated` (Text)
   - `userId` (Text)

2. **Adjustments2024**
   - `adjustments` (Text)
   - `lastUpdated` (Text)
   - `userId` (Text)

---

## 📊 Report System Architecture

### Monthly Report (MonthlyReport/index.tsx)
The main monthly P&L report with:
- Revenue, COGS, Gross Profit
- Operating expenses
- Operating profit
- Financial expenses
- Net profit
- Inventory adjustments
- 2024 adjustments modal

### 4-Level Drill-Down System
```
Level 1: Main Table (Category totals by month)
   ↓ Click on month amount
Level 2: Accounts (Account breakdown - scroll down)
   ↓ Click on account
Level 3: Vendors (Vendor/supplier breakdown - scroll down)
   ↓ Click on vendor amount
Level 4: Transactions (BiurModal - floating modal)
```

### Biurim System (biurim/)
Advanced analysis system with tabs:
- **BiurimTab:** Main explanations and notes
- **ComparisonTab:** Period comparisons
- **AnalyticsTab:** Analytics dashboard
- **BalancesTab:** Balance sheet view
- **AlertsSystem:** Automated alerts

---

## 🛠️ Common Tasks for AI Assistants

### Adding a New Component
1. Create file in appropriate directory (e.g., `src/components/reports/`)
2. Use Hebrew for all user-facing strings
3. Apply LITAY color palette via inline styles or Tailwind
4. Ensure RTL layout with `dir="rtl"`
5. Export component as default
6. Import and use in parent component

### Modifying Data Processing
1. Check `src/types/reportTypes.ts` for relevant types
2. Update processing logic in component or create util function
3. Use `useMemo` for expensive calculations
4. Test with real CSV data from `/public/TransactionMonthlyModi.csv`

### Styling Changes
1. **ALWAYS** check `DESIGN_GUIDE.md` first
2. Use only LITAY colors (green/gray palette)
3. Keep design minimalist
4. Test RTL layout
5. Verify responsive behavior

### Adding Storage Features
1. Add key to `STORAGE_KEYS` in `reportConstants.ts`
2. Use `localStorage.getItem()` / `setItem()`
3. Parse JSON data safely with try/catch
4. Provide fallback values

---

## ⚠️ Critical Rules for AI Assistants

### DO's
✅ Use Hebrew for ALL user-facing text
✅ Apply RTL direction (`dir="rtl"`)
✅ Use LITAY color palette exclusively
✅ Keep designs minimalist and professional
✅ Format numbers with Hebrew locale
✅ Add TypeScript types for all data
✅ Use `useMemo` for heavy calculations
✅ Test with actual CSV data
✅ Follow existing component patterns
✅ Check ARCHITECTURE.md and DESIGN_GUIDE.md before major changes

### DON'Ts
❌ Never use English for UI text
❌ Don't use LTR layouts
❌ Don't introduce new colors outside LITAY palette
❌ Don't use flashy animations or gradients
❌ Don't ignore RTL text alignment
❌ Don't create components without TypeScript types
❌ Don't modify core data structures without understanding impact
❌ Don't skip error handling for data parsing
❌ Don't commit without testing Hebrew display
❌ Don't use decorative fonts

---

## 🔍 Debugging & Testing

### Common Issues
1. **Hebrew text not displaying:** Check font family includes Hebrew fonts
2. **Layout breaking:** Verify `dir="rtl"` is set
3. **Colors wrong:** Ensure using LITAY constants, not hardcoded values
4. **Numbers not formatting:** Use `toLocaleString('he-IL')`
5. **CSV parsing fails:** Check encoding (should be UTF-8 with BOM for Hebrew)

### Testing Checklist
- [ ] Hebrew text displays correctly
- [ ] RTL layout works properly
- [ ] Colors match LITAY palette
- [ ] Numbers format with ₪ symbol and Hebrew separators
- [ ] Works in Chrome, Firefox, Safari
- [ ] Responsive on mobile/tablet
- [ ] No console errors
- [ ] Data persists in localStorage

---

## 📚 Additional Documentation

- **ARCHITECTURE.md** - Full system architecture and technical stack
- **DEVELOPMENT_GUIDE.md** - Quick start guide for developers
- **DESIGN_GUIDE.md** - Complete design system and UI guidelines
- **ROADMAP.md** - Project roadmap and future plans
- **session_12_update.md** - Latest development session notes

---

## 🔄 Recent Updates (Session 12)

**Date:** October 21, 2025

### Completed:
- ✅ Added buttons to green header (Monthly Report)
- ✅ Created AdjustmentsEditorModal for 2024 adjustments
- ✅ Set up Wix Database collections
- ✅ Wrote Wix backend code (inventory.jsw)

### In Progress:
- 🔧 4-level drill-down system (scroll-based, not modals)
- ⏳ Wix backend integration

### Next Steps:
1. Implement state for drill-down system (3 min)
2. Create ScrollableLevels component for levels 2-3 (30 min)
3. Update CategoryRow click handlers (10 min)
4. Connect Wix save/load functions (20 min)

---

## 📞 Support & Resources

- **Primary Language:** Hebrew (עברית)
- **Direction:** RTL (מימין לשמאל)
- **Brand:** LITAY (ליתאי ניהול שירותים בע"מ)
- **Tagline:** "Innovation in Balance"
- **Version:** 1.0.0

---

**Note for AI Assistants:** This is a production system for a real accounting firm. Maintain professional standards, ensure data integrity, and follow established patterns. When in doubt, check existing documentation or ask for clarification rather than making assumptions.

---

*Last updated by AI Assistant: November 14, 2025*
