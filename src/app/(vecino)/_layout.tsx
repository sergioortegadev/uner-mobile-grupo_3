import { Icon } from "@/components/ui/icon";
import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VecinosLayout = () => {
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
          height: 60 + insets.bottom,
          paddingBottom: 4 + insets.bottom,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ size }) => <Icon name="map-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="reportar"
        options={{
          title: "Reportar",
          tabBarIcon: ({ size }) => <Icon name="add-circle-outline" size={size + 2} />,
        }}
      />
      <Tabs.Screen
        name="mis-reportes"
        options={{
          title: "Mis Reportes",
          tabBarIcon: ({ size }) => <Icon name="document-text-outline" size={size} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ size }) => <Icon name="person-circle-outline" size={size} />,
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

export default VecinosLayout;
