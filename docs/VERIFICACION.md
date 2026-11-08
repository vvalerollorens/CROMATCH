# Verificación

## Historia que se verifica

Dos personas autenticadas registran cromos propios, autorizan su comparación, proponen un intercambio, reservan unidades al aceptarlo y actualizan ambos inventarios únicamente tras confirmar las dos entregas.

## Evidencia local

- `npm run typecheck`: comprobación estática de TypeScript.
- `npm run build`: compilación de producción Next.js.
- `npm test`: 20 pruebas locales de dominio y PostgreSQL embebido; 4 pruebas de concurrencia se omiten sin `TEST_DATABASE_URL`.
- El esquema se aplica de cero en PGlite. Se utiliza `SET ROLE authenticated` y claims de identidad, de modo que la prueba no se limita a comprobar cadenas de texto de las políticas.

Las pruebas de dominio cubren repetidos y reservas, identidad exacta, aislamiento por catálogo proporcionado, variantes, posiciones físicas, validación y duplicados del importador.

Las de base de datos cubren privacidad inicial, denegación a anónimos, ausencia de permisos de escritura directa, idempotencia, amistad, lectura privada, acceso a intercambios, reservas, cancelaciones, doble confirmación, movimientos inmutables, revalidación de stock, coincidencias, bloqueos, revocación de enlaces, importación con revisiones y eliminación de cuenta.

## Concurrencia real y navegador en GitHub Actions

El workflow levanta PostgreSQL 17 en una base desechable y ejecuta cuatro pruebas con conexiones independientes: dos aceptaciones por la misma unidad, confirmaciones simultáneas, reintento simultáneo de una operación y ocho incrementos concurrentes. No se deben describir como pasadas hasta comprobar el resultado de CI.

Después instala Chromium y ejecuta ocho casos Playwright (cuatro historias en dos tamaños), incluidos diálogo/foco/teclado y desbordamiento móvil. El entorno de desarrollo no expone la herramienta `cua_repl.js` requerida por Sites para la inspección visual; no se ha sustituido por otro mecanismo ni se afirma inspección visual local.

## Fronteras que requieren Supabase configurado

| Frontera                                       | Situación                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| UI pública → formularios                       | Implementada; pruebas de navegador incluidas                            |
| Formulario → Supabase Auth                     | SDK configurado; servicio real pendiente de credenciales                |
| Verificación de correo / recuperación / Google | Requiere SMTP, callbacks y proveedor; no verificado en servicio alojado |
| JWT → PostgREST/RLS                            | Contrato implementado; RLS comprobada en PostgreSQL embebido            |
| RPC → inventarios y reservas                   | Integración SQL comprobada localmente                                   |
| Realtime → interfaz                            | Suscripción y reconsulta implementadas; pendientes de servicio real     |
| Catálogo oficial → importación                 | Bloqueado por falta de una fuente oficial contrastada accesible         |

## Prueba de aceptación antes del lanzamiento

Usa dos cuentas distintas y un catálogo **real y verificado** en staging. Comprueba registro con email, recuperación, sesiones en dos dispositivos, persistencia al salir, cantidades, privacidad, amistad, comparación, propuesta, aceptación, reservas y ambas confirmaciones. Intenta aceptar otra propuesta que use la misma unidad. Repite las confirmaciones y comprueba que solo existen cuatro movimientos en un intercambio simple.

Repite las consultas directamente a PostgREST con el JWT de una tercera cuenta y con la clave anon sin JWT. No deben aparecer inventarios privados, correos ni intercambios ajenos. Comprueba bloqueo y revocación después de haber abierto la pantalla previamente. Prueba una interrupción de red después de guardar y reintenta conservando el mismo ID.

Completa revisión de VoiceOver/TalkBack, contraste, zoom al 200%, navegación con teclado y pruebas en iPhone/Android reales. No se afirma certificación WCAG ni rendimiento a escala sin esas comprobaciones.
