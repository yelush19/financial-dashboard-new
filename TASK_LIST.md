# 📋 Task List - Financial Dashboard Improvements
## רשימת משימות מסודרת לפי עדיפויות

**תאריך יצירה:** 2024-11-14
**סטטוס:** Not Started
**זמן משוער כולל:** 130 שעות (~3-4 שבועות)

---

## 🔴 Phase 1: CRITICAL SECURITY & DATA INTEGRITY (16 שעות)
**עדיפות:** 🚨 מיידי - יש לבצע השבוע!

### Sprint 1.1: Security Hardening (8 שעות)

- [ ] **Task 1.1.1:** Move Supabase credentials to environment variables
  - **זמן:** 2 שעות
  - **קבצים:** `src/lib/supabaseClient.ts`, `.env.example`, `.gitignore`
  - **שלבים:**
    1. Create `.env.local` file (add to `.gitignore`)
    2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
    3. Update `supabaseClient.ts` to use `import.meta.env`
    4. Create `.env.example` with placeholders
    5. Add validation to fail build if env vars missing
    6. Test in dev and prod modes
  - **Issue:** #1

- [ ] **Task 1.1.2:** Move authentication to server-side
  - **זמן:** 4 שעות
  - **קבצים:** `src/components/ProtectedRoute.tsx`, Supabase dashboard
  - **שלבים:**
    1. Create `allowed_users` table in Supabase
    2. Populate with allowed emails
    3. Create RLS policies for user validation
    4. Update `ProtectedRoute` to check database
    5. Remove hardcoded `ALLOWED_EMAILS` array
    6. Test with allowed and disallowed users
  - **Issue:** #2

- [ ] **Task 1.1.3:** Add input sanitization for XSS protection
  - **זמן:** 2 שעות
  - **קבצים:** `BiurModal.tsx`, `DrillDownModal.tsx`, `VendorRow.tsx`, `CategoryRow.tsx`
  - **שלבים:**
    1. Install DOMPurify: `npm install dompurify @types/dompurify`
    2. Create `src/utils/sanitize.ts` with sanitization helpers
    3. Update all components rendering user data
    4. Test with malicious input (e.g., `<script>alert(1)</script>`)
    5. Verify legitimate data still displays correctly
  - **Issue:** #3

### Sprint 1.2: Data Integrity (8 שעות)

- [ ] **Task 1.2.1:** Fix Wix API error handling
  - **זמן:** 3 שעות
  - **קבצים:** `InventoryEditorModal.tsx`, `index.tsx`
  - **שלבים:**
    1. Update error handlers to show user notifications
    2. Add retry mechanism for failed saves
    3. Distinguish between localStorage-only and Wix-synced data
    4. Add visual indicator for sync status
    5. Test with Wix unavailable
  - **Issue:** #4

- [ ] **Task 1.2.2:** Add CSV structure validation
  - **זמן:** 3 שעות
  - **קבצים:** `index.tsx`, new `src/utils/csvValidator.ts`
  - **שלבים:**
    1. Create `validateCSVStructure()` function
    2. Check for required columns before parsing
    3. Validate data types for critical fields
    4. Show helpful error messages for invalid CSVs
    5. Test with various malformed CSVs
  - **Issue:** #12

- [ ] **Task 1.2.3:** Fix COGS calculation bug
  - **זמן:** 1 שעה
  - **קבצים:** `StatsCards.tsx`
  - **שלבים:**
    1. Change addition to subtraction for adjustments
    2. Verify calculation against spreadsheet
    3. Add unit test to prevent regression
    4. Update any documentation
  - **Issue:** #6

- [ ] **Task 1.2.4:** Add state validation
  - **זמן:** 1 שעה
  - **קבצים:** `index.tsx`
  - **שלבים:**
    1. Add validation to `handleClosingInventoryChange`
    2. Add validation to `handleOpeningInventoryChange`
    3. Add validation to `handleAdjustmentChange`
    4. Reject invalid inputs (NaN, negative, Infinity)
    5. Show user feedback for invalid inputs
  - **Issue:** #10

