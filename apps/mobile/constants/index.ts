import { CropCategory, FarmingMethod, CropMilestone } from '@/types';

export const CROP_CATEGORIES: { value: CropCategory; label: string; emoji: string }[] = [
  { value: 'rice_paddy', label: 'Rice & Paddy', emoji: '🌾' },
  { value: 'wheat_grains', label: 'Wheat & Grains', emoji: '🌽' },
  { value: 'vegetables', label: 'Vegetables', emoji: '🥬' },
  { value: 'fruits', label: 'Fruits', emoji: '🍎' },
  { value: 'pulses_legumes', label: 'Pulses & Legumes', emoji: '🫘' },
  { value: 'spices', label: 'Spices', emoji: '🌶️' },
  { value: 'oilseeds', label: 'Oilseeds', emoji: '🌻' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'other', label: 'Other', emoji: '🌿' },
];

export const FARMING_METHODS: { value: FarmingMethod; label: string; description: string }[] = [
  { value: 'organic', label: 'Organic', description: 'Certified organic farming, no synthetic chemicals' },
  { value: 'natural', label: 'Natural', description: 'Natural farming without chemical inputs' },
  { value: 'conventional', label: 'Conventional', description: 'Standard farming with approved inputs' },
  { value: 'integrated', label: 'Integrated', description: 'Integrated pest & crop management' },
];

export const CROP_MILESTONES: { value: CropMilestone; label: string; description: string }[] = [
  { value: 'sowing', label: 'Sowing', description: 'Seeds have been sown in the field' },
  { value: 'sprouting', label: 'Sprouting', description: 'Seeds have germinated and sprouted' },
  { value: 'growing', label: 'Growing', description: 'Crop is actively growing' },
  { value: 'flowering', label: 'Flowering', description: 'Crop has started flowering' },
  { value: 'pre_harvest', label: 'Pre-Harvest', description: 'Crop is approaching harvest stage' },
  { value: 'harvest_ready', label: 'Harvest Ready', description: 'Crop is ready to be harvested' },
];

export const VERIFICATION_BADGES: { key: string; label: string; color: string }[] = [
  { key: 'id_verified', label: 'ID Verified', color: '#16a34a' },
  { key: 'land_verified', label: 'Land Verified', color: '#2563eb' },
  { key: 'location_verified', label: 'Location Verified', color: '#7c3aed' },
  { key: 'trusted_farmer', label: 'Trusted Farmer', color: '#d97706' },
];

export const REVIEW_TAGS = [
  'Quality', 'Freshness', 'Packaging', 'Responsiveness',
  'Accuracy', 'On-time', 'Honest', 'Great Experience',
];

export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Puducherry',
];

export const ADVANCE_PERCENTAGE_OPTIONS = [25, 30];

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending Confirmation',
  confirmed: 'Confirmed',
  in_progress: 'Crop Growing',
  harvested: 'Harvested',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  disputed: 'Under Dispute',
};

export const COLORS = {
  primary: '#1a6b3c',
  primaryLight: '#22c55e',
  secondary: '#d97706',
  background: '#f9fafb',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  error: '#dc2626',
  success: '#16a34a',
  warning: '#f59e0b',
};
