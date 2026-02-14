# Code Review Report - StudyTracker

**Date:** 2026-02-14  
**Project:** StudyTracker (Next.js 15 + Firebase)  
**Scanner:** 10 Agent Swarms  
**Total Files Scanned:** 100+

---

## Executive Summary

| Category | Issues Found | Critical | High | Medium | Low |
|----------|--------------|----------|------|--------|-----|
| Security | 3 | 2 | 0 | 0 | 1 |
| Performance | 18 | 0 | 3 | 10 | 5 |
| Memory Leaks | 3 | 0 | 2 | 0 | 1 |
| Accessibility | 20+ | 0 | 14 | 6 | 0 |
| React Best Practices | 120+ | 0 | 3 | 15 | 102 |
| Error Handling | 9 | 0 | 1 | 5 | 3 |
| TypeScript | 40+ | 0 | 15 | 20 | 10 |
| UI/UX | 25+ | 0 | 5 | 12 | 10 |
| Unused Code | 15 | 0 | 2 | 3 | 10 |
| Code Duplication | 25+ | 0 | 5 | 15 | 10 |

---

## Detailed Findings

### 1. SECURITY VULNERABILITIES (Agent 1)

#### 1.1 CRITICAL: Missing Server-Side Authorization in Admin Server Actions
- **File:** `src/lib/admin.ts`
- **Lines:** 8-31, 33-61
- **Issue:** Server actions do NOT perform server-side authorization checks. Any authenticated user could potentially call these server actions to access all user data.
- **Code:**
```typescript
// Line 10-12
// This server action is simplified for prototyping.
// In a production environment, this action should verify the caller's identity
// and permissions
```
- **Recommendation:** Add server-side authentication/authorization verification using Firebase Admin SDK

#### 1.2 CRITICAL: .env File Tracked by Git
- **File:** `.env`
- **Issue:** The `.env` file is being tracked by git, which should not happen
- **Recommendation:** Add `.env` to `.gitignore`

#### 1.3 LOW: User Impersonation Uses sessionStorage
- **File:** `src/contexts/data-context.tsx`
- **Lines:** 429-434, 502-512
- **Issue:** sessionStorage can potentially be manipulated by browser extensions or XSS attacks

---

### 2. PERFORMANCE ISSUES (Agent 2)

#### 2.1 Missing useMemo/useCallback (HIGH)
| File | Lines |
|------|-------|
| `src/components/chapter-accordion-item.tsx` | 55-79 |
| `src/components/progress-summary.tsx` | 439-452 |
| `src/components/todo-list.tsx` | 123-154 |
| `src/components/smart-todo-list.tsx` | 51-99 |

#### 2.2 Unnecessary Re-renders (HIGH)
- `src/components/chapter-accordion-item.tsx` - Component not memoized
- `src/components/todo-list.tsx` - SortableTodoItem not memoized

#### 2.3 Large Data Processing in Render (HIGH)
- `src/contexts/data-context.tsx:376` - `history.sort()` mutates original array
- `src/components/progress-summary.tsx` - Very large useMemo block (665-829)

#### 2.4 Missing Virtualization for Long Lists
- No virtualization library installed
- Affected: todo-list.tsx, smart-todo-list.tsx, progress-summary.tsx, admin/page.tsx

#### 2.5 Array Mutations
- `src/contexts/data-context.tsx:376` - Should use `[...history].sort()`

#### 2.6 Large Bundle Size
- `src/components/progress-summary.tsx` - Imports entire recharts library
- Multiple heavy dependencies: recharts, date-fns, @dnd-kit, @radix-ui

#### 2.7 Missing React.memo
- No React.memo used anywhere in the codebase

---

### 3. MEMORY LEAKS (Agent 3)

#### 3.1 setTimeout without cleanup (HIGH)
- **File:** `src/components/edit-user-dialog.tsx:43`
```typescript
setTimeout(() => { setError(""); setIsLoading(false); }, 200);
```
- **Issue:** If component unmounts before timeout, causes memory leak

- **File:** `src/components/contact-dialog.tsx:43`
- **Issue:** Same as above

#### 3.2 Toast timeout not cleaned up
- **File:** `src/hooks/use-toast.ts:60-76`
- **Issue:** Timeouts not cleared when toast is removed directly

---

### 4. ACCESSIBILITY ISSUES (Agent 4)

