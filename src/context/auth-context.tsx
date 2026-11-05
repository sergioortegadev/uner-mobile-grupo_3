import { CredencialesAuth, RegistroUsuarioDTO, Usuario } from "@/types";
import { createContext, useContext, useEffect, useState } from "react";
import { setUnauthorizedHandler } from "../services/api/client";
import { authService } from "../services/auth";
import { authenticateBiometric, isBiometricAvailable } from "../services/biometric";
import { unregisterPushDevice } from "../services/notifications";

interface AuthContextType {
  user: Usuario | null;
  isLoading: boolean;
  /** Hay una sesión guardada que espera la biometría del dispositivo. */
  isLocked: boolean;
  /** Pide la biometría; devuelve true y libera la sesión si fue exitosa. */
  unlock: () => Promise<boolean>;
  /** Descarta la sesión guardada para ingresar con usuario y contraseña. */
  usePasswordInstead: () => Promise<void>;
  login: (credenciales: CredencialesAuth) => Promise<void>;
  register: (datos: RegistroUsuarioDTO) => Promise<void>;
  logout: () => Promise<void>;
  /** Actualiza el usuario con sesión (en memoria y en el almacenamiento). */
  updateUser: (user: Usuario) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(null);
  // Usuario restaurado del almacenamiento, aún sin liberar por la biometría.
  const [lockedUser, setLockedUser] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Si la API rechaza el token (401: vencido o inválido), se cierra la sesión y la app vuelve al login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void authService.logout().finally(() => setUser(null));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    // Solo en el arranque en frío: con sesión guardada se exige biometría; sin biometría, usuario y contraseña.
    const restaurar = async () => {
      try {
        const guardado = await authService.getCurrentUser();
        if (!guardado) return;
        if (await isBiometricAvailable()) {
          setLockedUser(guardado);
        } else {
          await authService.logout();
        }
      } finally {
        setIsLoading(false);
      }
    };
    void restaurar();
  }, []);

  const unlock = async () => {
    if (!lockedUser) return false;
    const ok = await authenticateBiometric();
    if (ok) {
      setUser(lockedUser);
      setLockedUser(null);
    }
    return ok;
  };

  const usePasswordInstead = async () => {
    await unregisterPushDevice();
    await authService.logout();
    setLockedUser(null);
  };

  const login = async (credenciales: CredencialesAuth) => {
    const res = await authService.login(credenciales);
    setUser(res.user);
  };

  const register = async (datos: RegistroUsuarioDTO) => {
    const res = await authService.register(datos);
    setUser(res.user);
  };

  const logout = async () => {
    // Primero se da de baja el token en la API (necesita la sesión); luego se cierra la sesión.
    await unregisterPushDevice();
    await authService.logout();
    setUser(null);
  };

  const updateUser = async (actualizado: Usuario) => {
    await authService.saveUser(actualizado);
    setUser(actualizado);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isLocked: lockedUser !== null, unlock, usePasswordInstead, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