**Milestone 1:** ✅ Critical security and data issues resolved

---

## 🟠 Phase 2: HIGH PRIORITY BUGS (24 שעות)
**עדיפות:** 📅 יש לבצע החודש

### Sprint 2.1: Code Quality & Logic Fixes (12 שעות)

- [ ] **Task 2.1.1:** Extract duplicate calculation logic
  - **זמן:** 4 שעות
  - **קבצים:** `index.tsx`, new `src/utils/profitCalculations.ts`
  - **שלבים:**
    1. Create `profitCalculations.ts` utility file
    2. Extract COGS adjustment calculation
    3. Extract gross profit calculation
    4. Extract operating profit calculation
    5. Extract net profit calculation
    6. Add memoization with useMemo
    7. Replace all 6 duplicate instances
    8. Verify calculations match original
  - **Issue:** #5

- [ ] **Task 2.1.2:** Standardize inventory key format
  - **זמן:** 3 שעות
  - **קבצים:** `index.tsx`, `InventoryRow.tsx`, type definitions
  - **שלבים:**
    1. Choose standard format: `"YYYY-MM"`
    2. Update `Inventory` type definition
    3. Create migration function for old data
    4. Remove conversion functions
    5. Update all inventory access code
    6. Test with existing localStorage data
  - **Issue:** #7

- [ ] **Task 2.1.3:** Add type assertions with validation
  - **זמן:** 3 שעות
  - **קבצים:** `index.tsx`
  - **שלבים:**
    1. Install Zod: `npm install zod`
    2. Create transaction schema
    3. Validate CSV parse results
    4. Replace unsafe `as any` casts
    5. Add error handling for invalid data
    6. Test with malformed CSV
  - **Issue:** #8

- [ ] **Task 2.1.4:** Add null checks throughout
  - **זמן:** 2 שעות
  - **קבצים:** `index.tsx`, various components
  - **שלבים:**
    1. Identify all unsafe property accesses
    2. Add optional chaining (`?.`)
    3. Add null coalescing (`??`)
    4. Test edge cases with missing data
  - **Issue:** #9

### Sprint 2.2: Async & State Management (12 שעות)

- [ ] **Task 2.2.1:** Fix race condition in data loading
  - **זמן:** 3 שעות
  - **קבצים:** `index.tsx`
  - **שלבים:**
    1. Refactor useEffect to use Promise.all
    2. Add cleanup function with AbortController
    3. Prevent setState on unmounted component
    4. Add coordinated loading state
    5. Test rapid navigation scenarios
  - **Issue:** #11

- [ ] **Task 2.2.2:** Add proper useEffect cleanup
  - **זמן:** 2 שעות
  - **קבצים:** `index.tsx`, modal components
  - **שלבים:**
    1. Add AbortController to all fetch operations
    2. Add isMounted flag to async operations
    3. Return cleanup functions from useEffects
    4. Test for memory leaks
    5. Verify no console warnings
  - **Issue:** #18

- [ ] **Task 2.2.3:** Create unified Wix API service
  - **זמן:** 4 שעות
  - **קבצים:** New `src/services/wixApi.ts`, `index.tsx`, `InventoryEditorModal.tsx`
  - **שלבים:**
    1. Create `WixApiService` class
    2. Add proper TypeScript interfaces
    3. Unify both access methods
    4. Add consistent error handling
    5. Move Wix URL to environment variable
    6. Replace all direct Wix calls with service
    7. Test in Wix and standalone modes
  - **Issues:** #19, #20, #21

- [ ] **Task 2.2.4:** Add Error Boundaries
  - **זמן:** 3 שעות
  - **קבצים:** New `src/components/ErrorBoundary.tsx`, `App.tsx`
  - **שלבים:**
    1. Create ErrorBoundary component
    2. Add user-friendly fallback UI
    3. Wrap MonthlyReport in boundary
    4. Wrap entire app in top-level boundary
    5. Add error logging (console for now)
    6. Test by throwing errors
  - **Issue:** #17