#### 4.1 Missing Aria-Labels on Icon-Only Buttons (HIGH)
- `src/components/smart-todo-list.tsx:131,133` - ChevronLeft/Right
- `src/components/progress-summary.tsx:273,275` - Date navigation
- `src/app/stopwatch/page.tsx:423` - Fullscreen button
- `src/app/clockify/page.tsx:403-404,728-730,1066` - Navigation buttons
- `src/app/admin/page.tsx:34,404-406,418-420,502` - Various buttons
- `src/app/expense-splitter/page.tsx:432,502,528` - Delete buttons

#### 4.2 Missing Form Labels (HIGH)
- `src/app/stopwatch/page.tsx:117-118` - Hours/Minutes inputs
- `src/app/expense-splitter/page.tsx:468,500-501` - Amount/Item inputs
- `src/components/backlog-planner.tsx:204,222,256,289` - Various inputs
- `src/app/clockify/page.tsx:1185,1189,1222` - Role/Note inputs

#### 4.3 Missing Semantic HTML
- `src/components/notes-writer.tsx:57` - div with onClick instead of button
- `src/components/add-chapter-dialog.tsx:132` - div with onClick instead of button

#### 4.4 Select Elements Without Labels
- `src/components/age-calculator.tsx:50,58,66`
- `src/app/stopwatch/page.tsx:121,129`
- `src/app/clockify/page.tsx:1171,1178`

---

### 5. REACT BEST PRACTICES (Agent 5)

#### 5.1 useState with Objects
- `src/components/age-calculator.tsx:91-92` - Using object state for dates

#### 5.2 Inline Functions as Props (89+ instances)
- Examples in settings, register, login, todo-list, smart-todo-list, progress-summary, stopwatch, clockify, admin

#### 5.3 Missing Key Props / Using Index as Key
- `src/app/clockify/page.tsx:782` - Using index as key
- Multiple files using index when unique ID available

#### 5.4 Components Too Large (>300 lines)
| File | Lines |
|------|-------|
| `src/app/clockify/page.tsx` | 1615 |
| `src/components/progress-summary.tsx` | 1181 |
| `src/app/admin/page.tsx` | 654 |
| `src/components/customization-sheet.tsx` | 615 |
| `src/app/expense-splitter/page.tsx` | 612 |
| `src/app/stopwatch/page.tsx` | 592 |
| `src/app/settings/page.tsx` | 470 |

#### 5.5 Incorrect useEffect Dependency Arrays
- `src/contexts/data-context.tsx:282` - State setters in deps causing infinite loops
- `src/app/stopwatch/page.tsx:103,154` - Missing deps
- `src/app/clockify/page.tsx:1129,1305,1330` - Various issues

---

### 6. ERROR HANDLING (Agent 6)

#### 6.1 Generic Error Messages (MEDIUM)
- `src/lib/auth.ts` - 9+ instances of generic "An unexpected error occurred"
- No specific guidance for users on how to fix issues

#### 6.2 Silently Swallowed Errors (LOW)
- `src/components/theme-script.tsx:18-20` - Empty catch block
- `src/app/expense-splitter/page.tsx:349-351` - Promise catch with no error info

#### 6.3 Using alert() for Errors (LOW)
- `src/components/question-timer.tsx:142`
- `src/components/pomodoro-timer.tsx:117`
- `src/components/live-clock.tsx:37`
- `src/app/stopwatch/page.tsx:252`

#### 6.4 Missing Error Boundaries (HIGH)
- No React Error Boundary components found in the codebase
- Entire app will crash with blank screen on any unhandled error

#### 6.5 Inconsistent Error Patterns
- Different error handling in admin page (setError vs throw)

---

### 7. TYPESCRIPT ISSUES (Agent 7)

#### 7.1 Overuse of `any` Type (15+ instances)
- `src/lib/auth.ts` - 14 instances
- `src/contexts/data-context.tsx` - 4 instances
- `src/app/admin/page.tsx` - 4 instances
- `src/lib/template-validator.ts` - Multiple instances

#### 7.2 Type Assertions That Could Be Avoided
- `src/lib/templates.ts:77,78,86` - Unnecessary as Timestamp/ProfileTemplate
- `src/components/ui/checkbox.tsx:30,33,47` - `(checked as any).status`
- `src/components/customization-sheet.tsx:309,310,323,324,362,363`

#### 7.3 Missing Return Types
- `src/lib/auth.ts:426` - signOut function
- `src/lib/template-validator.ts` - Multiple validator functions
- `src/hooks/use-toast.ts` - genId, dispatch

#### 7.4 Duplicate Properties
- `src/lib/types.ts:103-104` - JeeSubject has duplicate `tasks` property with @deprecated

---

### 8. UI/UX ISSUES (Agent 8)

#### 8.1 Inconsistent Button Styles
- `src/app/settings/page.tsx:401` - Uses LoaderCircle with custom animation
- `src/components/todo-list.tsx:227` - Inconsistent icon sizing

