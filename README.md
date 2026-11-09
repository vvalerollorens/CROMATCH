# NEXO · Tu álbum, conectado

Aplicación de coleccionismo e intercambio de fútbol, en español, con Next.js, React, TypeScript, Tailwind CSS y Supabase/PostgreSQL.

**Estado: versión privada funcional para pequeños grupos; todavía no se declara lista para un lanzamiento público general.** Supabase ya está conectado y se comprobaron registro/acceso por usuario, persistencia de perfil, privacidad de ajustes y amistad con dos cuentas temporales. El catálogo publica 655 registros contrastados (seis pendientes). El inventario y los intercambios se han probado por API con dos cuentas reales temporales; el cotejo oficial con Panini sigue pendiente. No contiene inventarios de demostración ni cromos inventados.

## Ver las pantallas sin correo

Abre directamente **`/visita`**, o en la bienvenida pulsa **Ver por dentro sin cuenta**. El modo visita permite recorrer las pantallas sin crear una sesión ni consultar inventarios privados. No contiene cromos, usuarios ni intercambios ficticios. Las cantidades del álbum local se conservan en este navegador; las operaciones sociales y los inventarios sincronizados exigen una cuenta y Supabase configurado. Puedes volver con **Salir de la visita**.

## Álbum visual para móvil

La dirección visual actual usa cristal oscuro, acentos naranja, rosa y amarillo, Manrope y nuevos iconos de trazo fino. Cada equipo activa sus colores y un campo sutil. Incluye los veinte escudos blancos y 641 casilleros con imágenes de jugadores y entrenadores de FootyLogos, LaLiga y clubes. Las fotos aparecen desenfocadas cuando faltan y se enfocan al marcarlas; los casilleros sin retrato se identifican. Las fuentes conservan la temporada real de cada foto. Tocar una casilla marca o desmarca, sin abrir información del jugador; las fotos llevan el escudo del equipo.

