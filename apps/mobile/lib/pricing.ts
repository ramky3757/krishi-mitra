import { supabase } from './supabase';

export type PlatformConfig = {
  farmer_fee_pct: number;
  consumer_fee_pct: number;
  default_delivery_charge_per_kg: number;
  free_pickup_enabled: boolean;
};

const DEFAULT_CONFIG: PlatformConfig = {
  farmer_fee_pct: 8,
  consumer_fee_pct: 3,
  default_delivery_charge_per_kg: 15,
  free_pickup_enabled: true,
};

let cachedConfig: PlatformConfig | null = null;

export async function getPlatformConfig(): Promise<PlatformConfig> {
  if (cachedConfig) return cachedConfig;
  const { data } = await supabase
    .from('platform_config')
    .select('farmer_fee_pct, consumer_fee_pct, default_delivery_charge_per_kg, free_pickup_enabled')
    .eq('id', 1)
    .maybeSingle();
  cachedConfig = (data as PlatformConfig) ?? DEFAULT_CONFIG;
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
