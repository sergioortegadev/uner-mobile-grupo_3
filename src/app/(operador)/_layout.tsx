import { Icon } from "@/components/ui/icon";
import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const OperadorLayout = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: coloresOficiales.primario,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.backgroundElement,
          height: 50 + insets.bottom,
          paddingBottom: 4 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bandeja",
          tabBarIcon: ({ size }) => (
            <Icon name="file-tray-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa Zonas",
          tabBarIcon: ({ size }) => <Icon name="map-outline" size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="escanear"
        options={{
          title: "Escanear",
          tabBarIcon: ({ size }) => <Icon name="qr-code-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ size }) => (
            <Icon name="person-circle-outline" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="reporte/[id]"
        options={{
          href: null, // Oculto del TabBar, navegable mediante Stack
        }}
      />
    </Tabs>
  );
};

export default OperadorLayout;
