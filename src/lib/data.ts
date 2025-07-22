import type { Subject } from './types';

export const subjects: Omit<Subject, 'chapters' | 'tasks'>[] = [
  {
    name: 'Physics',
    icon: 'Zap',
  },
  {
    name: 'Chemistry',
    icon: 'FlaskConical',
  },
  {
    name: 'Maths',
    icon: 'Sigma',
  },
];