**Milestone 2:** ✅ Major bugs fixed, code quality improved

---

## 🟡 Phase 3: PERFORMANCE & UX (30 שעות)
**עדיפות:** 🎯 הרבעון הקרוב

### Sprint 3.1: Performance Optimization (16 שעות)

- [ ] **Task 3.1.1:** Split MonthlyReport into smaller components
  - **זמן:** 8 שעות
  - **קבצים:** `index.tsx` → multiple new files
  - **שלבים:**
    1. Create `MonthlyReportTable.tsx` (table rendering)
    2. Create `MonthlyReportStats.tsx` (stats section)
    3. Create `hooks/useMonthlyData.ts` (data fetching)
    4. Create `hooks/useInventoryManagement.ts` (inventory state)
    5. Create `hooks/useModalState.ts` (modal state)
    6. Extract business logic to `utils/calculations.ts`
    7. Update main index.tsx to orchestrate
    8. Wrap components in React.memo
    9. Verify all functionality works
  - **Issue:** #15, #23

- [ ] **Task 3.1.2:** Optimize memoization
  - **זמן:** 4 שעות
  - **קבצים:** `index.tsx`, new hook files
  - **שלבים:**
    1. Break down large useMemo into smaller chunks
    2. Memoize transaction processing separately
    3. Memoize inventory calculations separately
    4. Add useCallback to event handlers
    5. Profile with React DevTools before/after
    6. Verify >50% render time improvement
  - **Issue:** #13

- [ ] **Task 3.1.3:** Optimize array operations
  - **זמן:** 3 שעות
  - **קבצים:** `index.tsx`
  - **שלבים:**
    1. Reduce nested loops in processCategory
    2. Use Map instead of multiple array iterations
    3. Combine map/filter/sort into fewer passes
    4. Benchmark performance improvement
  - **Issue:** #14

- [ ] **Task 3.1.4:** Add virtual scrolling (optional)
  - **זמן:** 1 שעה (evaluation only)
  - **שלבים:**
    1. Evaluate if needed (how many rows typical?)
    2. If needed: Install react-window
    3. Implement for table rows
    4. Test with large datasets
  - **Issue:** #17 (LOW priority)

### Sprint 3.2: Error Handling & UX (14 שעות)

- [ ] **Task 3.2.1:** Safe localStorage wrapper
  - **זמן:** 2 שעות
  - **קבצים:** New `src/utils/storage.ts`, update all localStorage usage
  - **שלבים:**
    1. Create safeLocalStorage wrapper
    2. Handle QuotaExceededError
    3. Handle private browsing mode
    4. Show user-friendly errors
    5. Replace all direct localStorage calls
    6. Test in incognito mode
  - **Issue:** #16

- [ ] **Task 3.2.2:** Improve error messages
  - **זמן:** 3 שעות
  - **קבצים:** All error-throwing code
  - **שלבים:**
    1. Audit all error messages
    2. Replace technical messages with user-friendly ones
    3. Add actionable recovery steps
    4. Add "Try Again" / "Report Issue" buttons
    5. Consider adding toast notifications (react-toastify)
  - **Issues:** #26, #42

- [ ] **Task 3.2.3:** Add loading states & skeletons
  - **זמן:** 4 שעות
  - **קבצים:** Modal components, main table
  - **שלבים:**
    1. Create skeleton components matching final UI
    2. Replace generic spinners with skeletons
    3. Add loading state to Wix save buttons
    4. Disable buttons during operations
    5. Test perceived performance improvement
  - **Issues:** #39, #40, #41

- [ ] **Task 3.2.4:** Add unsaved changes warning
  - **זמן:** 2 שעות
  - **קבצים:** Modal components
  - **שלבים:**
    1. Track dirty state in modals
    2. Add confirmation dialog on close
    3. Highlight save button when dirty
    4. Test edge cases
  - **Issue:** #45

