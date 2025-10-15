// src/constants/reportConstants.ts

/**
 * שמות החודשים בעברית
 */
export const MONTH_NAMES = [
  'ינואר',
  'פברואר',
  'מרץ',
  'אפריל',
  'מאי',
  'יוני',
  'יולי',
  'אוגוסט',
  'ספטמבר',
  'אוקטובר',
  'נובמבר',
  'דצמבר'
] as const;

/**
 * צבעי כרטיסי הסטטיסטיקה
 * שימוש: className={CARD_COLORS.revenue}
 */
export const CARD_COLORS = {
  revenue: 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300',
  cogs: 'bg-orange-50 border-orange-300',
  grossProfit: 'bg-green-50 border-green-300',
  operating: 'bg-gray-50 border-gray-300',
  opProfit: 'bg-emerald-50 border-emerald-300',
  financial: 'bg-slate-50 border-slate-300',
  netProfit: 'bg-gradient-to-r from-teal-50 to-emerald-50 border-teal-400'
} as const;

/**
 * מפתחות LocalStorage
 */
export const STORAGE_KEYS = {
  OPENING_INVENTORY: 'openingInventory',
  CLOSING_INVENTORY: 'closingInventory',
  ADJUSTMENTS_2024: 'adjustments2024'
} as const;

/**
 * קונפיגורציה של הדוח
 */
export const REPORT_CONFIG = {
  CSV_FILE_PATH: '/TransactionMonthlyModi.csv',
  MAX_TABLE_HEIGHT: '600px',
  SCROLLBAR_WIDTH: '8px',
  SCROLLBAR_COLOR: '#528163',
  SCROLLBAR_TRACK_COLOR: '#f1f1f1'
} as const;