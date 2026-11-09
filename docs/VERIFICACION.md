# Verificación

## Historia que se verifica

Dos personas autenticadas registran cromos propios, autorizan su comparación, proponen un intercambio, reservan unidades al aceptarlo y actualizan ambos inventarios únicamente tras confirmar las dos entregas.

## Evidencia local

- `npm run typecheck`: comprobación estática de TypeScript.
- `npm run build`: compilación de producción Next.js.
- `npm test`: pruebas locales de dominio, álbum, fotos, OCR y PostgreSQL embebido; 5 pruebas de concurrencia se omiten sin `TEST_DATABASE_URL`. Las cifras de cada ejecución se indican abajo.
- El esquema se aplica de cero en PGlite. Se utiliza `SET ROLE authenticated` y claims de identidad, de modo que la prueba no se limita a comprobar cadenas de texto de las políticas.

Las pruebas de dominio cubren repetidos y reservas, identidad exacta, aislamiento por catálogo proporcionado, variantes, posiciones físicas, validación y duplicados del importador.

Las de base de datos cubren privacidad inicial, denegación a anónimos, ausencia de permisos de escritura directa, idempotencia, amistad, lectura privada, acceso a intercambios, reservas, cancelaciones, doble confirmación, movimientos inmutables, revalidación de stock, coincidencias, bloqueos, revocación de enlaces, importación con revisiones y eliminación de cuenta.

## Concurrencia real y navegador en GitHub Actions

El workflow levanta PostgreSQL 17 en una base desechable y ejecuta cinco pruebas con conexiones independientes: dos aceptaciones por la misma unidad, confirmaciones simultáneas, reintento simultáneo de una operación, ocho incrementos concurrentes y alta simultánea de repetidos conservando una única copia de álbum. No se deben describir como pasadas hasta comprobar el resultado de CI.

Después instala Chromium y ejecuta 30 casos Playwright en escritorio y móvil, incluidos diálogo/foco/teclado y desbordamiento móvil. El entorno de desarrollo no expone la herramienta `cua_repl.js` requerida por Sites para la inspección visual; no se ha sustituido por otro mecanismo ni se afirma inspección visual local.

## Resultado de GitHub Actions

