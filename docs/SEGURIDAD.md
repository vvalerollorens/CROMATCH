# Seguridad y operación

## Controles implementados

- Supabase Auth con PKCE, contraseña y confirmación de correo según configuración del servicio. Los errores y la recuperación se muestran en español.
- RLS en todas las tablas. No se concede escritura directa a clientes sobre inventarios, intercambios, catálogo, perfiles ni auditoría.
- RPC de escritura con `SECURITY DEFINER`, `search_path` vacío, identidad derivada del JWT y permisos explícitos. Los helpers no están disponibles para invocación directa, salvo los predicados necesarios para políticas.
- Colecciones privadas por defecto, visibilidad configurable y bloqueo bilateral. Los enlaces solo permiten leer una lista concreta, caducan y se pueden revocar.
- Reservas y restricciones de cantidad comprobadas en PostgreSQL. Locks y transacciones para evitar dobles movimientos y reservas incompatibles.
- IDs idempotentes para contadores y propuestas. El cliente conserva el ID del cambio de cantidad si la conexión falla y permite reintentarlo; no muestra el cambio como guardado antes de confirmarlo.
- Historial sin permisos UPDATE/DELETE para el cliente. Catálogo con revisiones; no existe eliminación directa de cromos.
- Límite de operaciones por cuenta/minuto para contadores, amistades, propuestas, enlaces y denuncias. No sustituye un WAF ni el control del registro anónimo.
- React escapa los textos y no se utiliza `dangerouslySetInnerHTML`. Cabeceras contra framing, MIME sniffing y permisos de sensores innecesarios.
- La CSP limita conexiones a Supabase. Permite scripts inline/eval por compatibilidad con el arranque de Next.js; endurecer con nonces y eliminar eval en producción es una tarea pendiente.
- El módulo de captura no sube imágenes ni activa reconocimiento automático. No hay un bucket público de avatares o fotos.
- No se incluyen trackers. La sesión es necesaria para autenticar; no se cachean inventarios privados en el service worker.

## Modelo de amenazas y límites

Una persona autenticada puede llamar directamente a PostgREST y los RPC: las comprobaciones no dependen del frontend. Se prueban acceso a inventarios ajenos, modificación directa, aceptación por terceros y privilegios administrativos. Los identificadores aleatorios no son el único mecanismo de seguridad.

Las claves anon/publicables no son secretos administrativos y deben usarse junto con RLS. Nunca publiques `service_role`, contraseñas de base de datos o credenciales SMTP. La aplicación no necesita esos valores. El operador de PostgreSQL conserva capacidades administrativas; debe controlar y auditar su acceso fuera de la app.

No se usa autenticación por cookies propias en endpoints de escritura: las operaciones de base de datos usan el bearer token de Supabase. Las sesiones del navegador requieren medidas contra XSS; no instales scripts de terceros sin revisión.

El rate limit por usuario no impide registros masivos. Configura CAPTCHA soportado por Supabase, límites de Auth, SMTP, límites de proveedor y protección del perímetro antes de abrir al público. La integración visual de CAPTCHA en el formulario no está implementada aún.

Los bloqueos impiden nuevas amistades y consultas. Los intercambios ya aceptados pueden finalizarse o cancelarse, para no dejar reservas abandonadas. No existe caducidad automática de reservas ni sistema de disputas; cualquiera de las partes puede cancelar antes de completarse.

## Datos y derechos

Perfil permite exportar los datos accesibles de la cuenta y solicitar su eliminación inmediata mediante un RPC propio. La eliminación exige resolver primero propuestas activas, revoca listas y elimina acceso, perfil personal, inventario y relaciones activas. Los UUID y movimientos se conservan seudonimizados por integridad del historial; esto no equivale a anonimización absoluta. Debe definirse una política de retención con revisión jurídica, también para denuncias y auditoría.

Antes del lanzamiento, completa los textos en pantalla con responsable real, contacto, finalidades, bases jurídicas, plazos, encargados, transferencias internacionales y procedimiento de acceso/rectificación/supresión/oposición/portabilidad/limitación. Revisa contratos y región de Supabase y Vercel, gestión de menores y mecanismo de reclamación. No se afirma cumplimiento legal completo.

## Copias y recuperación

1. Elige un plan/región con backups y, si procede, recuperación a un momento concreto. No se han contratado ni activado desde este repositorio.
2. Mantén una copia cifrada y con acceso restringido de las exportaciones de PostgreSQL. El esquema versionado no contiene los datos de usuarios.
3. Prueba la restauración en un proyecto aislado y comprueba Auth, inventarios, reservas, movimientos y RLS antes de cambiar tráfico.
4. Acuerda y documenta RPO/RTO, responsable de guardia y caducidad de copias. Las eliminaciones de cuenta requieren política de expiración de backups.
5. Ante un incidente, limita escrituras, conserva evidencia con acceso restringido, restaura a staging y reconcilia movimientos antes de reabrir.

Los cambios de esquema deben probarse con datos representativos y backup. No ejecutes las pruebas de concurrencia destructivas contra bases reales; el script solo acepta el nombre `cromatch_test` y debe usar credenciales exclusivas de CI.