#### 8.2 Inconsistent Spacing/Margins
- Multiple files with inconsistent gap and padding values

#### 8.3 Missing Loading States
- `src/app/clockify/page.tsx:124-350` - ReportsView has no loading state
- `src/app/settings/page.tsx:393-398` - No skeleton during theme switching

#### 8.4 Missing Empty States
- `src/components/lecture-tracker.tsx:57-79` - No empty state for subjects
- `src/components/chapter-accordion-item.tsx:180-210` - No empty state for tasks

#### 8.5 Hardcoded Colors
- `src/components/progress-summary.tsx:205` - `|| '#ccc'`
- `src/app/clockify/page.tsx:181` - `|| '#cccccc'`
- `src/contexts/data-context.tsx:189-190` - Hardcoded Material Design colors
- `src/components/project-dialog.tsx:29-32` - Hardcoded colors instead of CSS variables

#### 8.6 Inconsistent Form Validation
- Login page: No inline validation - errors only in toast
- Register page: No inline validation for password requirements
- Add dialogs: Error shown but no field highlighting

---

### 9. UNUSED CODE (Agent 9)

#### 9.1 Unused Files
| File | Issue |
|------|-------|
| `src/lib/data.ts` | `subjects` export not used |
| `src/lib/feedback.ts` | `submitFeedback` function not used |

#### 9.2 Unused Functions
- `src/lib/auth.ts:406` - `sendPasswordResetByUsername`
- `src/lib/templates.ts` - 8 template functions not used
- `src/lib/template-validator.ts:681` - `getValidationSummary`

#### 9.3 Unused Imports
- `src/components/navbar.tsx` - CalendarDays imported but not used

---

### 10. CODE DUPLICATION (Agent 10)

#### 10.1 Identical Remove Dialog Components (HIGH)
Three nearly identical dialog components (~85% identical code):
- `src/components/remove-subject-dialog.tsx`
- `src/components/remove-profile-dialog.tsx`
- `src/components/remove-chapter-dialog.tsx`

**Recommendation:** Create generic `ConfirmationDialog` component

#### 10.2 Format Duration Functions (MEDIUM)
Multiple similar time formatting functions in:
- `src/app/clockify/page.tsx` - 5 functions
- `src/components/pomodoro-timer.tsx`
- `src/components/question-timer.tsx`

**Recommendation:** Create unified `src/lib/time-formatters.ts`

#### 10.3 Duplicate Form Validation Logic (MEDIUM)
- Trim + Empty checks repeated in 10+ files
- Duplicate name checks repeated in 6+ files

**Recommendation:** Create `src/lib/validation.ts`

#### 10.4 Repeated Dialog Patterns
13 dialog components share identical boilerplate

#### 10.5 Toast Message Patterns
Similar toast messages across 20+ files

---

## Recommendations Summary

### Critical Actions (Immediate)
1. Fix server-side authorization in admin actions
2. Add .env to .gitignore
3. Add Error Boundary components
4. Fix setTimeout cleanup in dialogs

### High Priority Actions
1. Add React.memo to list components
2. Wrap handlers with useCallback
3. Add aria-labels to icon-only buttons
4. Add visible labels to all form inputs
5. Fix useEffect dependency arrays
6. Create generic ConfirmationDialog component

### Medium Priority Actions
1. Add useMemo for expensive calculations
2. Fix array mutations
3. Replace any types with proper interfaces
4. Standardize loading states
5. Add empty states to components
6. Create time-formatters utility
7. Create validation utility
8. Split large components

### Low Priority Actions
1. Remove unused code
2. Replace alert() with toasts
3. Standardize button styles
4. Add focus-visible states

---

## Files Requiring Immediate Attention

| Priority | File | Issue |
|----------|------|-------|
| CRITICAL | `src/lib/admin.ts` | Missing server-side auth |
| CRITICAL | `.env` | Tracked by git |
| HIGH | `src/contexts/data-context.tsx` | Memory leaks, useEffect issues |
| HIGH | `src/components/edit-user-dialog.tsx` | setTimeout cleanup |
| HIGH | `src/components/contact-dialog.tsx` | setTimeout cleanup |
| HIGH | `src/app/settings/page.tsx` | Large component |
| HIGH | `src/app/clockify/page.tsx` | Largest component, 1615 lines |
| HIGH | `src/components/todo-list.tsx` | Performance issues |
| HIGH | `src/components/progress-summary.tsx` | Performance issues |

---

*Generated by 10 Agent Swarms - 2026-02-14*
