# Template Management System - TODO

## Completed ✅

1. **Core Types & Infrastructure** - COMPLETED
   - Template TypeScript types in `src/lib/types.ts`
   - CRUD operations in `src/lib/templates.ts`
   - JSON validator in `src/lib/template-validator.ts`
   - Firestore security rules updated

2. **Admin Template Manager Page** - COMPLETED
   - `src/app/admin/templates/page.tsx` - Full admin interface
   - Tabs: Popular/New/All templates
   - Template cards with stats
   - Category filters
   - Search functionality

3. **Visual Template Builder** - COMPLETED
   - `src/components/template-manager/visual-builder/`
   - subject-section.tsx
   - chapter-list.tsx
   - topic-editor.tsx
   - template-preview.tsx
   - visual-builder.tsx

4. **Code Editor for JSON** - COMPLETED
   - `src/components/template-manager/code-editor/`
   - code-editor.tsx
   - error-panel.tsx
   - format-button.tsx
   - json-editor-dialog.tsx
   - index.ts

## Pending ❌

### Phase 2 - Import/Export (Not Completed)
- ❌ import-dialog.tsx - Import JSON from file/paste/share code
- ❌ export-dialog.tsx - Export template as JSON
- ❌ share-code-dialog.tsx - Share code display/copy
- ❌ template-import.tsx - Combined import component

### Phase 3 - User Template Selection (Not Completed)
- ❌ Update create-profile-screen.tsx - Add template selection step
- ❌ Update add-profile-dialog.tsx - Add template dropdown
- ❌ Update data-context.tsx - addProfile with template support
- ❌ Create template-selector.tsx - Reusable template selector

## Implementation Plan

### For Pending Tasks:

#### Import/Export Dialogs:
1. Create `src/components/template-manager/import-export/import-dialog.tsx`
   - File upload + drag-drop
   - JSON textarea paste
   - Share code input
   - Real-time validation preview

2. Create `src/components/template-manager/import-export/export-dialog.tsx`
   - Download as .json
   - Copy to clipboard
   - Raw JSON display

3. Create `src/components/template-manager/import-export/share-code-dialog.tsx`
   - Display share code
   - Copy button
   - QR code generation

#### User Template Selection:
1. Update `src/contexts/data-context.tsx`
   - Add templateId parameter to addProfile
   - Call cloneTemplateSubjects()
   - Increment usage count

2. Update `src/components/create-profile-screen.tsx`
   - Add template selection step after name
   - Template cards grid
   - Preview modal

3. Create `src/components/template-selector.tsx`
   - Reusable component
   - Card grid layout
   - Filter tabs
   - Preview modal

## Estimated Time
- Import/Export: 2-3 hours
- User Selection: 2-3 hours

## Notes
- Admin page and builders are working
- Need to wire up the UI to backend functions
- Test the full flow from admin creation to user selection
