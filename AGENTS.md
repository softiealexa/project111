# StudyTracker - Agent Guidelines

## Build & Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code (ESLint)
npm run lint

# Type check (TypeScript)
npm run typecheck

# Run single test (if testing framework added)
npm test -- --testNamePattern="test name"
```

## Project Overview

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth
- **Path Alias**: `@/*` maps to `./src/*`

## Code Style Guidelines

### Imports

```typescript
// Order: external libs → internal imports → local components/utils
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useData } from '@/contexts/data-context';
import Navbar from '@/components/navbar';
```

- Use `@/` for all internal imports
- Group imports by type (React, Next.js, UI components, lib, components)
- Use explicit imports (no barrel files unless necessary)

### Types

- Use TypeScript strict mode (`strict: true` in tsconfig.json)
- Always define prop interfaces for components
- Use existing types from `@/lib/types.ts`
- Prefer `interface` over `type` for object shapes
- Use generic types when appropriate

```typescript
// Good
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

// Good - use existing types
import type { Subject, Chapter } from '@/lib/types';
const { activeProfile } = useData(); // Profile type from context
```

### Naming Conventions

- **Components**: PascalCase (`DashboardPage`, `SyllabusChapterItem`)
- **Files**: kebab-case (`landing-page-client.tsx`, `data-context.tsx`)
- **Functions**: camelCase (`handleSave`, `formatDuration`)
- **Constants**: PascalCase for component variants, SCREAMING_SNAKE_CASE for config
- **Interfaces/Types**: PascalCase (`TimeEntry`, `Profile`)

### Formatting

- Use 2 spaces for indentation
- Use double quotes for strings in JSX, single quotes elsewhere
- Add trailing commas in multi-line objects/arrays
- Use semicolons

```typescript
// Good
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};
```

### React Patterns components with arrow

- Use functional functions or `function` keyword
- Use `'use client'` directive for client-side components
- Use `useMemo` for expensive calculations
- Use `useCallback` for memoized callbacks passed as props
- Use `useEffect` for side effects, include cleanup
- Prefer composition over inheritance

```typescript
// Client component pattern
'use client';

import { useState, useCallback } from 'react';

interface Props {
  onSave: (data: string) => void;
}

export default function MyComponent({ onSave }: Props) {
  const [value, setValue] = useState('');

  const handleSave = useCallback(() => {
    onSave(value);
  }, [onSave, value]);

  return <button onClick={handleSave}>Save</button>;
}
```

### Tailwind CSS

- Use utility classes from shadcn/ui design system
- Use `cn()` utility for conditional class merging
- Follow responsive design patterns (`md:`, `lg:` prefixes)
- Use design tokens via CSS variables (e.g., `bg-primary`, `text-muted-foreground`)

```typescript
import { cn } from '@/lib/utils';

// Good
<div className={cn(
  "flex items-center gap-2",
  isActive && "bg-primary/10",
  className
)} />
```

### Error Handling

- Use try/catch for async operations
- Display user-friendly error messages via toast
- Log errors appropriately (console.error for debugging)
- Handle loading and empty states

```typescript
try {
  await saveData(data);
  toast({ title: "Success" });
} catch (error) {
  console.error("Failed to save:", error);
  toast({ title: "Error", description: "Failed to save data", variant: "destructive" });
}
```

### Firebase/Firestore

- Use the data context (`useData()`) for all data operations
- Never expose Firebase config keys on client
- Use server timestamps for time-sensitive data
- Handle loading and error states from context

### shadcn/ui Components

- Import components from `@/components/ui/{component-name}`
- Use composable components (Slot pattern with `asChild`)
- Follow Radix UI patterns for composition
- Check component props in type definitions

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── page.tsx        # Landing (server component)
│   ├── layout.tsx      # Root layout
│   ├── dashboard/      # Dashboard routes
│   ├── syllabus/       # Syllabus page
│   ├── notes/         # Notes page
│   └── ...
├── components/
│   ├── ui/            # shadcn/ui components
│   ├── navbar.tsx     # Navigation
│   └── ...
├── contexts/
│   └── data-context.tsx # Main state (Firebase)
├── hooks/             # Custom hooks
├── lib/
│   ├── types.ts      # TypeScript interfaces
│   ├── utils.ts      # Helper functions
│   ├── firebase.ts   # Firebase config
│   └── ...
└── public/           # Static assets
```

## Key Conventions

1. **No comments** unless for complex logic (per user request)
2. **Prefer early returns** to reduce nesting
3. **Use constants** for magic numbers (e.g., `3600` for seconds in hour)
4. **Keep components focused** - single responsibility
5. **Extract reusable logic** into custom hooks
6. **Use enums** for fixed sets of values when appropriate
7. **Always run `npm run typecheck`** before committing

## Working with Branches

- **Development**: Work on `dev` branch
- **Production**: Push only stable code to `master`
- **Branch naming**: Use descriptive names (e.g., `feature/add-notes`, `fix/clockify-bug`)
