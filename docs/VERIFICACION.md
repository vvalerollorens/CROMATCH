# Verificación

## Historia que se verifica

Dos personas autenticadas registran cromos propios, autorizan su comparación, proponen un intercambio, reservan unidades al aceptarlo y actualizan ambos inventarios únicamente tras confirmar las dos entregas.

## Evidencia local

- `npm run typecheck`: comprobación estática de TypeScript.
- `npm run build`: compilación de producción Next.js.
- `npm test`: 38 pruebas locales de dominio, álbum, fotos, OCR y PostgreSQL embebido; 4 pruebas de concurrencia se omiten sin `TEST_DATABASE_URL`.
- El esquema se aplica de cero en PGlite. Se utiliza `SET ROLE authenticated` y claims de identidad, de modo que la prueba no se limita a comprobar cadenas de texto de las políticas.

Las pruebas de dominio cubren repetidos y reservas, identidad exacta, aislamiento por catálogo proporcionado, variantes, posiciones físicas, validación y duplicados del importador.

Las de base de datos cubren privacidad inicial, denegación a anónimos, ausencia de permisos de escritura directa, idempotencia, amistad, lectura privada, acceso a intercambios, reservas, cancelaciones, doble confirmación, movimientos inmutables, revalidación de stock, coincidencias, bloqueos, revocación de enlaces, importación con revisiones y eliminación de cuenta.

## Concurrencia real y navegador en GitHub Actions

El workflow levanta PostgreSQL 17 en una base desechable y ejecuta cuatro pruebas con conexiones independientes: dos aceptaciones por la misma unidad, confirmaciones simultáneas, reintento simultáneo de una operación y ocho incrementos concurrentes. No se deben describir como pasadas hasta comprobar el resultado de CI.

Después instala Chromium y ejecuta 30 casos Playwright en escritorio y móvil, incluidos diálogo/foco/teclado y desbordamiento móvil. El entorno de desarrollo no expone la herramienta `cua_repl.js` requerida por Sites para la inspección visual; no se ha sustituido por otro mecanismo ni se afirma inspección visual local.

## Resultado de GitHub Actions

