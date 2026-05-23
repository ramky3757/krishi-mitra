export type UserRole = 'farmer' | 'consumer' | 'admin';

export type KYCStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

export type FarmingMethod = 'organic' | 'conventional' | 'natural' | 'integrated';

export type CropCategory =
  | 'rice_paddy'
  | 'wheat_grains'
  | 'vegetables'
  | 'fruits'
  | 'pulses_legumes'
  | 'spices'
  | 'oilseeds'
  | 'dairy'
  | 'other';

export type ListingStatus =
  | 'draft'
  | 'pending_approval'
  | 'active'
  | 'fully_booked'
  | 'harvested'
  | 'completed'
  | 'cancelled';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'harvested'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export type CropMilestone =
  | 'sowing'
  | 'sprouting'
  | 'growing'
  | 'flowering'
  | 'pre_harvest'
  | 'harvest_ready';

export type PaymentType = 'advance' | 'final' | 'refund';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface User {
  id: string;
  phone: string;
  email?: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface FarmerProfile {
  user_id: string;
  kyc_status: KYCStatus;
  id_doc_url?: string;
  land_doc_url?: string;
  farm_geo_lat?: number;
  farm_geo_lng?: number;
  farm_address?: string;
  state: string;
  district: string;
  village?: string;
  verification_badges: string[];
  total_listings: number;
  avg_rating: number;
  completed_orders: number;
  bio?: string;
  user?: User;
}

export interface ConsumerProfile {
  user_id: string;
  address?: string;
  state?: string;
  district?: string;
  preferences?: string[];
  user?: User;
}

export interface CropListing {
  id: string;
  farmer_id: string;
  crop_category: CropCategory;
  crop_name: string;
  crop_variety?: string;
  farm_size_acres: number;
  total_yield_kg: number;
  available_qty_kg: number;
  booked_qty_kg: number;
  price_per_kg_advance: number;
  price_per_kg_final: number;
  advance_percentage: number;
  sowing_date: string;
  harvest_date: string;
  farming_method: FarmingMethod;
  pesticides_info?: string;
  is_zero_pesticide: boolean;
  water_source?: string;
  soil_type?: string;
  description?: string;
  status: ListingStatus;
  state: string;
  district: string;
  village?: string;
  geo_lat?: number;
  geo_lng?: number;
  created_at: string;
  farmer?: FarmerProfile;
  media?: ListingMedia[];
  progress_updates?: ProgressUpdate[];
}

export interface ListingMedia {
  id: string;
  listing_id: string;
  url: string;
  type: 'photo' | 'video';
  caption?: string;
  created_at: string;
}

export interface Booking {
  id: string;
  listing_id: string;
  consumer_id: string;
  qty_kg: number;
  advance_amount: number;
  final_amount: number;
  total_amount: number;
  status: BookingStatus;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  listing?: CropListing;
  consumer?: ConsumerProfile;
  payments?: Payment[];
  visits?: FarmVisit[];
}

export interface Payment {
  id: string;
  booking_id: string;
  type: PaymentType;
  amount: number;
  gateway_ref?: string;
  status: PaymentStatus;
  created_at: string;
}

export interface ProgressUpdate {
  id: string;
  listing_id: string;
  milestone: CropMilestone;
  note: string;
  photo_url?: string;
  created_at: string;
}

export interface FarmVisit {
  id: string;
  booking_id: string;
  requested_date: string;
  confirmed_date?: string;
  status: 'requested' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  sender?: User;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  tags?: string[];
  comment?: string;
  created_at: string;
  reviewer?: User;
}

export interface FilterOptions {
  category?: CropCategory;
  state?: string;
  district?: string;
  farming_method?: FarmingMethod;
  min_price?: number;
  max_price?: number;
  harvest_before?: string;
  is_zero_pesticide?: boolean;
  min_qty?: number;
}
