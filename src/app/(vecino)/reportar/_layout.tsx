import { Stack } from "expo-router";

export default function ReporteLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="cercanos" />
    </Stack>
  );
}
