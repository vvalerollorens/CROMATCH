# Estado y siguientes fases

## Implementado en código

- Bienvenida y formularios de registro, login, recuperación y nueva contraseña con Supabase Auth.
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

1. No hay proyecto Supabase ni claves configuradas en este entorno. No se ha ejecutado el E2E alojado de autenticación, correo, Realtime y dos cuentas reales.
2. No hay checklist oficial de 2026–27 contrastado accesible. El catálogo publicado en la base está vacío; existe un listado de consulta de 661 registros, con fuentes y siete incidencias, separado del inventario. El PDF de cuarta edición indicado por el usuario devuelve 403 y no se ha podido cotejar.
3. La vista pública está desplegada en https://cromatch-six.vercel.app/ y permite revisar sin cuenta en `/visita#album`. No se ha habilitado todavía un control de acceso para limitarla al grupo.
4. El responsable del servicio, contacto legal, política de retención, región, contratos y procedimientos operativos deben definirse antes de abrir registros públicos.

## Funciones aún pendientes

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

1. Provisionar Supabase de desarrollo, aplicar migración y configurar Auth/SMTP.
2. Contrastar y cargar el catálogo; revisar variantes, posiciones y ediciones con fuentes oficiales.
3. Completar pruebas de aceptación alojadas y corregir cualquier defecto de privacidad o integridad antes de ampliar funcionalidad.
4. Resolver los requisitos operativos, legales y antiabuso; probar backups y restauración.
5. Vincular Vercel, separar desarrollo/producción y desplegar la primera versión validada.
6. Evaluar OCR con fotos reales; añadir push, escala e intercambios multilaterales como fases posteriores.
