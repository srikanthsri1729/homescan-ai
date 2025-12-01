export interface InventoryItem {
  id: string;
  name: string;
  category: ItemCategory;
  quantity: number;
  unit: string;
  location: string;
  purchaseDate?: string;
  expiryDate?: string;
  price?: number;
  imageUrl?: string;
  notes?: string;
  barcode?: string;
  createdAt: string;
  updatedAt: string;
}

export type ItemCategory = 
  | 'food'
  | 'beverages'
  | 'cleaning'
  | 'personal-care'
  | 'electronics'
  | 'kitchen'
  | 'clothing'
  | 'medicine'
  | 'office'
  | 'other';

export interface CategoryInfo {
  id: ItemCategory;
  name: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'food', name: 'Food', icon: '🍎', color: 'hsl(0 72% 51%)' },
  { id: 'beverages', name: 'Beverages', icon: '🥤', color: 'hsl(200 72% 51%)' },
  { id: 'cleaning', name: 'Cleaning', icon: '🧹', color: 'hsl(142 76% 36%)' },
  { id: 'personal-care', name: 'Personal Care', icon: '🧴', color: 'hsl(262 83% 58%)' },
  { id: 'electronics', name: 'Electronics', icon: '📱', color: 'hsl(220 72% 51%)' },
  { id: 'kitchen', name: 'Kitchen', icon: '🍳', color: 'hsl(38 92% 50%)' },
  { id: 'clothing', name: 'Clothing', icon: '👕', color: 'hsl(320 72% 51%)' },
  { id: 'medicine', name: 'Medicine', icon: '💊', color: 'hsl(0 72% 65%)' },
  { id: 'office', name: 'Office', icon: '📎', color: 'hsl(45 72% 51%)' },
  { id: 'other', name: 'Other', icon: '📦', color: 'hsl(174 72% 40%)' },
];

export const getCategoryInfo = (id: ItemCategory): CategoryInfo => {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
};
