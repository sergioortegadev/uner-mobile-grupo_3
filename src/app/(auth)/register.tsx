import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { RegistroUsuarioDTO } from '@/types';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DNI_REGEX = /^\d{7,8}$/;
const PASSWORD_MIN_LENGTH = 6;

type ErroresRegistro = {
  nombre?: string;
  dni?: string;
  email?: string;
  password?: string;
};

const RegisterScreen = () => {
  const { register } = useAuth();
  const { bottom, top } = useSafeAreaInsets();
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const dniInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const telefonoInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const registrarse = async () => {
    const nombreLimpio = nombre.trim();
    const dniLimpio = dni.trim();
    const emailLimpio = email.trim();
    const telefonoLimpio = telefono.trim();
    const nuevosErrores: ErroresRegistro = {};

    if (!nombreLimpio) {
      nuevosErrores.nombre = 'Ingresá tu nombre.';
    }

    if (dniLimpio && !DNI_REGEX.test(dniLimpio)) {
      nuevosErrores.dni = 'El DNI debe tener 7 u 8 dígitos.';
    }

    if (!emailLimpio) {
      nuevosErrores.email = 'Ingresá tu correo electrónico.';
    } else if (!EMAIL_REGEX.test(emailLimpio)) {
      nuevosErrores.email = 'El correo electrónico no es válido.';
    }

    if (!password) {
      nuevosErrores.password = 'Ingresá una contraseña.';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      nuevosErrores.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    }

    setErrores(nuevosErrores);
    setErrorGeneral(null);
    if (Object.keys(nuevosErrores).length > 0) return;

    const datos: RegistroUsuarioDTO = {
      nombre: nombreLimpio,
      email: emailLimpio,
      password,
      telefono: telefonoLimpio || null,
      ...(dniLimpio ? { dni: dniLimpio } : {}),
    };

    setCargando(true);
    try {
      // Al actualizarse el usuario en el contexto, el NavigationGuard redirige según el rol.
      await register(datos);
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'No se pudo completar el registro.');
    } finally {
      setCargando(false);
    }
  };

  const volverAlLogin = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login');
    }
  };


  return (
    <ThemedView style={[styles.flex, { paddingTop: top }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: bottom }]}
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText type="title">Crear Cuenta</ThemedText>

          <View style={styles.form}>
            <Input
              label="Nombre y apellido"
              value={nombre}
              onChangeText={setNombre}
              error={errores.nombre}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => dniInputRef.current?.focus()}
              autoCapitalize="words"
              autoComplete="name"
              disabled={cargando}
            />
            <Input
              ref={dniInputRef}
              label="DNI (opcional)"
              value={dni}
              onChangeText={setDni}
              error={errores.dni}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => emailInputRef.current?.focus()}
              keyboardType="number-pad"
              maxLength={8}
              disabled={cargando}
            />
            <Input
              ref={emailInputRef}
              label="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => telefonoInputRef.current?.focus()}
              error={errores.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              disabled={cargando}
            />
            <Input
              ref={telefonoInputRef}
              label="Teléfono (opcional)"
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordInputRef.current?.focus()}
              autoComplete="tel"
              disabled={cargando}
            />
            <PasswordInput
              ref={passwordInputRef}
              label="Contraseña"
              value={password}
              returnKeyType="done"
              onSubmitEditing={registrarse}
              onChangeText={setPassword}
              error={errores.password}
              autoComplete="new-password"
              disabled={cargando}
            />

            {errorGeneral ? (
              <ThemedText themeColor="danger" style={styles.errorGeneral}>
                ✖ {errorGeneral}
              </ThemedText>
            ) : null}

            <View style={styles.acciones}>
              <Button title="Registrarme" onPress={registrarse} loading={cargando} />
              <Button
                title="¿Ya tenés cuenta? Iniciá sesión"
                variant="texto"
                onPress={volverAlLogin}
                disabled={cargando}
              />
            </View>
          </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: Spacing.three,
  },
  form: {
    width: '100%',
    maxWidth: MaxContentWidth,
    marginTop: Spacing.three,
  },
  errorGeneral: {
    marginBottom: Spacing.three,
  },
  acciones: {
    gap: Spacing.two,
  },
});

export default RegisterScreen;
