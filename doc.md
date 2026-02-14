# StudyTracker - Project Documentation

## Overview

**StudyTracker** is a comprehensive study management web application built with Next.js 15, Firebase, and Tailwind CSS. It helps students track their study progress, manage subjects, take notes, track time spent studying, and manage expenses with friends.

---

## Technology Stack

- **Framework**: Next.js 15 (with App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Recharts
- **Markdown**: react-markdown with KaTeX support
- **State Management**: React Context API

---

## Pages Overview

### 1. Landing Page (`/`)
- **Status**: ✅ Developed
- **Description**: Public landing page with image gallery and app introduction
- **Features**: Dynamic image loading from `/public/img` folder

### 2. Login (`/login`)
- **Status**: ✅ Developed
- **Description**: User authentication page for existing users

### 3. Register (`/register`)
- **Status**: ✅ Developed
- **Description**: New user registration page

### 4. Dashboard (`/dashboard`)
- **Status**: ✅ Developed
- **Description**: Main hub showing overview of all study activities
- **Features**:
  - Tab-based navigation (Subjects, Todo, Planner, Links, Pomodoro, etc.)
  - Progress visualization with charts
  - Quick access to all features

### 5. Syllabus (`/syllabus`)
- **Status**: ✅ Developed
- **Description**: Subject-wise syllabus checklist tracker
- **Features**:
  - Add/remove subjects with custom icons
  - Chapter-wise progress tracking
  - Checkbox states: unchecked, checked, checked-red
  - Deadline tracking per chapter
  - Mini countdown timer
  - Live clock display
- **Notes**: Requires subjects to be added via Customization panel

### 6. JEE Syllabus (`/jee-syllabus`)
- **Status**: ✅ Developed
- **Description**: Specialized syllabus tracker for JEE exam preparation
- **Features**:
  - Physics, Chemistry, Math subjects
  - Chapter-wise task management

### 7. Notes (`/notes`)
- **Status**: ✅ Developed
- **Description**: Markdown note-taking application
- **Features**:
  - Markdown rendering with live preview
  - KaTeX support for mathematical formulas
  - GFM (GitHub Flavored Markdown) support
  - Keyboard shortcuts (Ctrl+S to save, Ctrl+B bold, Ctrl+I italic, Ctrl+K link)
  - Note organization with titles
  - Auto-save functionality

### 8. Stopwatch (`/stopwatch`)
- **Status**: ✅ Developed
- **Description**: Advanced study timer with session tracking
- **Features**:
  - Start/stop/reset functionality
  - Subject-wise time tracking
  - Break tracking
  - Daily study goal with progress bar
  - Weekly and monthly reports with charts
  - Manual time entry for forgotten sessions
  - Lap timer
  - Fullscreen mode
  - Calendar view with study data

### 9. Clockify (`/clockify`)
- **Status**: ⚠️ Partially Developed / Needs Improvements
- **Description**: Time tracking and timesheet management (inspired by Clockify)
- **Features**:
  - **Timer View**: Start/stop time tracking
  - **Calendar View**: Calendar-based time entry visualization
  - **Timesheet View**: Weekly/monthly timesheet grid
  - **Reports View**: Time reports with charts and filters
  - **Projects Management**: Create and manage projects with colors
  - **Team Management**: Add team members and shifts
  - **Schedule View**: Weekly schedule with shifts
  - **Time Off**: Leave management with policies
- **Issues**:
  - Project Details view shows "Feature Not Implemented" placeholder
  - Some features may need refinement

### 10. Expense Splitter (`/expense-splitter`)
- **Status**: ✅ Developed
- **Description**: Split expenses with friends
- **Features**:
  - Multiple expense groups (e.g., trips, roommates)
  - Equal split mode
  - Individual items mode (per person items)
  - Balance calculation
  - Settlement plan generation
  - Share summary to clipboard
  - Import/export group data

### 11. Settings (`/settings`)
- **Status**: ✅ Developed
- **Description**: User account and app settings
- **Features**:
  - **Profile Tab**: Username, email, Google account linking
  - **Appearance Tab**: Theme selection (7 themes), Light/Dark mode
  - **Account Tab**: Keyboard shortcuts reference, contact developer, logout
  - **Data Tab**: Export/Import data as JSON

### 12. Admin (`/admin`)
- **Status**: ⚠️ Under Development
- **Description**: Admin panel for managing users and feedback
- **Features** (planned):
  - View all users
  - Manage feedback/submissions
  - User statistics

---

## Core Features

### 1. Authentication
- Email/password registration and login via Firebase Auth
- Google account linking support
- Session management

### 2. Profile Management
- Multiple profiles support (stored in Firestore)
- Active profile selection
- Profile customization

### 3. Subject Management
- Add/remove subjects with icons
- Subject-specific chapters
- Custom icons from Lucide React

### 4. Data Persistence
- All data stored in Firebase Firestore
- Export/Import functionality (JSON format)
- Real-time sync across devices

### 5. Theme System
- 7 color themes: Teal, Zinc, Rose, Blue, Green, Violet, Lavender
- Light and Dark mode support

---

## Components Library

The project uses shadcn/ui components including:
- Button, Card, Dialog, Dropdown Menu
- Tabs, Toast, Tooltip
- Calendar, Date Picker
- Form inputs, Select, Checkbox
- Progress, Slider, Switch
- Table, Scroll Area
- Avatar, Badge, Separator

---

## Known Issues / To Fix

1. **Clockify - Project Details**: Shows placeholder "Feature Not Implemented"
2. **Clockify - Some Views**: May need UI polish and bug fixes
3. **Admin Page**: Limited functionality, needs development
4. **Customization Sheet**: Some edge cases may need handling

---

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx          # Landing page
│   ├── dashboard/        # Main dashboard
│   ├── syllabus/         # Subject syllabus tracker
│   ├── jee-syllabus/    # JEE specific tracker
│   ├── notes/           # Markdown notes
│   ├── stopwatch/       # Study timer
│   ├── clockify/        # Time tracking
│   ├── expense-splitter/# Expense splitting
│   ├── settings/        # App settings
│   ├── login/           # Auth
│   ├── register/        # Auth
│   └── admin/           # Admin panel
├── components/           # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── navbar.tsx      # Main navigation
│   └── ...
├── contexts/            # React Context providers
│   └── data-context.tsx # Main data state
├── hooks/               # Custom React hooks
├── lib/                 # Utilities
│   ├── types.ts        # TypeScript types
│   ├── firebase.ts     # Firebase config
│   ├── auth.ts         # Auth utilities
│   ├── utils.ts        # Helper functions
│   └── ...
└── public/img/         # Static images
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project (Firestore + Auth enabled)

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

---

## Recent Commit History

- `a65146e` - Testing-Git
- `25b0ac4` - Fix React Server Components CVE vulnerabilities
- `56f8018` - Try fixing this error: `Runtime ReferenceError: DialogTrigger is not defined`
- `6d4b1e6` - Try fixing this error: `Runtime ReferenceError: AlertDialogTrigger is not defined`
- `a6ebbec` - UI improvements to add new subject controls
- `5deda41` - UI is good but functions not working
- `26a0625` - Add delete subject functionality
- `5e21d52` - Gap reduction between subjects and chapters

---

## Notes

- All branches (master, main, dev) are currently synchronized at the same commit
- Development work should be done on the `dev` branch
- Only production-ready code should be pushed to `master`
- The project uses server-side rendering with client-side interactivity