- [ ] **Task 3.2.5:** Improve accessibility
  - **זמן:** 3 שעות
  - **קבצים:** All interactive components
  - **שלבים:**
    1. Add ARIA labels to buttons/inputs
    2. Add keyboard navigation (Enter/Space)
    3. Add focus styles
    4. Run axe DevTools audit
    5. Fix contrast issues
    6. Test with screen reader
  - **Issues:** #37, #38

**Milestone 3:** ✅ App performant and user-friendly

---

## 🟢 Phase 4: CODE CLEANUP & TOOLING (30 שעות)
**עדיפות:** 📋 ניתן לדחות

### Sprint 4.1: Code Quality (12 שעות)

- [ ] **Task 4.1.1:** Remove code duplication
  - **זמן:** 3 שעות
  - **קבצים:** Multiple
  - **שלבים:**
    1. Consolidate MONTH_NAMES imports
    2. Unify currency formatting
    3. Extract color gradients to Tailwind config
    4. Remove duplicate validation logic
  - **Issues:** #29, #30, #31

- [ ] **Task 4.1.2:** Standardize naming conventions
  - **זמן:** 2 שעות
  - **קבצים:** Throughout codebase
  - **שלבים:**
    1. Rename snake_case to camelCase
    2. Prefix event handlers with `handle`
    3. Use consistent constant naming
  - **Issues:** #32, #33

- [ ] **Task 4.1.3:** Extract magic numbers to constants
  - **זמן:** 2 שעות
  - **קבצים:** `index.tsx`, new constants file
  - **שלבים:**
    1. Identify all magic numbers
    2. Create `businessRules.ts` with documented constants
    3. Replace hardcoded values
    4. Add comments explaining business logic
  - **Issue:** #34

- [ ] **Task 4.1.4:** Add JSDoc documentation
  - **זמן:** 3 שעות
  - **קבצים:** All utility functions, complex components
  - **שלבים:**
    1. Document all exported functions
    2. Document complex calculations
    3. Add usage examples
    4. Configure TypeScript to require JSDoc
  - **Issue:** #35

- [ ] **Task 4.1.5:** Create component README files
  - **זמן:** 2 שעות
  - **קבצים:** New README.md in component directories
  - **שלבים:**
    1. Document MonthlyReport architecture
    2. Create component diagram
    3. Explain data flow
    4. Add contribution guidelines
  - **Issue:** #36

### Sprint 4.2: Testing Infrastructure (12 שעות)

- [ ] **Task 4.2.1:** Set up testing framework
  - **זמן:** 2 שעות
  - **שלבים:**
    1. Install Vitest: `npm install -D vitest @testing-library/react`
    2. Configure vitest.config.ts
    3. Add test scripts to package.json
    4. Create test setup file
  - **Issue:** #46

- [ ] **Task 4.2.2:** Write unit tests for calculations
  - **זמן:** 4 שעות
  - **קבצים:** New `*.test.ts` files
  - **שלבים:**
    1. Test profit calculations
    2. Test COGS calculations
    3. Test inventory calculations
    4. Test data transformations
    5. Aim for >80% coverage of utils
  - **Issue:** #46

- [ ] **Task 4.2.3:** Write component tests
  - **זמן:** 4 שעות
  - **קבצים:** New `*.test.tsx` files
  - **שלבים:**
    1. Test StatsCards rendering
    2. Test BiurModal interactions
    3. Test InventoryEditorModal save flow
    4. Test error states
  - **Issue:** #46

- [ ] **Task 4.2.4:** Set up Storybook (optional)
  - **זמן:** 2 שעות
  - **שלבים:**
    1. Install Storybook
    2. Create stories for reusable components
    3. Document props and variants
  - **Issue:** #47

### Sprint 4.3: DevOps & Configuration (6 שעות)

