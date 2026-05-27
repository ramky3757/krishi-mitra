// Krishi Mitra — Terms & Conditions
// Update the TERMS_VERSION when content changes; existing users will be
// prompted to re-accept on their next login or critical action.

export const TERMS_VERSION = '1.0.0';
export const TERMS_LAST_UPDATED = '2026-05-27';

export type TermsKey = 'common' | 'farmer' | 'consumer' | 'privacy';

export const TERMS: Record<TermsKey, { title: string; sections: Array<{ heading: string; body: string }> }> = {
  common: {
    title: 'Terms of Service',
    sections: [
      {
        heading: '1. About Krishi Mitra',
        body: 'Krishi Mitra ("Platform") is operated by TARA TECHMONKS, a registered partnership firm. The Platform is an online marketplace that connects verified Indian farmers directly with consumers for the pre-booking of agricultural produce. We facilitate transactions but do NOT take ownership of any inventory at any stage.',
      },
      {
        heading: '2. Eligibility',
        body: 'You must be at least 18 years of age and a resident of India to use this Platform. By creating an account you confirm that all information you provide is accurate and that you accept these Terms.',
      },
      {
        heading: '3. Account & KYC',
        body: 'Both farmers and consumers must complete identity verification (KYC) before they can list crops or place bookings. We may reject or revoke KYC at our discretion if information is incomplete, fraudulent, or inconsistent. Each user is responsible for keeping their account credentials secure.',
      },
      {
        heading: '4. Platform Fees',
        body: 'The Platform charges a commission on every completed transaction. Current rates: 8% from the farmer (deducted from payout) and 3% from the consumer (added at checkout). Delivery charges, if applicable, are separate. These rates are subject to change with 30 days notice.',
      },
      {
        heading: '5. Acceptable Use',
        body: 'You agree NOT to use the Platform to: (a) list or buy items that violate Indian law; (b) misrepresent yourself, your produce, or your location; (c) attempt to circumvent the platform fee by transacting offline; (d) harass other users; (e) reverse-engineer or scrape the Platform.',
      },
      {
        heading: '6. Dispute Resolution',
        body: 'Disputes between farmers and consumers should first be reported via the in-app dispute flow. The Platform will attempt mediation in good faith but is not legally obligated to compensate either side beyond what these Terms explicitly state. Unresolved disputes are subject to the jurisdiction of courts in Hyderabad, Telangana, India.',
      },
      {
        heading: '7. Limitation of Liability',
        body: 'The Platform is provided "as is" without warranties. We are not liable for crop quality, weather damage, delivery delays caused by third parties, or any indirect or consequential damages. Our maximum liability in any case is limited to the platform fees we have collected from the transaction in question.',
      },
      {
        heading: '8. Modifications',
        body: 'We may update these Terms from time to time. Material changes will be notified by email or in-app banner at least 7 days before they take effect. Continued use of the Platform after that constitutes acceptance.',
      },
      {
        heading: '9. Contact',
        body: 'For any concerns or grievances, contact us at support@krishimitra.app. Grievance officer details and response timelines are available on request as per the Information Technology Rules, 2021.',
      },
    ],
  },

  farmer: {
    title: 'Farmer Terms',
    sections: [
      {
        heading: '1. Listing Standards',
        body: 'You agree to list only crops that you have genuinely sown or will sow on land you own/lease. Photos must be of your actual farm. Quantities, prices, and harvest dates must be honest estimates. Listings found to be false will be removed and your account may be suspended.',
      },
      {
        heading: '2. Forward Contract Commitment',
        body: 'A consumer booking is a FIXED FORWARD CONTRACT. Once a consumer pre-books a quantity at the agreed price, you must deliver that quantity at that price, regardless of how the market price moves. The Platform will not negotiate price changes after booking. If market prices rise, both sides benefit from the contract\'s certainty.',
      },
      {
        heading: '3. Commission',
        body: 'The Platform charges 8% on the subtotal of each completed transaction. This is automatically deducted before payout. You retain 92% of the listed crop value.',
      },
      {
        heading: '4. Payout Schedule',
        body: 'Payouts are released in milestones tied to crop progress:\n• 30% of your payout: released 48 hours after the buyer\'s advance payment\n• 40% of your payout: released when you mark the crop as "Sowed" with a photo proof\n• 30% of your payout: released 48 hours after the consumer confirms delivery\n\nThe 48-hour delays exist to protect against cancellations during the cooling/dispute windows.',
      },
      {
        heading: '5. Crop Progress Updates',
        body: 'You are required to post progress updates (photo + note) at each major stage: Sowed, Growing, Pre-harvest, Ready Now. Failure to update for more than 30 days during the growing cycle may result in the booking being flagged for review.',
      },
      {
        heading: '6. Delivery',
        body: 'If the consumer chose "Pickup", they will come to your farm at a mutually agreed time. If they chose "Home Delivery", the Platform arranges shipping; you must hand over the produce to the courier within the agreed window. Damages during shipping are the courier\'s responsibility.',
      },
      {
        heading: '7. Cancellation by You',
        body: 'You may cancel a listing before any bookings are confirmed. Once a booking exists, you cannot unilaterally cancel. If extraordinary circumstances (severe weather, crop failure) require cancellation, contact support immediately — partial refunds to consumers will be facilitated and your account standing will not be penalised for genuine cases.',
      },
      {
        heading: '8. Consumer Cancellation — What You Keep',
        body: 'If a consumer cancels after harvest (per the consumer\'s refund policy, they receive 0% refund), you keep all payouts received plus the physical crop, which you may sell elsewhere. The Platform will help you re-list the harvested crop with waived listing fees.',
      },
      {
        heading: '9. Account Suspension',
        body: 'Repeated late deliveries, false listings, or quality complaints may lead to account suspension. We will notify you of any issues and give you a chance to respond before suspending your ability to list new crops.',
      },
    ],
  },

  consumer: {
    title: 'Consumer Terms',
    sections: [
      {
        heading: '1. Pre-booking is a Commitment',
        body: 'When you place a booking, you enter a binding agreement to purchase the agreed quantity at the agreed price. The farmer plans their resources based on your commitment. Cancellations carry refund tiers as per Section 3.',
      },
      {
        heading: '2. Advance Payment',
        body: 'The advance percentage varies by the crop\'s stage at booking:\n• Pre-sowing: 20% advance\n• Sowed: 30% advance\n• Growing: 40% advance\n• Pre-harvest: 60% advance\n• Ready Now: 100% advance\n\nThe balance is paid on pickup or delivery, except for "Ready Now" bookings which are fully paid upfront.',
      },
      {
        heading: '3. Refund Policy',
        body: 'Refunds are tiered based on when you cancel:\n• Within 48 hours of booking: 100% refund\n• After 48 hours, before sowing: 80% refund\n• After sowing, before flowering: 50% refund\n• After flowering, before harvest: 25% refund\n• After harvest: 0% refund\n\nRefunds protect both sides: lower percentages cover the farmer\'s investment in growing your crop.',
      },
      {
        heading: '4. Platform Fee',
        body: 'A 3% platform fee is added to your subtotal. This covers payment processing, farmer verification, and dispute resolution. Delivery charges (if you chose home delivery) are separate.',
      },
      {
        heading: '5. KYC Required',
        body: 'You must complete profile KYC (full name, mobile, address, government ID) before placing your first booking. This protects against fraud and ensures we can deliver to a real address.',
      },
      {
        heading: '6. Quality Expectations',
        body: 'You agree that agricultural produce is subject to natural variation in size, color, and minor blemishes. Material quality issues (rotten produce, contaminated, significantly underweight) can be raised via the in-app dispute flow within 48 hours of delivery. The Platform will mediate fairly.',
      },
      {
        heading: '7. Re-sale Restriction',
        body: 'Crops bought through the Platform are for personal/household consumption or for the buyer\'s own business use. Bulk re-selling without disclosure violates our marketplace rules. If you are a bulk buyer (restaurant, retailer), please use our Bulk Buyer program.',
      },
      {
        heading: '8. Address Accuracy',
        body: 'You are responsible for providing an accurate delivery address. Failed deliveries due to wrong addresses or absence at the agreed time will not be refunded; redelivery, if available, may incur additional charges.',
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. What We Collect',
        body: 'We collect: your name, email, mobile number, address, government ID document (for KYC), profile photo (optional), payment information (handled by Cashfree, not stored by us), and your activity on the Platform (bookings, ratings, messages).',
      },
      {
        heading: '2. How We Use It',
        body: 'Your data is used to: verify your identity, facilitate transactions, deliver orders, send relevant notifications, improve the Platform, and comply with legal obligations. We do not sell your data to third parties for marketing.',
      },
      {
        heading: '3. Who We Share It With',
        body: 'Limited information is shared with: the other party in a transaction (e.g., farmer sees consumer\'s name + delivery address only after booking is confirmed), payment processors (Cashfree), logistics partners (Shiprocket etc. when delivery is selected), and law enforcement if legally required.',
      },
      {
        heading: '4. How Long We Keep It',
        body: 'Account data is retained as long as your account is active plus 1 year after deletion for legal/tax compliance. KYC documents are retained for 5 years as required by Indian law. Anonymized usage analytics may be retained longer.',
      },
      {
        heading: '5. Your Rights',
        body: 'You can: access your data (export from profile), correct inaccuracies (edit in profile), delete your account (write to support@krishimitra.app). Some data may be retained where required by law.',
      },
      {
        heading: '6. Security',
        body: 'We use industry-standard security: HTTPS encryption, secure cloud hosting (Supabase, AWS Mumbai region), encrypted password storage, and limited internal access to personal data. No system is 100% secure; please use a strong password and notify us immediately of suspicious activity.',
      },
      {
        heading: '7. Cookies & Analytics',
        body: 'The website uses essential cookies for authentication and analytics cookies (anonymized) to understand usage patterns. You can clear cookies in your browser settings, but this may affect your login experience.',
      },
      {
        heading: '8. Children',
        body: 'The Platform is not intended for users under 18. We do not knowingly collect data from minors. If you believe a minor has created an account, please contact support.',
      },
    ],
  },
};

export function termsContentForRole(role: 'farmer' | 'consumer' | null | undefined): TermsKey[] {
  if (role === 'farmer') return ['common', 'farmer', 'privacy'];
  if (role === 'consumer') return ['common', 'consumer', 'privacy'];
  return ['common', 'privacy'];
}
