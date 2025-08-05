
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Kbd } from "./ui/kbd";

interface KeyboardShortcutsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const shortcuts = {
  "Global": [
    { keys: ['Cmd', '.'], description: "Toggle Customization Sidebar" },
    { keys: ['Cmd', ','], description: "Open Settings Page" },
    { keys: ['Esc'], description: "Close any open dialog or pop-up" },
  ],
  "Dashboard": [
    { keys: ['Cmd', '1/2/3'], description: "Switch between Subjects/Progress/Tools tabs" },
    { keys: ['Ctrl', '←/→'], description: "Cycle through Subject or Tool tabs" },
  ],
  "Notes Page": [
    { keys: ['Cmd', 'Shift', 'A'], description: "Create a New Note" },
    { keys: ['Cmd', 'S'], description: "Manually Save the Current Note" },
    { keys: ['Cmd', 'B'], description: "Format selected text as Bold" },
    { keys: ['Cmd', 'I'], description: "Format selected text as Italic" },
    { keys: ['Cmd', 'K'], description: "Convert selected text to a link" },
  ],
  "Dialogs & Forms": [
    { keys: ['Cmd', 'Enter'], description: "Submit form" },
  ],
};

export function KeyboardShortcuts({ open, onOpenChange }: KeyboardShortcutsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Boost your productivity with these keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4 -mr-4">
          {Object.entries(shortcuts).map(([category, items]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{category}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Command</TableHead>
                    <TableHead>Shortcut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((shortcut) => (
                    <TableRow key={shortcut.description}>
                      <TableCell>{shortcut.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {shortcut.keys.map(key => <Kbd key={key}>{key}</Kbd>)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