La [ejecución inicial](https://github.com/vvalerollorens/CROMATCH/actions/runs/42492029798) terminó correctamente el 8 de noviembre de 2026: **24 pruebas de dominio/base de datos, incluidas las 4 de concurrencia en PostgreSQL 17, y 8 pruebas Playwright de escritorio/móvil**. También pasaron TypeScript y el compilado de producción. La auditoría local de dependencias de ejecución devolvió cero vulnerabilidades conocidas.

La limpieza de datos en cambios de cuenta y el descarte de respuestas de sesiones anteriores se incluyen en una revisión posterior del controlador de interfaz. Las pruebas públicas no ejercitan un cambio de cuenta con Supabase alojado; esa frontera sigue pendiente de configuración.

## Fronteras que requieren Supabase configurado

| Frontera                                       | Situación                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------- |
| UI pública → formularios                       | Implementada; pruebas de navegador incluidas                            |
| Formulario → Supabase Auth                     | Registro y acceso por usuario verificados con dos cuentas temporales    |
| Verificación de correo / recuperación / Google | Requiere SMTP, callbacks y proveedor; no verificado en servicio alojado |
| JWT → PostgREST/RLS                            | Privacidad verificada en PostgreSQL y en el servicio alojado             |
| RPC → inventarios y reservas                   | Ciclo completo alojado verificado con dos cuentas temporales             |
| Realtime → interfaz                            | Suscripción y reconsulta de respaldo; latencia de push no certificada    |
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

## Intercambios sencillos y guardado (9 de noviembre de 2026)

Sobre `e7c06d2`, [calidad 42582671380](https://github.com/vvalerollorens/CROMATCH/actions/runs/42582671380) pasó TypeScript, build, **58 pruebas de lógica/base de datos y 30 de navegador**. [Alojado 42582671359](https://github.com/vvalerollorens/CROMATCH/actions/runs/42582671359) pasó en escritorio y móvil: Repetidos → Cambiar con amigos → selección de amigo → propuesta automática → solicitud → aceptación → ambas confirmaciones y actualización de los dos inventarios. También verifica perfil sin repetir búsqueda, colección del amigo con controles de marcado deshabilitados, escudo sobre la foto y ausencia de diálogo de información del jugador.

El recorrido alojado retrasa deliberadamente una lectura real del inventario, marca un cromo y entrega después la respuesta antigua: la nueva marca se conserva. La cuenta espera a cargar catálogo e inventario antes de presentar cantidades. Inicio identifica el progreso de toda la colección y el álbum diferencia el porcentaje del equipo/serie; una prueba comprueba 0% sin cromos y las posiciones desconocidas no se presentan como cero.

La migración `202611090006_album_recovery.sql` proporciona diagnóstico y recuperación explícita del historial propio. Las pruebas eliminan una fila únicamente en la base desechable, comprueban restauración conservadora con reservas activas, reintento sin inflación, aislamiento entre usuarios y conservación de cantidades mayores. El diagnóstico del propietario se consulta desde Mi perfil y puede copiarse sin credenciales. **Esto no demuestra que se hayan recuperado las marcas de una incidencia real comunicada por un usuario**: ese caso permanece pendiente de su resumen de guardado; no se han borrado ni restablecido inventarios reales para investigarlo.

La entrega final `5e5200c` añade Mi álbum → Mis cromos, una lista compacta de todas las posesiones del catálogo, con búsqueda, filtro y exportación. [Calidad 42583767108](https://github.com/vvalerollorens/CROMATCH/actions/runs/42583767108) pasó **59 pruebas de lógica/base de datos, 30 de navegador, TypeScript y build**. [Alojado 42583767244](https://github.com/vvalerollorens/CROMATCH/actions/runs/42583767244) pasó los dos recorridos completos: lista propia que excluye faltantes, búsqueda con/sin coincidencia, copias persistidas, perfil de amigo, propuesta automática y cambio confirmado. Se comprobó ancho móvil y se revisaron capturas de lista, perfil y propuesta. La prueba pública del primer casillero detectó que el selector inicial ocupaba espacio adicional; el acceso a la lista se integró en los apartados existentes y la prueba volvió a pasar sin cambiar su exigencia.

## Revisión, marcado estable y Elche 13B

La versión `8336d9f` pasó [calidad 42670218485](https://github.com/vvalerollorens/CROMATCH/actions/runs/42670218485): **61 pruebas de lógica/base de datos, 30 de navegador, TypeScript y build**. [Alojado 42670217506](https://github.com/vvalerollorens/CROMATCH/actions/runs/42670217506) pasó en escritorio y móvil, comprobando primero que `nexo-revision` coincidía exactamente con el commit de la prueba.

El recorrido verifica Elche 13B (John/Jon Chetauya), 655 fichas publicadas, conservación de la posición vertical de la casilla y del desplazamiento al marcar, dos lecturas que llegan desordenadas, privacidad pendiente que sobrevive a una recarga, búsqueda sin tildes y descarga PDF que puede reintentarse tras un fallo al cargar las fuentes. Una solicitud se confirma en el servidor y se interrumpe su respuesta; se cambia después el stock y el reintento conserva exactamente el identificador y las cartas originales. Solo aparece una propuesta y el intercambio se completa con ambos inventarios correctos.

Los avisos de guardado y sincronización flotan sin cambiar la altura del álbum; las casillas deshabilitadas durante el guardado mantienen su opacidad. Los diálogos restauran el foco sin desplazar la página. El PDF utiliza Manrope y la prueba extrae el texto real con `pdftotext`, incluidos Szczęsny y Sučić, las últimas filas y los números de página. `npm audit --omit=dev` no encontró vulnerabilidades conocidas en esta revisión.

Las pruebas no editan inventarios de usuarios reales. La limpieza usa un contexto HTTP independiente para poder cancelar solicitudes y eliminar sus propias cuentas temporales aun cuando se cierre el navegador por un timeout. Algunas ejecuciones anteriores agotaron el tiempo antes de que la limpieza pudiera certificarse; no se afirma que esas cuentas antiguas se hayan eliminado. La incidencia de marcas antiguas comunicada por el usuario continúa pendiente de su resumen de guardado y no debe confundirse con las pruebas de conservación de estado de la interfaz.

## Entrada rápida de repetidos y zoom móvil — 9 de noviembre

Versión `0fc2ace`: [Calidad y seguridad](https://github.com/vvalerollorens/CROMATCH/actions/runs/42692253716) completada: TypeScript, compilación, **65 pruebas de lógica/base de datos** (incluidas cinco de concurrencia real) y **30 pruebas públicas de navegador**. [Prueba alojada](https://github.com/vvalerollorens/CROMATCH/actions/runs/42692254204) completada con dos cuentas temporales, en escritorio y móvil.

Se verifica añadir tres repetidos de una vez, buscar por equipo y número o nombre, mantener la búsqueda, conservar una copia para el álbum y reintentar una respuesta perdida sin sumar dos veces. La retirada de copias espera la confirmación antes de recargar y comprueba persistencia. La entrada mantiene texto de al menos 16 px y escala del visor estable al enfocarse y escribir. Esta comprobación automatizada utiliza Chromium; no certifica una prueba manual en Safari/iPhone. El CSS publicado se ha comprobado en producción y no desactiva la ampliación manual.

El primer intento de la prueba alojada falló porque el guion recargaba tras el segundo clic antes de confirmar su guardado. Se corrigió la espera del guion y se repitió la prueba completa, que pasó. No se modificó el inventario de usuarios reales.

## Intercambio directo desde Amigos — 9 de noviembre

Versión `8d03d13`: [Calidad y seguridad](https://github.com/vvalerollorens/CROMATCH/actions/runs/42695086710) completada con TypeScript, compilación, 65 pruebas de lógica/base de datos y 30 pruebas públicas de navegador. [Prueba alojada](https://github.com/vvalerollorens/CROMATCH/actions/runs/42695086550) completada en escritorio y móvil con dos cuentas temporales.

La prueba elige amigo desde Amigos con «Intercambiar», recupera un fallo de lectura sin confundirlo con privacidad, quita e incluye un cromo mediante su botón, comprueba que no se puede solicitar un cambio vacío, envía una propuesta, reintenta una respuesta perdida sin duplicarla, abre «Ver solicitud enviada» y completa aceptación y confirmación bilateral. Se mantiene la consulta del álbum ajeno y se comprueba que el diseño no desborda el ancho móvil. Se revisó la captura alojada del nuevo flujo y se corrigió el contraste al pasar por una carta y un acceso duplicado al perfil.

Amigos, Repetidos y la pestaña de intercambio del perfil utilizan el mismo componente automático; se elimina el antiguo selector manual de cantidades del perfil. No hay cambios de esquema ni modificaciones de inventarios de cuentas reales.

## Dos montones visuales y entrada de repes por casillas — 9 de noviembre

Versión `e3113fd`: [Calidad y seguridad](https://github.com/vvalerollorens/CROMATCH/actions/runs/42698421755) completada: TypeScript, compilación, 65 pruebas de lógica/base de datos y 30 pruebas públicas de navegador. [Prueba alojada](https://github.com/vvalerollorens/CROMATCH/actions/runs/42698421620) completada en escritorio y móvil con dos cuentas temporales.

Intercambio presenta dos montones, con nombre de cada coleccionista, recuento seleccionado y cartas con retrato real, escudo, nombre, código, cantidad y estado de inclusión. La prueba comprueba que las columnas quedan enfrentadas también en móvil y que el retrato carga. Las solicitudes y el historial usan las mismas cartas de lectura. Se ha revisado la captura móvil alojada. El primer guion todavía buscaba el antiguo texto «#3 · Sivera»; se actualizó para identificar la carta visual por su nombre accesible y se repitió el recorrido completo.

Repetidos abre las casillas del álbum por equipos y series, con filtros «Sin repetidos» y «Con repetidos». Las pruebas añaden una y varias copias, quitan hasta cero repetidos, verifican que el botón − queda deshabilitado conservando la copia del álbum, cambian al buscador y a la lista y comprueban persistencia al recargar. Se mantienen la entrada de varias copias, el reintento idempotente tras pérdida de respuesta y el intercambio confirmado entre las dos cuentas. Se revisó la captura móvil de las nuevas casillas. No hay migraciones ni cambios de cantidades en cuentas reales.