- [ ] **Task 4.3.1:** Clean up dependencies
  - **זמן:** 1 שעה
  - **קבצים:** `package.json`
  - **שלבים:**
    1. Remove unused dependencies (react-scripts)
    2. Fix lodash imports
    3. Run `npm audit` and fix vulnerabilities
    4. Update outdated packages
  - **Issues:** #50, #51, #52

- [ ] **Task 4.3.2:** Improve TypeScript config
  - **זמן:** 1 שעה
  - **קבצים:** `tsconfig.json`
  - **שלבים:**
    1. Enable `noUnusedLocals`
    2. Enable `noUnusedParameters`
    3. Fix resulting errors
    4. Enable stricter checks gradually
  - **Issue:** #53

- [ ] **Task 4.3.3:** Create environment config
  - **זמן:** 1 שעה
  - **קבצים:** `.env.example`, documentation
  - **שלבים:**
    1. Document all environment variables
    2. Create .env.example
    3. Add validation for required vars
    4. Update README with setup instructions
  - **Issue:** #48

- [ ] **Task 4.3.4:** Set up CI/CD
  - **זמן:** 3 שעות
  - **קבצים:** `.github/workflows/ci.yml`
  - **שלבים:**
    1. Create GitHub Actions workflow
    2. Add linting step
    3. Add type-checking step
    4. Add test step
    5. Add build step
    6. Configure to run on PRs
  - **Issue:** #49

**Milestone 4:** ✅ Professional codebase with tests and tooling

---

## 📊 PROGRESS TRACKING

### Overall Progress
- **Phase 1 (Critical):** 0/8 tasks (0%)
- **Phase 2 (High):** 0/8 tasks (0%)
- **Phase 3 (Medium):** 0/9 tasks (0%)
- **Phase 4 (Low):** 0/13 tasks (0%)
- **TOTAL:** 0/38 tasks (0%)

### Time Tracking
- **Phase 1:** 0/16 hours
- **Phase 2:** 0/24 hours
- **Phase 3:** 0/30 hours
- **Phase 4:** 0/30 hours
- **TOTAL:** 0/130 hours

### Risk Assessment
🔴 **High Risk:**
- Security vulnerabilities (#1, #2, #3)
- Data integrity issues (#4, #6)

🟡 **Medium Risk:**
- Performance with large datasets (#13, #14, #15)
- Memory leaks (#18, #21)

🟢 **Low Risk:**
- Code quality improvements
- Testing and documentation

---

## 🎯 QUICK START GUIDE

### Week 1: Security & Critical Bugs
1. Start with Task 1.1.1 (Environment variables)
2. Move to Task 1.1.2 (Server-side auth)
3. Complete Phase 1 (all critical tasks)

### Week 2-3: High Priority Fixes
4. Extract duplicate code (Task 2.1.1)
5. Fix data format issues (Task 2.1.2, 2.1.3)
6. Improve async handling (Sprint 2.2)

### Week 4: Performance & UX
7. Split large component (Task 3.1.1)
8. Optimize rendering (Task 3.1.2)
9. Improve error messages (Sprint 3.2)

### Ongoing: Testing & Cleanup
10. Add tests as you refactor
11. Clean up code quality issues
12. Set up CI/CD

---

## 📝 NOTES

### Dependencies Between Tasks
- Task 2.1.1 should be done before 3.1.1 (easier to split after extracting logic)
- Task 2.2.3 should be done before 1.2.1 (unified API first)
- Task 4.2.1 should be done first in Phase 4 (testing setup)

### Parallel Work Possible
- Security tasks (1.1.x) can be done in parallel with data tasks (1.2.x)
- Code quality (4.1.x) can be done alongside testing (4.2.x)

### Consider Skipping
- Virtual scrolling (3.1.4) - only if needed
- Storybook (4.2.4) - nice to have, not critical

### After Completion
- Monitor error logs for new issues
- Gather user feedback
- Iterate on UX improvements
- Add more comprehensive tests

---

**Last Updated:** 2024-11-14
**Status:** Ready to start
**Next Task:** Task 1.1.1 (Move Supabase credentials)
