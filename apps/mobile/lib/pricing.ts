import { supabase } from './supabase';

export type CropStage = 'pre_sowing' | 'sowed' | 'growing' | 'pre_harvest' | 'ready_now';

export type PlatformConfig = {
  farmer_fee_pct: number;
  consumer_fee_pct: number;
  default_delivery_charge_per_kg: number;
  free_pickup_enabled: boolean;
  advance_pct_pre_sowing: number;
  advance_pct_sowed: number;
  advance_pct_growing: number;
  advance_pct_pre_harvest: number;
  advance_pct_ready_now: number;
};

const DEFAULT_CONFIG: PlatformConfig = {
  farmer_fee_pct: 8,
  consumer_fee_pct: 3,
  default_delivery_charge_per_kg: 15,
  free_pickup_enabled: true,
  advance_pct_pre_sowing: 20,
  advance_pct_sowed: 30,
  advance_pct_growing: 40,
  advance_pct_pre_harvest: 60,
  advance_pct_ready_now: 100,
};

export function advancePctForStage(stage: CropStage | null | undefined, config: PlatformConfig): number {
  switch (stage) {
    case 'sowed': return config.advance_pct_sowed;
    case 'growing': return config.advance_pct_growing;
    case 'pre_harvest': return config.advance_pct_pre_harvest;
    case 'ready_now': return config.advance_pct_ready_now;
    case 'pre_sowing':
    default:
      return config.advance_pct_pre_sowing;
  }
}

export const STAGE_LABELS: Record<CropStage, { label: string; emoji: string; description: string }> = {
  pre_sowing:  { emoji: '🌱', label: 'Pre-sowing',  description: 'Crop is planned, not yet sown' },
  sowed:       { emoji: '🌾', label: 'Sowed',       description: 'Seeds in the ground' },
  growing:     { emoji: '🌿', label: 'Growing',     description: 'Crop actively growing' },
  pre_harvest: { emoji: '🌸', label: 'Pre-harvest', description: 'Flowering / nearing harvest' },
  ready_now:   { emoji: '✅', label: 'Ready Now',   description: 'Harvested, ready to deliver' },
};

let cachedConfig: PlatformConfig | null = null;

export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (cachedConfig) return cachedConfig;
  const { data } = await supabase
    .from('platform_config')
    .select('*')
    .eq('id', 1)
    .maybeSingle();
  cachedConfig = { ...DEFAULT_CONFIG, ...(data as Partial<PlatformConfig> | null) };
  return cachedConfig;
}

export type PriceBreakdown = {
  qtyKg: number;
  pricePerKg: number;
  subtotal: number;
  deliveryCharge: number;
  consumerFee: number;
  farmerFee: number;
  totalConsumerPays: number;   // subtotal + delivery + consumer fee
  farmerPayout: number;        // subtotal - farmer fee
  advanceAmount: number;
  balanceAmount: number;       // total - advance
};

export function computePriceBreakdown(opts: {
  qtyKg: number;
  pricePerKg: number;
  deliveryMethod: 'pickup' | 'delivery';
  config: PlatformConfig;
  advancePct: number;          // e.g. 25
}): PriceBreakdown {
  const subtotal = +(opts.qtyKg * opts.pricePerKg).toFixed(2);
  const deliveryCharge =
    opts.deliveryMethod === 'delivery'
      ? +(opts.qtyKg * opts.config.default_delivery_charge_per_kg).toFixed(2)
      : 0;
  const consumerFee = +(subtotal * (opts.config.consumer_fee_pct / 100)).toFixed(2);
  const farmerFee = +(subtotal * (opts.config.farmer_fee_pct / 100)).toFixed(2);
  const totalConsumerPays = +(subtotal + deliveryCharge + consumerFee).toFixed(2);
  const farmerPayout = +(subtotal - farmerFee).toFixed(2);
  const advanceAmount = Math.ceil(totalConsumerPays * (opts.advancePct / 100));
  const balanceAmount = +(totalConsumerPays - advanceAmount).toFixed(2);

  return {
    qtyKg: opts.qtyKg,
    pricePerKg: opts.pricePerKg,
    subtotal,
    deliveryCharge,
    consumerFee,
    farmerFee,
    totalConsumerPays,
    farmerPayout,
    advanceAmount,
    balanceAmount,
  };
}
