import { StartupSplash } from "@/components/startup-splash";
import { LoadingState } from "@/components/ui/state-views";
import { AuthProvider, useAuth } from "@/context/auth-context";
import { useAutoSync } from "@/hooks/use-auto-sync";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { configureForegroundHandler } from "@/services/notifications";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { StatusBar, useColorScheme } from "react-native";

// Una sola vez, al cargar la app: cómo se muestran las push con la app abierta.
configureForegroundHandler();

const PushNotificationsBridge = () => {
  usePushNotifications();
  return null;
};

const NavigationGuard = () => {
  const { user, isLoading, isLocked } = useAuth();
  const segments = useSegments() as string[];
  const router = useRouter();
  const currentSegment = segments[0];
  const isInAuthGroup = currentSegment === "(auth)" || currentSegment === "login";
  const isInVecinoGroup = currentSegment === "(vecino)";
  const isInOperadorGroup = currentSegment === "(operador)";

  const isInUnlock = isInAuthGroup && segments[1] === "unlock";

  useEffect(() => {
    if (isLoading) return;

    if (isLocked) {
      if (!isInUnlock) {
        router.replace("/(auth)/unlock" as any);
      }
      return;
    }

    if (!user) {
      if (!isInAuthGroup || isInUnlock) {
        router.replace("/(auth)/login" as any);
      }
      return;
    }

    if (user.rol === "vecino" && !isInVecinoGroup) {
      router.replace("/(vecino)" as any);
      return;
    }

    if (user.rol === "operador" && !isInOperadorGroup) {
      router.replace("/(operador)" as any);
      return;
    }
  }, [user, isLoading, isLocked, isInAuthGroup, isInUnlock, isInVecinoGroup, isInOperadorGroup, router]);

  if (isLoading) {
    return <LoadingState message="Verificando sesión..." />;
  }

  return <Slot />;
};

const StartupFlow = () => {
  const { isLoading } = useAuth();

  return (
    <>
      <StartupSplash isReady={!isLoading} />
      <NavigationGuard />
    </>
  );
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  useAutoSync()
  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar barStyle={colorScheme === "dark" ? "light-content" :"dark-content"} />
      <AuthProvider>
        <PushNotificationsBridge />
        <StartupFlow />
      </AuthProvider>
    </ThemeProvider>
  );
}
