import React from 'react';
import { 
  HardHat, 
  Package, 
  Zap, 
  Users, 
  Landmark, 
  Tag, 
  Layers
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  { 
    id: 'Builder / Contractor', 
    label: 'Builder / Contractor', 
    icon: HardHat, 
    color: '#ea580c', 
    bg: '#fff7ed', 
    border: '#ffedd5',
    tagClass: 'tag-cat-builder',
    desc: 'Contractor milestones, advances & builder stages'
  },
  { 
    id: 'Materials', 
    label: 'Materials', 
    icon: Package, 
    color: '#2563eb', 
    bg: '#eff6ff', 
    border: '#dbeafe',
    tagClass: 'tag-cat-materials',
    desc: 'Cement, steel, sand, bricks, aggregate, tiles'
  },
  { 
    id: 'Electrical & Plumbing', 
    label: 'Electrical & Plumbing', 
    icon: Zap, 
    color: '#0891b2', 
    bg: '#ecfeff', 
    border: '#cffafe',
    tagClass: 'tag-cat-electric',
    desc: 'Wiring, pipes, fittings, sanitary, switches'
  },
  { 
    id: 'Labor / Workers', 
    label: 'Labor / Workers', 
    icon: Users, 
    color: '#7c3aed', 
    bg: '#f5f3ff', 
    border: '#ede9fe',
    tagClass: 'tag-cat-labor',
    desc: 'Daily wages, carpenter, painter, helpers'
  },
  { 
    id: 'Government / Approvals', 
    label: 'Government / Approvals', 
    icon: Landmark, 
    color: '#059669', 
    bg: '#ecfdf5', 
    border: '#d1fae5',
    tagClass: 'tag-cat-gov',
    desc: 'Panchayat/Corporation plan permits, taxes, electricity board'
  },
  { 
    id: 'Others', 
    label: 'Others', 
    icon: Tag, 
    color: '#64748b', 
    bg: '#f8fafc', 
    border: '#e2e8f0',
    tagClass: 'tag-cat-others',
    desc: 'Miscellaneous, site transport, water tanker, tools'
  }
];

export const CATEGORY_IDS = EXPENSE_CATEGORIES.map(c => c.id);

export function getCategoryMeta(categoryName) {
  const found = EXPENSE_CATEGORIES.find(c => c.id === categoryName || c.label === categoryName);
  return found || {
    id: categoryName || 'Others',
    label: categoryName || 'Others',
    icon: Tag,
    color: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
    tagClass: 'tag-cat-others'
  };
}