El listado de consulta contiene 661 registros y 29 apartados, con nombres, números y sus fuentes. Seis registros requieren revisión y **no se declara completitud oficial**. El [PDF de cuarta edición indicado por el usuario](https://www.panini.es//media/paniniFiles/Checklist_LALIGA_2026-27-4aED.pdf) devuelve 403 desde este entorno y sigue pendiente de cotejo. Véase [catálogo y fuentes](docs/CATALOGO.md).

Sin cuenta puedes guardar cantidades en este navegador, buscar por nombre, añadir copias y consultar repetidos. No se envían esos datos a Supabase ni se sincronizan entre dispositivos. La cuenta utiliza exclusivamente IDs del catálogo publicado en Supabase para guardar cantidades; el listado de consulta no se importa automáticamente.

Acceso directo: `/visita#album`. El enlace de visita sigue siendo público por URL; el uso previsto para el grupo no configura por sí solo una restricción de acceso.

## Foto, cantidades y celebraciones

`/visita#escaner` permite fotografiar varias cartas o seleccionar una imagen. Tesseract.js y el modelo español se sirven desde el propio sitio y procesan la foto en un Worker local. Se comparan nombres contra el listado; los números por sí solos nunca identifican cartas. Las variantes se muestran para elegirlas y se exige confirmar las coincidencias antes de sumar copias. Cada carta muestra si ya estaba en el álbum. No se almacenan ni suben las fotos. Es una ayuda OCR, con revisión manual, no reconocimiento visual garantizado de cualquier edición o fotografía.

La plantilla solo permite marcar la posesión del cromo. El apartado Repetidos tiene acceso propio en la navegación: allí se añaden copias directamente por nombre o por equipo y número, indicando la cantidad de una vez y conservando siempre una para el álbum. La búsqueda y el equipo se mantienen para continuar; Intro añade una coincidencia única. Los filtros y la exportación están en un desplegable. Si se registra un repetido sin tener todavía la casilla marcada, el buscador informa de que guardará una copia para el álbum y otra repetida. Las páginas completas y las cartas de series especiales activan celebraciones suaves. La animación respeta la preferencia de movimiento reducido y no se dispara por abrir una página ya completada. Perfil permite exportar el álbum local.

Amigos y Repetidos → Cambiar con amigos usan el mismo flujo: botones «Intercambiar» y «Ver colección» por amigo, propuesta automática con recuento de lo que das y recibes, botones para incluir o quitar cromos y «Solicitar intercambio». El perfil utiliza también esta propuesta automática. «Ver solicitud enviada» y «Ver mis intercambios» abren el seguimiento; eliminar o bloquear una amistad queda en un desplegable. Su perfil muestra el álbum compartido en modo consulta. Inicio también ofrece las coincidencias entre amigos. Mi perfil → Revisar mi guardado consulta el historial propio y ofrece recuperar diferencias verificables sin reducir existencias; no sustituye los backups ni confirma la recuperación de una incidencia concreta.

Mi álbum → Mis cromos (lista compacta) reúne todos los cromos propios del catálogo seleccionado en una lista compacta que se puede recorrer completa desplazándose, en orden del álbum, con número, nombre, equipo/apartado y copias. Incluye búsqueda, filtro y descarga PDF con paginación; cuenta también las copias reservadas que todavía te pertenecen. El PDF se genera en el dispositivo e incluye las filas de la búsqueda actual. «Ver todos mis cromos» limpia los filtros.

## Instalar

Requisitos: Node.js 22 y npm. Para Supabase local, también Supabase CLI y Docker.

```sh
npm ci
cp .env.example .env.local
```

El acceso usa nombre de usuario y contraseña, sin correo personal. Supabase está configurado con las migraciones aplicadas y el acceso por usuario se ha probado con el servicio alojado. El catálogo sincronizado incluye 655 registros y se identifica como parcial.

Completa las dos variables públicas con la URL y la clave publicable/anon de tu propio proyecto Supabase. La aplicación no necesita ni debe recibir una clave `service_role`.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU-CLAVE-PUBLICABLE
NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

Aplica todas las migraciones SQL en orden cronológico en un **proyecto nuevo** desde el SQL Editor de Supabase, o utiliza el CLI:

```sh
supabase login
supabase link --project-ref TU-PROYECTO
supabase db push
npm run dev
```

Los archivos reproducibles están en `supabase/migrations/` (esquema, acceso por usuario, identidad del catálogo, publicación y cantidades). Incluye tablas, restricciones, RLS, funciones transaccionales, índices, alta de perfiles y metadatos de la primera colección. No incluye datos de cromos sin verificar.

Para ejecutar con servicios locales:

```sh
supabase start
supabase db reset
```

Usa la URL y clave locales que imprime el CLI. La confirmación de correo se puede consultar en el buzón de desarrollo de Supabase. `db reset` destruye únicamente tu base local; no lo utilices contra producción.

## Configurar autenticación

En Supabase Auth:

1. Mantén habilitado el proveedor de contraseña y desactiva la confirmación de email para este proyecto de acceso por usuario. La app transforma el usuario en un identificador interno `usuario@accounts.nexo.invalid`; no es un buzón ni se envía correo a esa dirección. Exige al menos 10 caracteres de contraseña.
2. Configura Site URL con la dirección pública real y añade los dominios exactos de callback autorizados. Se utiliza `/` para confirmación, recuperación y OAuth con PKCE.
3. Configura límites de acceso y protección antiabuso antes de abrir registros. Las nuevas cuentas no recogen correo personal y no tienen recuperación automática por ahora. La recuperación por email solo se conserva para cuentas anteriores que tengan un correo real.
4. Google es opcional: configura el proveedor y su redirect en Google Cloud/Supabase y después activa `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`.
5. Usa proyectos y credenciales distintos para desarrollo y producción.

Las sesiones son gestionadas por Supabase Auth. El navegador conserva su sesión; **los inventarios, amistades e intercambios se guardan exclusivamente en PostgreSQL**. Las cuentas no utilizan localStorage como base de datos del inventario; la visita sin cuenta conserva un álbum local separado.

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

La prueba del texto real de los PDF requiere `pdftotext` (`poppler-utils` en Linux); CI lo instala. Comprueba nombres con caracteres como Szczęsny y Sučić, últimas filas y páginas numeradas. Las fuentes Manrope se cargan desde el mismo sitio únicamente al descargar un PDF. Las pruebas alojadas esperan que el metadato público `nexo-revision` coincida con su commit antes de usar las cuentas temporales.

Playwright comprueba bienvenida, formularios, recuperación, navegación por teclado y ausencia de desbordamiento en escritorio y móvil. Esas pruebas públicas no sustituyen el E2E de Supabase Auth y dos usuarios reales con contraseña. Consulta [verificación](docs/VERIFICACION.md).

## Publicar en Vercel

Importa este repositorio en Vercel como proyecto Next.js. Usa `npm ci` y `npm run build`, Node.js 22 y las variables de `.env.example`. No requiere `vercel.json`. Configura Preview con un Supabase de desarrollo, y Production con el de producción; ajusta en cada proyecto los callbacks de Auth. Nunca reutilices una base de producción para pruebas destructivas.

El repositorio está desplegado en https://cromatch-six.vercel.app/. Supabase está vinculado mediante el plan gratuito de Marketplace; las credenciales permanecen protegidas en Vercel. Las claves públicas se incorporan al build: reconstruye tras cambiarlas. El sitio muestra claramente el estado de conexión pendiente cuando no existen.

## Documentación

- [Arquitectura, navegación y modelo](docs/ARQUITECTURA.md)
- [Seguridad y operación](docs/SEGURIDAD.md)
- [Catálogo, formato y fuentes consultadas](docs/CATALOGO.md)
- [Dirección visual y tipografías](docs/DISENO.md)
- [Guía de uso](docs/USUARIO.md)
- [Conectar cuentas y comprobar Supabase](docs/CONEXION.md)
- [Pruebas y evidencia](docs/VERIFICACION.md)
- [Limitaciones y siguientes fases](docs/ESTADO.md)

La aplicación es independiente de Panini y LaLiga. Los escudos de los clubes proceden de FootyLogos, con atribución en la app; no se incluyen fotografías de cromos. La información legal en pantalla es provisional y debe completarse por el operador antes de abrir registros públicos.
