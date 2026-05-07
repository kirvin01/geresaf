// src/authService.ts
// Gestión centralizada del token JWT

const TOKEN_KEY = 'geresa_token';

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface AuthError {
    message: string;
}

/** Guarda el token en localStorage */
export function saveToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
}

/** Recupera el token guardado */
export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/** Elimina el token (logout) */
export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
}

/** Verifica si hay sesión activa */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/** Devuelve el header Authorization listo para usar en fetch */
export function authHeader(): HeadersInit {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Realiza el login contra la API y guarda el token */
export async function login(baseURL: string, credentials: LoginCredentials): Promise<void> {
    const body = new URLSearchParams({
        username: credentials.username,
        password: credentials.password,
        grant_type: 'password',
    });

    const response = await fetch(`${baseURL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || 'Usuario o contraseña incorrectos.');
    }

    const data = await response.json();
    saveToken(data.access_token);
}

/** Cierra sesión */
export function logout(): void {
    removeToken();
}