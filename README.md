# CROMATCH · Mi liga de cromos

Aplicación de coleccionismo e intercambio de fútbol, en español, con Next.js, React, TypeScript, Tailwind CSS y Supabase/PostgreSQL.

**Estado: código inicial implementado y pruebas de base de datos incluidas. No es todavía un servicio público listo para usuarios reales.** Necesita un proyecto Supabase, un catálogo oficialmente contrastado y la validación del flujo completo en un entorno conectado. No contiene inventarios de demostración ni cromos inventados.

## Ver las pantallas sin correo

En la bienvenida pulsa **Ver por dentro sin cuenta**. El modo visita permite recorrer las pantallas sin crear una sesión ni consultar inventarios privados. No contiene cromos, usuarios ni intercambios ficticios. Las operaciones de datos exigen iniciar sesión. Puedes volver con **Salir de la visita**.

## Instalar

Requisitos: Node.js 22 y npm. Para Supabase local, también Supabase CLI y Docker.

```sh
npm ci
cp .env.example .env.local
```

Completa las dos variables públicas con la URL y la clave publicable/anon de tu propio proyecto Supabase. La aplicación no necesita ni debe recibir una clave `service_role`.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-CLAVE-PUBLICABLE
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

Aplica la migración SQL completa en un **proyecto nuevo** desde el SQL Editor de Supabase, o utiliza el CLI:

```sh
supabase login
supabase link --project-ref TU-PROYECTO
supabase db push
npm run dev
```

El archivo reproducible es `supabase/migrations/202611080001_core.sql`. Incluye tablas, restricciones, RLS, funciones transaccionales, índices, alta de perfiles y metadatos de la primera colección. No incluye datos de cromos sin verificar.

Para ejecutar con servicios locales:

```sh
supabase start
supabase db reset
```

Usa la URL y clave locales que imprime el CLI. La confirmación de correo se puede consultar en el buzón de desarrollo de Supabase. `db reset` destruye únicamente tu base local; no lo utilices contra producción.

## Configurar autenticación

En Supabase Auth:

1. Activa correo/contraseña, confirmación de email y contraseña mínima de 10 caracteres.
2. Configura Site URL con la dirección pública real y añade los dominios exactos de callback autorizados. Se utiliza `/` para confirmación, recuperación y OAuth con PKCE.
3. Configura SMTP propio, límites de envío y protección antiabuso antes de admitir registros públicos.
4. Google es opcional: configura el proveedor y su redirect en Google Cloud/Supabase y después activa `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.
5. Usa proyectos y credenciales distintos para desarrollo y producción.

Las sesiones son gestionadas por Supabase Auth. El navegador conserva su sesión; **los inventarios, amistades e intercambios se guardan exclusivamente en PostgreSQL**. No se utiliza localStorage como base de datos de la colección.

## Administrar el catálogo

Registra y verifica primero tu propia cuenta. Con una conexión administrativa al proyecto, asigna el rol de catálogo exclusivamente a una cuenta de confianza:

```sql
update public.profiles set is_admin = true
where id = 'UUID-DE-LA-CUENTA-ADMINISTRADORA';
```

El cliente no puede modificar este permiso. En Perfil → Administrar catálogo puedes añadir colecciones, validar documentos JSON, publicar filas y descargar las revisiones e incidencias. Cada fila requiere dos fuentes distintas y fecha de verificación. La validación comprueba estructura; una persona debe verificar la fuente oficial y el contenido antes de publicar. Véase [Catálogo y fuentes](docs/CATALOGO.md).

## Comprobar

```sh
npm run typecheck
npm test
npm run build
# Navegador; requiere instalar Chromium en la máquina de pruebas:
npx playwright install --with-deps chromium
npm run test:e2e
```

`npm test` ejecuta pruebas de dominio y una base PostgreSQL embebida con RLS real (PGlite). Las pruebas de concurrencia se activan con `TEST_DATABASE_URL` apuntando a una **base desechable llamada exactamente `cromatch_test`**; recrean sus esquemas. GitHub Actions configura PostgreSQL 17 para ejecutarlas con conexiones simultáneas. Los datos de prueba, marcados como fixtures, nunca se importan en la aplicación.

Playwright comprueba bienvenida, formularios, recuperación, navegación por teclado y ausencia de desbordamiento en escritorio y móvil. Esas pruebas públicas no sustituyen el E2E de Supabase Auth y dos usuarios con correo real. Consulta [verificación](docs/VERIFICACION.md).

## Publicar en Vercel

Importa este repositorio en Vercel como proyecto Next.js. Usa `npm ci` y `npm run build`, Node.js 22 y las variables de `.env.example`. No requiere `vercel.json`. Configura Preview con un Supabase de desarrollo, y Production con el de producción; ajusta en cada proyecto los callbacks de Auth. Nunca reutilices una base de producción para pruebas destructivas.

No se ha creado ningún despliegue ni servicio de pago automáticamente. Las claves públicas se incorporan al build: reconstruye tras cambiarlas. El sitio muestra claramente el estado de conexión pendiente cuando no existen.

## Documentación

- [Arquitectura, navegación y modelo](docs/ARQUITECTURA.md)
- [Seguridad y operación](docs/SEGURIDAD.md)
- [Catálogo, formato y fuentes consultadas](docs/CATALOGO.md)
- [Guía de uso](docs/USUARIO.md)
- [Pruebas y evidencia](docs/VERIFICACION.md)
- [Limitaciones y siguientes fases](docs/ESTADO.md)

La aplicación es independiente de Panini y LaLiga. No incluye fotografías ni escudos de terceros. La información legal en pantalla es provisional y debe completarse por el operador antes de abrir registros públicos.
