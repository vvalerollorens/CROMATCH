# Estado y siguientes fases

## Implementado en código

- Bienvenida, registro/acceso por usuario y contraseña (identificador interno de Supabase Auth, sin correo personal). Recuperación por correo y nueva contraseña conservadas para cuentas anteriores.
- Perfil, privacidad, nombre de usuario, exportación y eliminación de cuenta.
- Catálogo por colecciones, importador JSON con revisión previa, fuentes y auditoría.
- Álbum/lista, cantidades persistentes por RPC, detalle, filtros, repetidos, faltantes y exportación de listas.
- Amistades, búsqueda por nombre de usuario, bloqueos, denuncias, permisos y comparador.
- Ranking de coincidencias entre amigos autorizados, selección manual y propuestas de cantidades desiguales.
- Aceptación/reservas, cancelación/rechazo, confirmación bilateral y movimientos atómicos idempotentes.
- Notificaciones internas, historial, estadísticas básicas, suscripción Realtime con reconsulta de respaldo.
- Manifest PWA, navegación inferior móvil, estados vacíos/carga/error, diálogos con foco y controles con etiquetas.
- Migración SQL, pruebas automatizadas y workflow de GitHub Actions; configuración convencional de Next.js para Vercel.

«Implementado» describe la presencia del código. No equivale a «verificado con usuarios reales» ni a «listo para producción».

## Bloqueos externos actuales

1. Supabase está conectado a Vercel y las migraciones se aplicaron en el despliegue `b8823f0`. Auth responde y el inventario deniega consultas anónimas (401). Registro por usuario, acceso tras cierre de sesión, persistencia de perfil, privacidad de ajustes y amistad se probaron con dos cuentas temporales, eliminadas al terminar. El catálogo ya contiene 654 cromos contrastados. Se probó por API el ciclo completo con dos cuentas: cantidades, privacidad, persistencia, amistad, coincidencias, propuesta, reserva y confirmación bilateral, incluidas peticiones repetidas. La comprobación de interfaz alojada se documenta en VERIFICACION.md.
2. No hay checklist oficial de 2026–27 contrastado accesible. La base publica 654 registros contrastados; la consulta incluye 661, de los cuales siete siguen en revisión. No se declara completitud oficial. El PDF de cuarta edición indicado por el usuario devuelve 403 y no se ha podido cotejar.
3. La vista pública está desplegada en https://cromatch-six.vercel.app/ y permite revisar sin cuenta en `/visita#album`. No se ha habilitado todavía un control de acceso para limitarla al grupo.
4. El responsable del servicio, contacto legal, política de retención, región, contratos y procedimientos operativos deben definirse antes de abrir registros públicos.

## Funciones aún pendientes

- Recuperación automática de cuentas creadas sin correo (por ejemplo, mediante códigos de recuperación). Se informa de esta limitación antes del registro.

- OCR local implementado con Tesseract.js, coincidencias por nombre y confirmación manual. Falta medir precisión con fotografías reales de distintos móviles, ángulos y ediciones; no se garantiza identificar todas las cartas.
- Intercambios multilaterales y detección de ciclos; el modelo contempla participantes, pero los RPC actuales operan exclusivamente entre dos personas.
- Borradores persistentes entre sesiones; los actuales viven en memoria.
- Push, avisos automáticos de nuevas coincidencias y caducidad programada de reservas. Las preferencias no activan envíos.
- Avatar subido y gestión de almacenamiento con validación de imágenes.
- Paneles completos de moderación, resolución de incidencias, métricas técnicas y visualización avanzada de auditoría. Actualmente hay denuncia y descarga administrativa.
- CSV nativo; se admite importación JSON validada.
- Historial y notificaciones paginados en pantalla más allá de las últimas 100 operaciones/avisos. Las estadísticas de intercambios completados en pantalla usan esa ventana; deben pasar a agregados de servidor para un historial mayor.
- Conteo de amigos que necesitan cada repetido y filtro de faltantes por disponibilidad individual. El comparador y el ranking cubren la búsqueda directa de oportunidades.
- Evolución gráfica por fecha, comparación histórica de porcentajes y separación visual de progreso por equipo/serie cuando existen ambos; actualmente se agrupa por equipo y, si no existe, por serie.
- Catálogo cacheado y filtrado íntegramente en servidor para colecciones grandes; no se ha realizado una prueba de miles de usuarios.
- Aplicación de CAPTCHA en formulario, nonces CSP, auditoría de seguridad externa y accesibilidad/compatibilidad en dispositivos físicos.
- Sincronización de la navegación con historial atrás/adelante y enlaces profundos a cada pantalla; las secciones actuales viven en una sola ruta.

## Orden de trabajo

1. Mantener Supabase conectado, con migraciones reproducibles y acceso por usuario; separar un entorno de desarrollo antes de ampliar el grupo.
2. Contrastar y cargar el catálogo; revisar variantes, posiciones y ediciones con fuentes oficiales.
3. Mantener las pruebas de aceptación alojadas con cuentas temporales, revisar capturas y corregir cualquier defecto antes de ampliar funcionalidad.
4. Resolver los requisitos operativos, legales y antiabuso; probar backups y restauración.
5. Mantener Vercel vinculado, separar desarrollo/producción y verificar restauración antes del lanzamiento público.
6. Evaluar OCR con fotos reales; añadir push, escala e intercambios multilaterales como fases posteriores.
