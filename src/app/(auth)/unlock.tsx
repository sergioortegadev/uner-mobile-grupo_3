import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";

const UnlockScreen = () => {
  const { unlock, usePasswordInstead } = useAuth();
  const [verificando, setVerificando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const intentoAutomatico = useRef(false);

  const verificar = async () => {
    setVerificando(true);
    setFallo(false);
    const ok = await unlock();
    // Si fue exitoso, el NavigationGuard redirige según el rol.
    if (!ok) {
      setFallo(true);
      setVerificando(false);
    }
  };

  // Lanza el prompt biométrico al abrir la pantalla (una sola vez).
  useEffect(() => {
    if (intentoAutomatico.current) return;
    intentoAutomatico.current = true;
    void verificar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Reporte Ciudadano</ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.texto}>
        Confirmá tu identidad con la huella del dispositivo para continuar.
      </ThemedText>
      {fallo ? (
        <ThemedText themeColor="danger" style={styles.texto}>
          ✖ No se pudo verificar tu identidad.
        </ThemedText>
      ) : null}
      <View style={styles.acciones}>
        <Button title="Usar huella" onPress={verificar} loading={verificando} />
        <Button title="Ingresar con usuario y contraseña" onPress={usePasswordInstead} disabled={verificando} />
      </View>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: Spacing.three,
  },
  texto: {
    textAlign: "center",
  },
  acciones: {
    width: "100%",
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
});

export default UnlockScreen;
