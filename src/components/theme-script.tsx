"use client";

import React from 'react';

// This script is injected into the <head> to prevent a flash of unstyled content (FOUC)
// It runs before the React app is hydrated to set the theme from localStorage
const script = `
(function() {
  try {
    const mode = localStorage.getItem('trackacademic_mode');
    // Default to dark mode if no preference is found
    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {
    // Ignore errors, default theme will be applied
  }
})();
`;

export function ThemeScript() {
  // Using dangerouslySetInnerHTML is safe here because the script is static and controlled by us
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
