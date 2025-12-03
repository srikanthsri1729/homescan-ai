import { ItemCategory } from '@/types/inventory';

export interface MockItem {
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
  createdAt: string;
  updatedAt: string;
}

export const mockItems: MockItem[] = [];

export const mockAnalytics = {
  totalItems: 0,
  totalValue: 0,
  lowStockItems: 0,
  expiringItems: 0,
  categoryBreakdown: [],
  monthlySpend: [],
};
