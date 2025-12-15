import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  fridges: {
    id: string;
    code: string;
    name: string;
    location: string;
    address: string;
    status: 'active' | 'inactive' | 'maintenance';
    last_restocked: string;
    opening_hours: Record<string, string>;
    created_at: string;
    updated_at: string;
  };
  dishes: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'dessert';
    image_url: string;
    allergens: string[];
    labels: string[];
    nutritional_info: Record<string, any>;
    is_bestseller: boolean;
    created_at: string;
    updated_at: string;
  };
  fridge_inventory: {
    id: string;
    fridge_id: string;
    dish_id: string;
    stock: number;
    promotion_price: number | null;
    is_new: boolean;
    display_order: number;
    updated_at: string;
  };
  users: {
    id: string;
    email: string;
    phone: string | null;
    loyalty_points: number;
    loyalty_tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    favorite_fridges: string[];
    notification_preferences: {
      restock: boolean;
      promotions: boolean;
      games: boolean;
    };
    paygreen_card_id: string | null;
    paygreen_card_last4: string | null;
    paygreen_card_type: string | null;
    default_payment_method: 'nfc' | 'paygreen';
    created_at: string;
    last_active: string;
  };
  promotions: {
    id: string;
    title: string;
    description: string;
    type: 'discount' | 'happy_hour' | 'game' | 'contest';
    image_url: string | null;
    fridge_ids: string[] | null;
    start_date: string;
    end_date: string;
    discount_percentage: number | null;
    is_active: boolean;
    created_at: string;
  };
  orders: {
    id: string;
    user_id: string;
    fridge_id: string;
    dish_id: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    payment_method: 'apple_pay' | 'google_pay' | 'card' | 'nfc' | 'paygreen';
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
    payment_ref: string | null;
    unlock_code: string;
    unlock_expires_at: string;
    is_collected: boolean;
    collected_at: string | null;
    points_awarded: number;
    created_at: string;
    updated_at: string;
  };
};
