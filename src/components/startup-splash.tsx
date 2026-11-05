import { coloresOficiales, Colors } from "@/constants/theme";
import * as SplashScreen from "expo-splash-screen";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const NATIVE_SPLASH_FADE_MS = 500;
const ENTRANCE_DURATION_MS = 750;
const MIN_BRAND_SPLASH_MS = 2_500;
const EXIT_DURATION_MS = 350;
const NATIVE_BACKGROUND = Colors.dark.background;

// Debe ejecutarse en el ámbito global para que Expo no oculte la splash antes del primer render.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: NATIVE_SPLASH_FADE_MS, fade: true });

interface StartupSplashProps {
  /** Indica que AuthProvider terminó de restaurar o descartar la sesión inicial. */
  isReady: boolean;
}

type SplashAsset = "nativeLogo" | "logo" | "illustration";

export function StartupSplash({ isReady }: StartupSplashProps) {
  const { width, height } = useWindowDimensions();
  const [layoutReady, setLayoutReady] = useState(false);
  const [loadedAssetCount, setLoadedAssetCount] = useState(0);
  const [brandShownAt, setBrandShownAt] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);
  const started = useRef(false);
  const exiting = useRef(false);
  const loadedAssets = useRef<Record<SplashAsset, boolean>>({ nativeLogo: false, logo: false, illustration: false });

  const [nativeLayerOpacity] = useState(() => new Animated.Value(1));
  const [brandLayerOpacity] = useState(() => new Animated.Value(0));
  const [logoTranslateY] = useState(() => new Animated.Value(-height * 0.35));
  const [illustrationTranslateY] = useState(() => new Animated.Value(height * 0.72));
  const [textOpacity] = useState(() => new Animated.Value(0));

  const illustrationWidth = width;
  //const illustrationHeight = height * 0.865;
  //const illustrationHeight = Math.min(height * 0.72, width * (980 / 668));
  const illustrationHeight = Math.min(height, width * (1920 / 1080));
  const logoWidth = Math.min(width * 0.9, 350);

  const markAssetLoaded = (asset: SplashAsset) => {
    if (loadedAssets.current[asset]) return;
    loadedAssets.current[asset] = true;
    setLoadedAssetCount((count) => count + 1);
  };

  useEffect(() => {
    if (!layoutReady || loadedAssetCount < 3 || started.current) return;
    started.current = true;

    // La vista oscura debajo replica la imagen nativa; el handoff no deja ver una pantalla vacía.
    void SplashScreen.hideAsync();
    Animated.parallel([
      Animated.timing(nativeLayerOpacity, {
        toValue: 0,
        duration: NATIVE_SPLASH_FADE_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(brandLayerOpacity, {
        toValue: 1,
        duration: ENTRANCE_DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 680,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(illustrationTranslateY, {
        toValue: 0,
        duration: ENTRANCE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 300,
        delay: 480,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setBrandShownAt(Date.now());
    });
  }, [
    brandLayerOpacity,
    illustrationTranslateY,
    layoutReady,
    loadedAssetCount,
    logoTranslateY,
    nativeLayerOpacity,
    textOpacity,
  ]);

  useEffect(() => {
    if (!isReady || brandShownAt === null || exiting.current) return;

    const remaining = Math.max(0, MIN_BRAND_SPLASH_MS - (Date.now() - brandShownAt));
    const timeout = setTimeout(() => {
      if (exiting.current) return;
      exiting.current = true;
      Animated.timing(brandLayerOpacity, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setVisible(false);
      });
    }, remaining);

    return () => clearTimeout(timeout);
  }, [brandLayerOpacity, brandShownAt, isReady]);

  if (!visible) return null;

  return (
    <View pointerEvents="none" onLayout={() => setLayoutReady(true)} style={styles.root}>
      <Animated.View style={[styles.nativeReplica, { opacity: nativeLayerOpacity }]}>
        <Image
          source={require("@/assets/guale/muni-logo.png")}
          contentFit="contain"
          style={styles.nativeLogo}
          onLoad={() => markAssetLoaded("nativeLogo")}
          onError={() => markAssetLoaded("nativeLogo")}
        />
      </Animated.View>

      <Animated.View style={[styles.brandSplash, { opacity: brandLayerOpacity }]}>
        <Animated.View
          style={[
            styles.illustrationWrap,
            {
              width: illustrationWidth,
              height: illustrationHeight,
              transform: [{ translateY: illustrationTranslateY }],
            },
          ]}
        >
          <Image
            source={require("@/assets/guale/guale_ilus.png")}
            contentFit="contain"
            style={StyleSheet.absoluteFill}
            onLoad={() => markAssetLoaded("illustration")}
            onError={() => markAssetLoaded("illustration")}
          />
        </Animated.View>

        <Animated.View
          style={[styles.logoWrap, { top: Math.max(24, height * 0.125), transform: [{ translateY: logoTranslateY }] }]}
        >
          <Image
            source={require("@/assets/guale/logo-gualeactiva.png")}
            contentFit="contain"
            style={{ width: logoWidth, height: logoWidth * (180 / 437) }}
            onLoad={() => markAssetLoaded("logo")}
            onError={() => markAssetLoaded("logo")}
          />
        </Animated.View>

        <Animated.View style={[styles.titleBlock, { opacity: textOpacity }]}>
          <Text style={styles.title}>Reporte Ciudadano</Text>
          <Text style={styles.version}>v1.0</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    backgroundColor: NATIVE_BACKGROUND,
  },
  nativeReplica: {
    ...StyleSheet.absoluteFill,
    backgroundColor: NATIVE_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  nativeLogo: {
    width: 128,
    height: 128,
  },
  brandSplash: {
    ...StyleSheet.absoluteFill,
    overflow: "hidden",
    backgroundColor: coloresOficiales.fontoSplash,
    alignItems: "center",
  },
  illustrationWrap: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
  logoWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  titleBlock: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 30,
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  version: {
    color: "#FFFFFF",
    fontSize: 10,
    lineHeight: 24,
    fontWeight: "400",
  },
});
