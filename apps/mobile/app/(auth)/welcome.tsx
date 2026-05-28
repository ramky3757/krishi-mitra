import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Button, Snackbar, Chip } from 'react-native-paper';
import { useAuthStore } from '@/stores/authStore';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CAROUSEL_H = Math.min(Math.round(SCREEN_H * 0.55), 540);

// Swap these URLs for real Unsplash/Pexels farm photos when you have them.
// e.g. https://images.unsplash.com/photo-<id>?w=1200&auto=format&fit=crop
const SLIDES = [
  {
    // Lush green terraced rice paddy fields
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=1200&auto=format&fit=crop&q=80',
    eyebrow: 'Farm to kitchen',
    title: 'Know your farmer',
    body: 'Trace your food from seed to plate, directly from verified Indian farms.',
  },
  {
    // Farmer proudly holding freshly harvested vegetables
    image: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=1200&auto=format&fit=crop&q=80',
    eyebrow: 'Meet the grower',
    title: 'Real farmers, real food',
    body: 'Every farmer is identity-verified with govt ID, land records and GPS farm location.',
  },
  {
    // Vibrant fresh vegetables and produce at harvest
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200&auto=format&fit=crop&q=80',
    eyebrow: 'Pre-book the harvest',
    title: 'Own your share',
    body: 'Reserve months before harvest with just 20% advance. Closer to harvest? Pay more, get it sooner.',
  },
  {
    // Farm field crops growing — progress tracking
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&auto=format&fit=crop&q=80',
    eyebrow: 'Watch it grow',
    title: 'Live crop updates',
    body: 'Get milestone photos straight from the farm — sowing, sprouting, harvest-ready.',
  },
  {
    // Fresh produce at local market — abundance of vegetables
    image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1200&auto=format&fit=crop&q=80',
    eyebrow: 'No middlemen',
    title: 'Direct from source',
    body: 'Cut out the chain. Farmers earn more, you pay less — and get fresher produce.',
  },
  {
    // Happy family enjoying home-cooked meal together
    image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=1200&auto=format&fit=crop&q=80',
    eyebrow: 'Fresh to your kitchen',
    title: 'Your family deserves better',
    body: 'Pesticide info, soil type, water source — you know exactly what goes on your plate.',
  },
];

const TEST_ACCOUNTS = [
  { label: 'Admin', email: 'admin@harvestbond.test', password: 'admin1234' },
  { label: 'Farmer', email: 'farmer@harvestbond.test', password: 'farmer1234' },
  { label: 'Consumer', email: 'consumer@harvestbond.test', password: 'consumer1234' },
];

