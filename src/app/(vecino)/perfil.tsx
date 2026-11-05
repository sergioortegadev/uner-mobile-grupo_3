import { AvisosToggle } from "@/components/perfil/avisos-toggle";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { StyleSheet, View } from "react-native";

const PerfilVecinoScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{user?.nombre ?? "Juanito Perez"}</ThemedText>
      <View style={styles.placeholder} />
      <ThemedText type="default" themeColor="textSecondary">
        Vecino
      </ThemedText>
      <View style={styles.placeholder} />
      <AvisosToggle />
      <View style={styles.placeholder} />
      <Button title="Cerrar Sesión" onPress={logout} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  placeholder: {
    height: 50,
  },
});

export default PerfilVecinoScreen;
