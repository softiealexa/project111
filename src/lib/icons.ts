
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
  Pi,
  FunctionSquare,
  Languages,
  FileText,
  Lightbulb,
  Magnet,
  Clock,
  LayoutGrid,
  BarChart2,
  Activity,
  Briefcase,
  Users,
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
  Pi,
  FunctionSquare,
  Languages,
  FileText,
  Lightbulb,
  Magnet,
  Clock,
  LayoutGrid,
  BarChart2,
  Activity,
  Briefcase,
  Users,
};

export const iconNames = Object.keys(iconMap);

export const getIconComponent = (name?: string | null): LucideIcon => {
  if (name && name in iconMap) {
    return iconMap[name];
  }
  return Book;
};
