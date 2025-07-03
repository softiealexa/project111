import type { Subject } from './types';
import { Zap, FlaskConical, Sigma } from 'lucide-react';

export const subjects: Subject[] = [
  {
    name: 'Physics',
    icon: Zap,
    chapters: [
      { name: 'Units & Dimensions', lectureCount: 3 },
      { name: 'Kinematics', lectureCount: 5 },
      { name: 'Laws of Motion', lectureCount: 6 },
      { name: 'Work, Power, Energy', lectureCount: 4 },
      { name: 'Rotational Motion', lectureCount: 7 },
      { name: 'Gravitation', lectureCount: 4 },
    ],
  },
  {
    name: 'Chemistry',
    icon: FlaskConical,
    chapters: [
      { name: 'Mole Concept', lectureCount: 5 },
      { name: 'Atomic Structure', lectureCount: 6 },
      { name: 'Periodic Table', lectureCount: 4 },
      { name: 'Chemical Bonding', lectureCount: 7 },
      { name: 'States of Matter', lectureCount: 3 },
      { name: 'Thermodynamics', lectureCount: 5 },
    ],
  },
  {
    name: 'Maths',
    icon: Sigma,
    chapters: [
      { name: 'Basic Maths & Logarithms', lectureCount: 4 },
      { name: 'Quadratic Equations', lectureCount: 5 },
      { name: 'Sequences & Series', lectureCount: 5 },
      { name: 'Trigonometry', lectureCount: 8 },
      { name: 'Straight Lines', lectureCount: 6 },
      { name: 'Circles', lectureCount: 6 },
    ],
  },
];
