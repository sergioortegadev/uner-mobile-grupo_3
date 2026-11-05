import { AvisosToggle } from "@/components/perfil/avisos-toggle";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { StyleSheet, View } from "react-native";

const PerfilOperadorScreen = () => {
  const { user, logout } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{user?.nombre}</ThemedText>
      <View style={styles.placeholder} />
      <ThemedText type="default" themeColor="textSecondary" style={styles.text}>
        Operador: Zona asignada: {user?.zonaId || "Sin zona"}
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
  text: {
    textAlign: "center",
  },
  placeholder: {
    height: 50,
  },
});

export default PerfilOperadorScreen;
