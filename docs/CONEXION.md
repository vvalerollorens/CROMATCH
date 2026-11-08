# Conectar NEXO a Supabase

Comprobación del 8 de noviembre de 2026: Supabase está vinculado a `cromatch` mediante Vercel Marketplace (plan gratuito). Las variables están protegidas en Vercel. El fallo `SELF_SIGNED_CERT_IN_CHAIN` quedó resuelto con la CA pública oficial de Supabase, conservando la validación TLS y del nombre del servidor. El despliegue `b8823f0` terminó READY tras aplicar las migraciones. Se verificó Auth (HTTP 200) y denegación de acceso anónimo al inventario (HTTP 401). El usuario desactivó «Confirm email» y se comprobó el ajuste mediante Auth. Dos cuentas temporales se registraron con sesión, cerraron/reabrieron acceso, conservaron cambios de perfil y aceptaron una amistad. Se comprobó el aislamiento de ajustes privados y se eliminaron ambas cuentas al terminar. El catálogo publicado está vacío: inventario e intercambios alojados siguen pendientes. El modo visita guarda únicamente en este navegador.

## Preparar el servicio

1. Seleccionar o crear el proyecto Supabase del grupo. Usar otro proyecto para pruebas.
2. En un proyecto nuevo, aplicar en orden las migraciones `202611080001_core.sql` y `202611080002_username_accounts.sql` de `supabase/migrations/` mediante SQL Editor, o vincular el CLI y ejecutar `supabase db push`. Revisar antes cualquier base que ya tenga datos; no restablecer producción.
3. En Vercel → `cromatch` → Settings → Environment Variables, añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, usando la URL y la clave publicable/anon de Supabase. Nunca añadir una clave secret/service_role a variables públicas. Configurar por separado Preview y Production y reconstruir el despliegue.
4. En Supabase Auth, habilitar el proveedor de contraseña y desactivar confirmación de correo para el acceso por usuario. Site URL: `https://cromatch-six.vercel.app`. Autorizar esa misma dirección con `/` como retorno. Las direcciones internas `usuario@accounts.nexo.invalid` son identificadores, no buzones. No configurar envíos para ellas. La recuperación automática sin correo aún está pendiente. Google permanece desactivado hasta configurar el proveedor.
5. Con esas variables en `.env.local`, ejecutar `npm run check:backend`. Solo consulta Auth y verifica que las tablas privadas deniegan el acceso anónimo según esta migración. No crea cuentas, no modifica datos y no imprime claves ni datos personales. Un resultado correcto no certifica el aislamiento entre usuarios.
6. Publicar mediante el administrador únicamente las filas del catálogo contrastadas. El listado de consulta no es un catálogo oficialmente completo: quedan siete incidencias y el PDF oficial pendiente de acceso.
7. Ejecutar la prueba con dos cuentas de [VERIFICACION.md](VERIFICACION.md): registro e inicio por usuario, persistencia entre dispositivos, amistad, privacidad, propuesta, reserva y confirmación bilateral. Revisar también con una tercera cuenta sin permisos.

El álbum local de visita no se transfiere automáticamente a una cuenta: sus identificadores de consulta no deben confundirse con los del catálogo publicado.

## Requisitos vigentes

El documento recibido establece los requisitos funcionales de cuentas, catálogo, privacidad e intercambios. Hay diferencias con decisiones posteriores de diseño: NEXO oscuro con naranja/rosa/amarillo, colores de cada equipo y gestión de copias en Repetidos, sin contadores en la plantilla. El usuario ha confirmado que se mantienen el diseño actual y Repetidos separado de la plantilla. El uso privado del grupo y la apertura pública de registros también requieren decidir el alcance antes de habilitar el servicio.

La decisión actual es acceder con nombre de usuario y contraseña, sin correo personal. El formulario y la segunda migración implementan la adaptación. La contraseña y las sesiones las gestiona Supabase Auth; no se guardan contraseñas en perfiles. La recuperación automática de estas cuentas está pendiente y se informa antes del registro. Las cuentas antiguas conservan el acceso y recuperación por su correo real.

## Migraciones desde Vercel

`prebuild` ejecuta las migraciones solo cuando `NEXO_APPLY_MIGRATIONS=true`, activado en Production. Usa `POSTGRES_URL` dentro de Vercel; las credenciales no se descargan ni se publican. Las migraciones son transaccionales, con bloqueo y comprobación de hashes para impedir repeticiones o cambios silenciosos. Una base con tablas de NEXO sin historial requiere revisión manual. La CA pública está documentada en `scripts/certs/README.md`.
