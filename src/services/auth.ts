import { MOCK_USERS } from "../mocks/auth";
import { ApiAuthService } from "./api/api-auth";
import { kvStorage } from "./storage/kv-client";
import { secureStorage } from "./storage/secure-client";
import { CredencialesAuth, RegistroUsuarioDTO, RespuestaAuth, Usuario } from "../types";

export interface AuthService {
  login(credenciales: CredencialesAuth): Promise<RespuestaAuth>;
  register(datos: RegistroUsuarioDTO): Promise<RespuestaAuth>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<Usuario | null>;
  getStoredToken(): Promise<string | null>;
  /** Persiste cambios del usuario con sesión (p. ej. `avisosActivos`). */
  saveUser(user: Usuario): Promise<void>;
}

// Los tokens van al almacenamiento seguro; los datos del usuario, al almacenamiento común.
// (Las claves de SecureStore solo admiten letras, números, ".", "-" y "_").
const TOKENS_KEY = "reporte_ciudadano.tokens";
const USER_KEY = "@reporte_ciudadano:usuario";

type TokensSesion = Omit<RespuestaAuth, "user">;

const delay = (ms: number = 500) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockAuthService implements AuthService {
  private currentUser: Usuario | null = null;
  private currentToken: string | null = null;

  /**
   * Guarda la sesión en memoria: los tokens en almacenamiento seguro y el usuario en el común.
   */
  private async guardarSesion(respuesta: RespuestaAuth): Promise<void> {
    const { user, ...tokens } = respuesta;
    this.currentUser = user;
    this.currentToken = respuesta.access_token;
    await Promise.all([secureStorage.setItem<TokensSesion>(TOKENS_KEY, tokens), kvStorage.setItem(USER_KEY, user)]);
  }

  /**
   * Recupera la sesión guardada (si no está ya en memoria).
   */
  private async restaurarSesion(): Promise<void> {
    if (this.currentUser && this.currentToken) {
      return;
    }
    const [tokens, user] = await Promise.all([
      secureStorage.getItem<TokensSesion>(TOKENS_KEY),
      kvStorage.getItem<Usuario>(USER_KEY),
    ]);
    if (tokens && user) {
      this.currentUser = user;
      this.currentToken = tokens.access_token;
    }
  }

  async login(credenciales: CredencialesAuth): Promise<RespuestaAuth> {
    await delay();

    const emailLimpio = credenciales.email.toLowerCase().trim();

    // Escenario 1: Error de comunicación / Falla de servidor o red
    if (emailLimpio === "error@gualeguaychu.gov.ar" || emailLimpio.endsWith("@offline.com")) {
      throw new Error("Error de conexión a internet");
    }

    const usuarioEncontrado = MOCK_USERS[emailLimpio];

    // 🔴 Escenario 2: Credenciales inválidas (Usuario inexistente o clave incorrecta)
    if (!usuarioEncontrado || credenciales.password !== "123456") {
      throw new Error("Usuario o password incorrecta");
    }

    // 🟢 Escenario 3: Respuesta exitosa (Vecino u Operador). Generar token JWT simulado
    const tokenSimulado = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken.${usuarioEncontrado.id}`;
    const refreshTokenSimulado = `e7cJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`;

    const respuesta: RespuestaAuth = {
      user: usuarioEncontrado,
      access_token: tokenSimulado,
      refresh_token: refreshTokenSimulado,
      token_type: "Bearer",
      expires_in: "15d",
      access_token_expires_at: "2026-10-15T20:20:20.200Z",
      refresh_token_expires_at: "2026-12-15T20:20:20.200Z",
    };

    await this.guardarSesion(respuesta);

    return respuesta;
  }

  async register(datos: RegistroUsuarioDTO): Promise<RespuestaAuth> {
    await delay(750);

    const emailLimpio = datos.email.toLowerCase().trim();

    // 🔴 Escenario de Error de Red / Conexión
    if (emailLimpio === "error@gualeguaychu.gov.ar" || emailLimpio.endsWith("@offline.com")) {
      throw new Error("Error de conexión a internet");
    }

    // 🔴 Escenario de Validación: Usuario ya registrado
    if (MOCK_USERS[emailLimpio]) {
      throw new Error("El correo electrónico ya se encuentra registrado.");
    }

    // 🟢 Construcción del nuevo vecino
    const nuevoUsuario: Usuario = {
      id: `usr-${Date.now()}`,
      nombre: datos.nombre,
      ...(datos.dni !== undefined ? { dni: datos.dni } : {}), // dni opcional hasta que la API esté lista.
      email: emailLimpio,
      telefono: datos.telefono || null,
      rol: "vecino", // Todo usuario autoregistrado ingresa como vecino, luego se cambiaría en la DB
      zonaId: null,
      avisosActivos: true,
      creadoEn: new Date().toISOString(),
    };

    // Registrar en memoria para la sesión mock
    MOCK_USERS[emailLimpio] = nuevoUsuario;

    const tokenSimulado = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockToken.${nuevoUsuario.id}`;
    const refreshTokenSimulado = `e7cJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`;

    const respuesta: RespuestaAuth = {
      user: nuevoUsuario,
      access_token: tokenSimulado,
      refresh_token: refreshTokenSimulado,
      token_type: "Bearer",
      expires_in: "15d",
      access_token_expires_at: "2026-10-15T20:20:20.200Z",
      refresh_token_expires_at: "2026-12-15T20:20:20.200Z",
    };

    await this.guardarSesion(respuesta);

    return respuesta;
  }

  async logout(): Promise<void> {
    await delay(250);
    this.currentUser = null;
    this.currentToken = null;
    await Promise.all([secureStorage.removeItem(TOKENS_KEY), kvStorage.removeItem(USER_KEY)]);
  }

  async getCurrentUser(): Promise<Usuario | null> {
    await delay(350);
    await this.restaurarSesion();
    return this.currentUser;
  }

  async getStoredToken(): Promise<string | null> {
    await delay(250);
    await this.restaurarSesion();
    return this.currentToken;
  }

  async saveUser(user: Usuario): Promise<void> {
    this.currentUser = user;
    await kvStorage.setItem(USER_KEY, user);
  }
}

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== "false";

export const authService: AuthService = USE_MOCK ? new MockAuthService() : new ApiAuthService();
