import React from 'react';
import { BLOOM_LABELS, BLOOM_COLORS } from '../utils/bloomColors';

interface Props {
  level: number;
  size?: 'sm' | 'md';
}

export const BloomBadge: React.FC<Props> = ({ level, size = 'sm' }) => {
  const label = BLOOM_LABELS[level] ?? `L${level}`;
  const color = BLOOM_COLORS[level] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${color}`}>
      {label}
    </span>
  );
};
