/**
 * Map tab — renders every approved Orvo business as a pin on an
 * interactive map. Taps push into `/business/[id]` so the tile is a
 * true second-class-citizen browse surface (alongside the Search tab).
 *
 * Data source: `public.businesses.address->>'lat'` and `.lng` written
 * by `npm run seed:demo`. The seed script jitters each business around
 * its host city center (Seattle or Asheville) so markers don't overlap.
 * Businesses without coordinates are silently omitted — the map still
 * renders, it just shows fewer pins.
 *
 * `react-native-maps` is bundled in Expo Go on SDK 54, so this tile
 * works without a custom dev client.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT, type Region } from 'react-native-maps';
import { useRouter } from 'expo-router';

import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/types';
import { OrvoTheme } from '@/constants/orvo-theme';

/**
 * Subset of `Business` we need for a map marker. Keeping this local
 * so the full `Business` type can grow without touching the map's
 * query shape.
 */
interface BusinessPin {
  id: string;
  name: string;
  slug: string;
  avg_rating: number;
  total_reviews: number;
  cover_image_url: string | null;
  address: Business['address'];
}

/**
 * Default map region when we have no pins yet. Centered on Seattle —
 * the larger of the two seeded host cities — with a wide enough delta
 * to keep both Seattle and Asheville in frame if the fit fails.
 */
const FALLBACK_REGION: Region = {
  latitude: 47.6062,
  longitude: -122.3321,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

/**
 * Compute a region that fits every pin with a 20% margin on each axis.
 * Falls back to the default Seattle region when the list is empty or
 * every pin is missing coordinates.
 */
function computeRegionForPins(pins: BusinessPin[]): Region {
  const coords = pins
    .map((p) => ({
      lat: p.address?.lat,
      lng: p.address?.lng,
    }))
    .filter(
      (c): c is { lat: number; lng: number } =>
        typeof c.lat === 'number' && typeof c.lng === 'number',
    );
  if (coords.length === 0) return FALLBACK_REGION;

  let minLat = coords[0].lat;
  let maxLat = coords[0].lat;
  let minLng = coords[0].lng;
  let maxLng = coords[0].lng;
  for (const c of coords) {
    minLat = Math.min(minLat, c.lat);
    maxLat = Math.max(maxLat, c.lat);
    minLng = Math.min(minLng, c.lng);
    maxLng = Math.max(maxLng, c.lng);
  }

  // At least 0.02° delta so a single pin (or two very close pins)
  // doesn't zoom the map to street level. 20% margin on both axes.
  const latDelta = Math.max(0.02, (maxLat - minLat) * 1.4);
  const lngDelta = Math.max(0.02, (maxLng - minLng) * 1.4);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

export default function MapTabScreen() {
  const router = useRouter();
  const [pins, setPins] = useState<BusinessPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('businesses')
        .select(
          'id, name, slug, avg_rating, total_reviews, cover_image_url, address',
        )
        .eq('approval_status', 'approved')
        .order('avg_rating', { ascending: false })
        .limit(100);
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const rows = ((data ?? []) as unknown as BusinessPin[]).filter(
        (b) =>
          b.address &&
          typeof b.address.lat === 'number' &&
          typeof b.address.lng === 'number',
      );
      setPins(rows);
      setLoading(false);
    })();
  }, []);

  const region = useMemo(() => computeRegionForPins(pins), [pins]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={OrvoTheme.accent} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.errorTitle}>Couldn&apos;t load map</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={false}
        showsCompass
        toolbarEnabled={false}
      >
        {pins.map((p) => {
          const lat = p.address?.lat;
          const lng = p.address?.lng;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;
          return (
            <Marker
              key={p.id}
              coordinate={{ latitude: lat, longitude: lng }}
              title={p.name}
              description={`★ ${Number(p.avg_rating).toFixed(1)} (${p.total_reviews} reviews)`}
              onCalloutPress={() =>
                router.push({
                  pathname: '/business/[id]',
                  params: { id: p.id },
                })
              }
            />
          );
        })}
      </MapView>

      <SafeAreaView style={styles.banner} pointerEvents="box-none">
        <Pressable
          style={styles.bannerInner}
          onPress={() => router.push('/(tabs)/search')}
        >
          <Text style={styles.bannerTitle}>
            {pins.length} local {pins.length === 1 ? 'business' : 'businesses'}
          </Text>
          <Text style={styles.bannerSubtitle}>
            Tap a pin to see services & book →
          </Text>
        </Pressable>
      </SafeAreaView>

      {pins.length === 0 && (
        <View style={styles.emptyBanner} pointerEvents="none">
          <Text style={styles.emptyText}>
            No businesses with coordinates yet. Run{' '}
            <Text style={styles.code}>npm run seed:demo</Text> to populate.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: OrvoTheme.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: OrvoTheme.background,
    padding: 24,
  },
  map: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bannerInner: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: OrvoTheme.background,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: OrvoTheme.foreground,
  },
  bannerSubtitle: {
    fontSize: 12,
    color: OrvoTheme.mutedForeground,
    marginTop: 2,
  },
  emptyBanner: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    padding: 16,
    borderRadius: 12,
    backgroundColor: OrvoTheme.background,
    borderWidth: 1,
    borderColor: OrvoTheme.border,
  },
  emptyText: {
    fontSize: 13,
    color: OrvoTheme.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
  code: {
    fontFamily: 'Menlo',
    fontSize: 12,
    color: OrvoTheme.foreground,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: OrvoTheme.foreground,
    marginBottom: 8,
  },
  errorBody: {
    fontSize: 13,
    color: OrvoTheme.mutedForeground,
    textAlign: 'center',
  },
});