La [ejecución inicial](https://github.com/vvalerollorens/CROMATCH/actions/runs/42492029798) terminó correctamente el 8 de noviembre de 2026: **24 pruebas de dominio/base de datos, incluidas las 4 de concurrencia en PostgreSQL 17, y 8 pruebas Playwright de escritorio/móvil**. También pasaron TypeScript y el compilado de producción. La auditoría local de dependencias de ejecución devolvió cero vulnerabilidades conocidas.

La limpieza de datos en cambios de cuenta y el descarte de respuestas de sesiones anteriores se incluyen en una revisión posterior del controlador de interfaz. Las pruebas públicas no ejercitan un cambio de cuenta con Supabase alojado; esa frontera sigue pendiente de configuración.

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

## Última verificación de NEXO

La [ejecución 42520084800](https://github.com/vvalerollorens/CROMATCH/actions/runs/42520084800), sobre `f0892a6`, pasó TypeScript, compilación, 42 pruebas de lógica/base de datos y 30 pruebas de navegador. Incluye concurrencia en PostgreSQL 17, entrada a Repetidos mediante su botón real en móvil, conservación de la copia del álbum, persistencia local, celebración al completar equipo y OCR real de una imagen de prueba con tres nombres. La comprobación de ancho usa el viewport de diseño para detectar desbordamiento móvil.

La imagen de OCR es una prueba controlada, no una medición de precisión con fotografías de cromos reales. Tampoco se ha verificado todavía Supabase alojado con dos cuentas: Vercel no tiene variables configuradas. Consulta [CONEXION.md](CONEXION.md).

## Conexión Supabase y TLS

El despliegue `b8823f0` terminó READY con migraciones activadas en Vercel. Se corrigió el error real `SELF_SIGNED_CERT_IN_CHAIN` mediante la CA pública oficial de Supabase; una prueba comprueba que pg no sustituye esa CA por los parámetros SSL de la URL y mantiene `rejectUnauthorized: true`. Desde el sitio publicado se consultó Auth (200, proveedor habilitado) y el inventario sin sesión (401). La confirmación de email seguía activada; se ha solicitado desactivarla antes de probar el registro solo por usuario. Estas consultas no certifican aún el flujo de dos cuentas ni los intercambios.

## Prueba alojada tras configurar Auth

Después de desactivar Confirm email, Auth devolvió `mailer_autoconfirm=true`. Se crearon dos cuentas temporales por la API pública de registro, sin correo personal ni confirmación administrativa. Ambas recibieron sesión y el usuario de perfil esperado. Se comprobó visibilidad privada inicial, denegación de lectura de ajustes ajenos, actualización de perfil, cierre de sesión, nuevo acceso por contraseña y persistencia del nombre público. Se envió y aceptó una amistad. Se eliminaron ambas cuentas mediante `delete_my_account` al finalizar; se conserva la trazabilidad seudonimizada prevista por el esquema. No se insertaron cromos de prueba.

La consulta autenticada confirmó que el catálogo publicado sigue vacío. Esta prueba no valida todavía cantidades ni intercambios alojados. La ejecución [42522535737](https://github.com/vvalerollorens/CROMATCH/actions/runs/42522535737) pasó 48 pruebas de lógica/base de datos y 30 de navegador, además de TypeScript y build. Las pruebas públicas de navegador no sustituyen una sesión de UI alojada con Supabase.

## Catálogo e intercambio alojado

Se publicaron 654 registros contrastados, con IDs estables, 20 equipos, nueve series (Top Fichajes aún sin filas publicadas), fuentes por ficha, orden del álbum, revisiones y auditoría. Siete registros con discrepancias siguen excluidos. Se comprobó mediante dos cuentas temporales y APIs reales: inventarios privados con datos, bloqueo de escrituras directas, cantidades 2 e idempotencia de operación, cierre de sesión y persistencia, amistad, visibilidad solo a amigos, ranking recíproco, propuesta y repetición de envío, aceptación con reservas sin mover cantidades, rechazo de retirada de unidades reservadas, primera confirmación sin mover posesiones, segunda confirmación que actualiza ambos inventarios, liberación de reservas y reintento sin movimientos duplicados. Cada usuario leyó sus dos movimientos del intercambio. Ambas cuentas se eliminaron al terminar; no se crearon cromos ficticios ni se modificaron inventarios de otras personas.

La primera prueba real detectó que el RPC solo admitía ±1 mientras Repetidos y el escáner enviaban cantidades mayores. La migración `202611080005_bulk_quantities.sql` admite −1 y altas de 1–9 en una operación atómica e idempotente. Se añadió una prueba con cantidades 2 y 9 e incrementos inválidos, y se repitió con éxito el recorrido alojado.

La interfaz de cambios muestra el usuario del amigo, «Tú das», «Tú recibes», los tres pasos y la confirmación propia/ajena. Tras confirmar, el botón desaparece para esa persona y se muestra a quién se espera. Crear cuenta es el CTA principal y su visibilidad inicial en móvil y escritorio tiene una comprobación de navegador. Las pruebas alojadas `tests/live` usan solo claves públicas, cuentas temporales y cromos reales ya publicados; la limpieza elimina cuentas y cancela propuestas incompletas. No se guardan trazas de sesiones ni contraseñas en los artefactos.

## Resultado final de esta entrega (9 de noviembre de 2026)

La [ejecución de calidad 42576779807](https://github.com/vvalerollorens/CROMATCH/actions/runs/42576779807) pasó TypeScript, build, **52 pruebas de lógica/base de datos y 30 de navegador**. La [ejecución alojada 42576780062](https://github.com/vvalerollorens/CROMATCH/actions/runs/42576780062) pasó el recorrido completo en escritorio y móvil: acceso con dos cuentas temporales, álbum con 654 fichas, marcar/desmarcar, primer repetido (2 copias), persistencia al recargar, inventario privado, comparación, envío de propuesta, aceptación, primera confirmación con espera, segunda confirmación y ambos inventarios actualizados. También comprueba nombres/números de cartas en la propuesta terminada. Las capturas se revisaron, incluida la visibilidad inicial de Crear cuenta en móvil. Ambas cuentas se eliminaron mediante su propio RPC.

La inspección visual detectó que la vista de intercambio mostraba IDs mientras cargaba el catálogo. Las cartas se consultan ahora junto con la propuesta, de modo que aparecen nombres y números sin atribuirlas incorrectamente a otra colección.
