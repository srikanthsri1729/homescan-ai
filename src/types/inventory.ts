export type ItemCategory = 
  | 'food'
  | 'beverages'
  | 'cleaning'
  | 'personal'
  | 'electronics'
  | 'kitchen'
  | 'furniture'
  | 'clothing'
  | 'medicine'
  | 'office'
  | 'documents'
  | 'other';

export interface CategoryInfo {
  id: ItemCategory;
  name: string;
  icon: string;
  color: string;
  defaultImage: string;
}

// Default images for each category (using emoji-based SVG placeholders)
export const CATEGORIES: CategoryInfo[] = [
  { id: 'food', name: 'Food', icon: '🍎', color: 'hsl(0 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', color: 'hsl(200 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', color: 'hsl(142 76% 36%)', defaultImage: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=200&h=200&fit=crop' },
  { id: 'personal', name: 'Personal Care', icon: '🧴', color: 'hsl(262 83% 58%)', defaultImage: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&h=200&fit=crop' },
  { id: 'electronics', name: 'Electronics', icon: '📱', color: 'hsl(220 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&h=200&fit=crop' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: 'hsl(38 92% 50%)', defaultImage: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop' },
  { id: 'furniture', name: 'Furniture', icon: '🛋️', color: 'hsl(30 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop' },
  { id: 'clothing', name: 'Clothing', icon: '👕', color: 'hsl(320 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=200&h=200&fit=crop' },
  { id: 'medicine', name: 'Medicine', icon: '💊', color: 'hsl(0 72% 65%)', defaultImage: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop' },
  { id: 'office', name: 'Office', icon: '📎', color: 'hsl(45 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&h=200&fit=crop' },
  { id: 'documents', name: 'Documents', icon: '📄', color: 'hsl(210 72% 51%)', defaultImage: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=200&h=200&fit=crop' },
  { id: 'other', name: 'Other', icon: '📦', color: 'hsl(174 72% 40%)', defaultImage: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&h=200&fit=crop' },
];

export const getCategoryInfo = (id: ItemCategory): CategoryInfo => {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
};

export const getDefaultImageForCategory = (category: ItemCategory): string => {
  return getCategoryInfo(category).defaultImage;
};
