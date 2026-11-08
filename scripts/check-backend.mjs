import nextEnv from '@next/env';

// Read-only diagnostic. Never prints keys, response bodies, or user data.
nextEnv.loadEnvConfig(process.cwd());
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error('Falta configurar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. Consulta docs/CONEXION.md.');
  process.exit(1);
}
let base;
try {
  base = new URL(url);
  if (base.username || base.password || base.search || base.hash || base.pathname !== '/') throw new Error();
  if (base.protocol !== 'https:' && !(base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname))) throw new Error();
} catch {
  console.error('La URL de Supabase debe ser una dirección HTTPS sin ruta ni credenciales (HTTP solo para desarrollo local).');
  process.exit(1);
}
let role;
try { role = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()).role; } catch { /* Publishable keys are not JWTs. */ }
if (key.startsWith('sb_secret_') || role === 'service_role') {
  console.error('Clave privada detectada: utiliza exclusivamente la clave publicable/anon en las variables NEXT_PUBLIC.');
  process.exit(1);
}
if (!key.startsWith('sb_publishable_') && role !== 'anon') {
  console.error('La clave no tiene el formato publicable/anon esperado.');
  process.exit(1);
}
try {
  const headers = { apikey: key };
  if (role === 'anon') headers.Authorization = `Bearer ${key}`;
  const auth = await fetch(new URL('/auth/v1/settings', base), { headers, signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!auth.ok) throw new Error(`Auth no responde correctamente (HTTP ${auth.status}).`);
  const settings = await auth.json();
  if (!settings.external?.email) throw new Error('El proveedor de correo/contraseña no está habilitado.');
  if (settings.mailer_autoconfirm !== true) throw new Error('Auth requiere desactivar la confirmación de correo para las cuentas por usuario.');
  console.log('OK: conexión a Auth y proveedor de correo disponibles.');
  for (const table of ['user_inventory', 'trade_proposals', 'profiles']) {
    const response = await fetch(new URL(`/rest/v1/${table}?select=*&limit=0`, base), { headers, signal: AbortSignal.timeout(15000), redirect: 'error' });
    if (![401, 403].includes(response.status)) throw new Error(`Revisar migración/permisos de ${table}: se esperaba denegación anónima, recibido HTTP ${response.status}.`);
    console.log(`OK: acceso anónimo denegado a ${table}.`);
  }
  console.log('Pendiente: validar correo, persistencia, RLS entre cuentas y un intercambio completo con dos usuarios reales. Esta comprobación no los sustituye.');
} catch (error) {
  // Network errors may include credentials/URLs in their cause; do not log them.
  console.error(error instanceof Error && /^(Auth |El proveedor|Revisar migración)/.test(error.message) ? error.message : 'No se ha podido completar la comprobación de conexión. Revisa la URL, la red y la configuración del servicio.');
  process.exitCode = 1;
}