export default function WelcomeScreen() {
  const { signInWithPassword } = useAuthStore();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const userInteracting = useRef(false);

  // Auto-advance every 4 seconds
  useEffect(() => {
    const id = setInterval(() => {
      if (userInteracting.current) return;
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * SCREEN_W, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== activeSlide) setActiveSlide(idx);
  };

  const quickLogin = async (label: string, email: string, password: string) => {
    setLoadingRole(label);
    setErrorMsg(null);
    try {
      await signInWithPassword(email, password);
      // Route directly by label so dev chips always land in the right section
      // regardless of what role is stored in the DB for test accounts.
      if (label === 'Admin') router.replace('/(admin)/listings');
      else if (label === 'Farmer') router.replace('/(farmer)/dashboard');
      else router.replace('/(consumer)/home');
    } catch (e: any) {
      setErrorMsg(`${label}: ${e?.message ?? 'Unknown error'}`);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f2417' }}>
      <StatusBar style="light" />

      {/* Carousel */}
      <View style={{ height: CAROUSEL_H, width: SCREEN_W }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => { userInteracting.current = true; }}
          onScrollEndDrag={() => {
            setTimeout(() => { userInteracting.current = false; }, 4000);
          }}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width: SCREEN_W, height: CAROUSEL_H }}>
              <Image
                source={{ uri: s.image }}
                style={{ width: SCREEN_W, height: CAROUSEL_H }}
                resizeMode="cover"
              />
              {/* Slide 1: farmer badge pinned to bottom-left, field stays fully visible */}
              {i === 0 && (
                <View style={{
                  position: 'absolute', bottom: 100, left: 24,
                  flexDirection: 'row', alignItems: 'center', gap: 10,
                }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: 'rgba(255,255,255,0.18)',
                    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 30 }}>🧑‍🌾</Text>
                  </View>
                  <View style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
                  }}>
                    <Text style={{ color: '#bbf7d0', fontSize: 12, fontWeight: '800' }}>Verified Indian Farmer</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 }}>ID · Land · GPS verified</Text>
                  </View>
                </View>
              )}
              {/* Top scrim for status bar legibility */}
              <LinearGradient
                colors={['rgba(15,36,23,0.55)', 'transparent']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120 }}
              />
              {/* Bottom scrim for text legibility */}
              <LinearGradient
                colors={['transparent', 'rgba(15,36,23,0.4)', 'rgba(15,36,23,1)']}
                locations={[0, 0.5, 1]}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: CAROUSEL_H * 0.7 }}
              />

              {/* Slide text */}
              <View style={{ position: 'absolute', bottom: 24, left: 24, right: 24 }}>
                <Text style={{ color: '#bbf7d0', fontSize: 11, letterSpacing: 2, fontWeight: '700', textTransform: 'uppercase' }}>
                  {s.eyebrow}
                </Text>
                <Text style={{ color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 }}>
                  {s.title}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8, lineHeight: 20 }}>
                  {s.body}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Brand badge over carousel */}
        <View style={{ position: 'absolute', top: 52, left: 24, right: 24, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.18)',
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
          }}>
            <Text style={{ fontSize: 22 }}>🌾</Text>
          </View>
          <View>
            <Text
              style={{
                color: '#fff',
                fontSize: 30,
                fontWeight: '900',
                letterSpacing: -1,
                lineHeight: 32,
                textShadowColor: 'rgba(0,0,0,0.55)',
                textShadowOffset: { width: 0, height: 2 },
                textShadowRadius: 8,
              }}
            >
              Krishi<Text style={{ color: '#bbf7d0', fontWeight: '900' }}> Mitra</Text>
            </Text>
            <Text
              style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: 10,
                letterSpacing: 3.5,
                fontWeight: '700',
                marginTop: 2,
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
            >
              FROM  SEED  TO  KITCHEN
            </Text>
          </View>
        </View>

        {/* Pagination dots */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          flexDirection: 'row', justifyContent: 'center', paddingBottom: 6,
        }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeSlide ? 18 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeSlide ? '#fff' : 'rgba(255,255,255,0.45)',
                marginHorizontal: 3,
              }}
            />
          ))}
        </View>
      </View>

      {/* Bottom panel */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24, justifyContent: 'space-between' }}>
        {/* Feature row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <Feature icon="🧑‍🌾" label="Verified" />
          <Feature icon="📦" label="Pre-book" />
          <Feature icon="🌱" label="Track" />
          <Feature icon="🚜" label="Visit" />
        </View>

        {/* CTAs */}
        <View style={{ gap: 12, alignItems: 'center' }}>
          <Button
            mode="contained"
            onPress={() => router.push('/(auth)/phone')}
            buttonColor="#ffffff"
            textColor="#14532d"
            icon="email-outline"
            labelStyle={{ fontWeight: '700', fontSize: 15 }}
            contentStyle={{ paddingHorizontal: 24, height: 52 }}
            style={{ borderRadius: 999, alignSelf: 'stretch' }}
          >
            Get started / Sign in
          </Button>

          {__DEV__ && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '700', letterSpacing: 1.5 }}>
                DEV
              </Text>
              {TEST_ACCOUNTS.map((acc) => {
                const isLoading = loadingRole === acc.label;
                return (
                  <Chip
                    key={acc.label}
                    onPress={() => quickLogin(acc.label, acc.email, acc.password)}
                    disabled={loadingRole !== null}
                    icon={isLoading ? undefined : 'login'}
                    compact
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderColor: 'rgba(255,255,255,0.25)',
                    }}
                    textStyle={{ color: '#fff', fontSize: 11, fontWeight: '600' }}
                  >
                    {isLoading ? '…' : acc.label}
                  </Chip>
                );
              })}
            </View>
          )}

          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textAlign: 'center', marginTop: 2 }}>
            By continuing, you agree to our Terms and Privacy Policy
          </Text>
        </View>
      </View>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg(null)}
        duration={6000}
        action={{ label: 'Dismiss', onPress: () => setErrorMsg(null) }}
        style={{ backgroundColor: '#7f1d1d' }}
      >
        {errorMsg ?? ''}
      </Snackbar>
    </View>
  );
}

function Feature({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <View style={{
        width: 44, height: 44, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 6, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}
