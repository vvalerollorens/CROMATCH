# Conectar NEXO a Supabase

Comprobación del 8 de noviembre de 2026: el proyecto Vercel `cromatch` existe y su último despliegue está listo. Su lista de variables está vacía y no aparece una integración Supabase. Por tanto, las cuentas y la sincronización alojadas siguen pendientes; el modo visita guarda únicamente en este navegador.

## Preparar el servicio

1. Seleccionar o crear el proyecto Supabase del grupo. Usar otro proyecto para pruebas.
2. En un proyecto nuevo, aplicar `supabase/migrations/202611080001_core.sql` mediante SQL Editor, o vincular el CLI y ejecutar `supabase db push`. Revisar antes cualquier base que ya tenga datos; no restablecer producción.
3. En Vercel → `cromatch` → Settings → Environment Variables, añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, usando la URL y la clave publicable/anon de Supabase. Nunca añadir una clave secret/service_role a variables públicas. Configurar por separado Preview y Production y reconstruir el despliegue.
4. En Supabase Auth, habilitar correo/contraseña y confirmación. Site URL: `https://cromatch-six.vercel.app`. Autorizar esa misma dirección con `/` como retorno. Configurar SMTP y comprobar los correos de confirmación y recuperación. Google permanece desactivado hasta configurar el proveedor.
5. Con esas variables en `.env.local`, ejecutar `npm run check:backend`. Solo consulta Auth y verifica que las tablas privadas deniegan el acceso anónimo según esta migración. No crea cuentas, no modifica datos y no imprime claves ni datos personales. Un resultado correcto no certifica el aislamiento entre usuarios.
6. Publicar mediante el administrador únicamente las filas del catálogo contrastadas. El listado de consulta no es un catálogo oficialmente completo: quedan siete incidencias y el PDF oficial pendiente de acceso.
7. Ejecutar la prueba con dos cuentas de [VERIFICACION.md](VERIFICACION.md): confirmar correos, persistencia entre dispositivos, amistad, privacidad, propuesta, reserva y confirmación bilateral. Revisar también con una tercera cuenta sin permisos.

El álbum local de visita no se transfiere automáticamente a una cuenta: sus identificadores de consulta no deben confundirse con los del catálogo publicado.

## Requisitos vigentes

El documento recibido establece los requisitos funcionales de cuentas, catálogo, privacidad e intercambios. Hay diferencias con decisiones posteriores de diseño: NEXO oscuro con naranja/rosa/amarillo, colores de cada equipo y gestión de copias en Repetidos, sin contadores en la plantilla. Se conserva la implementación actual hasta resolver esa diferencia con el usuario. El uso privado del grupo y la apertura pública de registros también requieren decidir el alcance antes de habilitar el servicio.

La última preferencia propuesta es acceder con nombre de usuario y contraseña, sin correo personal. El flujo actual sigue usando correo con Supabase Auth; la adaptación y un mecanismo seguro de recuperación están pendientes. Las instrucciones de correo anteriores describen el código actual, no una decisión definitiva de producto.
