import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { MaxContentWidth, Spacing } from "@/constants/theme";
import { useAuth } from "@/context/auth-context";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from "react-native";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ErroresLogin = {
  email?: string;
  password?: string;
};

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState<ErroresLogin>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

   const passwordInputRef = useRef<TextInput>(null);

  const iniciarSesion = async () => {
    const emailLimpio = email.trim();
    const nuevosErrores: ErroresLogin = {};

    if (!emailLimpio) {
      nuevosErrores.email = "Ingresá tu correo electrónico.";
    } else if (!EMAIL_REGEX.test(emailLimpio)) {
      nuevosErrores.email = "El correo electrónico no es válido.";
    }

    if (!password) {
      nuevosErrores.password = "Ingresá tu contraseña.";
    }

    setErrores(nuevosErrores);
    setErrorGeneral(null);
    if (Object.keys(nuevosErrores).length > 0) return;

    setCargando(true);
    try {
      // Al actualizarse el usuario en el contexto, el NavigationGuard redirige según el rol.
      await login({ email: emailLimpio, password });
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ThemedView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Iniciar Sesión</ThemedText>

          <View style={styles.form}>
            <Input
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              error={errores.email}
              submitBehavior="submit"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              disabled={cargando}
            />
            <PasswordInput
              label="Contraseña"
              value={password}
              returnKeyType="done"
              ref={passwordInputRef}
              onChangeText={setPassword}
              error={errores.password}
              autoComplete="password"
              disabled={cargando}
            />

            {errorGeneral ? (
              <ThemedText themeColor="danger" style={styles.errorGeneral}>
                ✖ {errorGeneral}
              </ThemedText>
            ) : null}

            <Button title="Iniciar sesión" onPress={iniciarSesion} loading={cargando} />
          </View>

          <ThemedText type="default" themeColor="textSecondary" style={styles.textoRegistro}>
            Si no tiene cuenta:
          </ThemedText>
          <Button title="Registrarse" onPress={() => router.push("/(auth)/register")} disabled={cargando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: Spacing.three,
  },
  form: {
    width: "100%",
    maxWidth: MaxContentWidth,
    marginTop: Spacing.three,
  },
  errorGeneral: {
    marginBottom: Spacing.three,
  },
  textoRegistro: {
    textAlign: "center",
  },
});

export default LoginScreen;
