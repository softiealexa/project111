'use client';

import {
  Book,
  Zap,
  FlaskConical,
  Sigma,
  Atom,
  Brain,
  Code,
  Dna,
  Globe,
  Microscope,
  Calculator,
  TestTube2,
  type LucideIcon,
} from 'lucide-react';

export const iconMap: Record<string, LucideIcon> = {
  Book,
  Zap,
  FlaskConical,
  Sigma,
  Atom,
  Brain,
  Code,
  Dna,
  Globe,
  Microscope,
  Calculator,
  TestTube2,
};

export const iconNames = Object.keys(iconMap);

export const getIconComponent = (name?: string | null): LucideIcon => {
  if (name && name in iconMap) {
    return iconMap[name];
  }
  return Book;
};
