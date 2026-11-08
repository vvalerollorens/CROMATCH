# NEXO · Dirección visual y experiencia

La marca de la app pasa a NEXO; el repositorio y dominio de despliegue conservan sus direcciones CROMATCH. El símbolo sigue la base proporcionada por el usuario: dos marcos superpuestos y un destello. `public/brand/nexo-symbol.png` conserva el original generado; `public/icon.svg` es la versión pequeña vectorial para iconos. No se reutiliza el anterior logo rechazado.

La paleta actual está en pruebas: naranja, rosa y amarillo cálidos sobre cristal oscuro. Las variables se concentran en `nexo.css`; `glass.css` aporta la geometría y la base funcional de la interfaz. Manrope variable se sirve localmente con licencia SIL OFL. Los cinco iconos principales son de trazo fino.

Cada uno de los veinte equipos tiene una pareja propia de colores en `album-art.ts`, aplicada a reflejos, selección, progreso y un campo de fútbol sutil bajo sus casilleros. Las series Oro, Plata, Bronce, ADN Prime, Fantasy, Draft, Kromix y Top Fichajes tienen acabados diferenciados e iconos como cartas pequeñas. Son composiciones originales que evocan las series, no reproducciones exactas del diseño impreso.

## Fotografías

Los 641 registros con jugador o entrenador del catálogo de consulta tienen imagen; los otros veinte corresponden a escudos. Se prioriza [FootyLogos](https://www.footylogos.com/es/player-pngs/laliga), complementado con fichas de LaLiga y publicaciones oficiales de los clubes para bajas y entrenadores. Se conservan los archivos originales, sin retoques locales. Algunas imágenes pertenecen a temporadas anteriores o son fotografías de acción/noticias: la fuente, temporada disponible y club se muestran en el detalle. No se atribuyen como fotos oficiales de la edición impresa.

`public/players/sources.json` y `additional-sources.json` registran identidad, URL, fecha de consulta, tamaño y SHA-256. `src/data/player-photos.json` contiene solo los datos necesarios para el cliente. Las imágenes cargan de forma diferida. Una descarga fallida muestra el estado pendiente sin iconos rotos.

Las fotos que faltan aparecen desenfocadas y atenuadas mediante CSS. Al conseguirlas se enfocan y recuperan el color; los nombres y números permanecen siempre nítidos. Cada equipo tiene un jugador «Destacado NEXO», una selección editorial de la app que no atribuye rareza oficial al cromo impreso. Al conseguirlo, igual que las series especiales, se abre una carta con brillo y movimiento; completar un equipo muestra una celebración con iluminación ambiental. No se repite al abrir un equipo ya completado. El movimiento reducido elimina transiciones, inclinaciones y destellos animados.

## Cantidades y lector de fotos

La versión sin cuenta conserva cantidades en `nexo.album.v1` dentro de localStorage. La primera copia llena el casillero y las siguientes son repetidos. La búsqueda global permite añadir y quitar por nombre, equipo o número. Perfil exporta una copia JSON del álbum local. Cada cambio confirma primero la escritura local; un fallo no se presenta como guardado.

El OCR usa Tesseract.js y un modelo español servidos desde el propio origen, bajo demanda. Las fotos no se suben ni se almacenan. Se reconocen nombres y se muestran candidatos del catálogo: números sueltos no identifican cartas. Las ediciones/series ambiguas requieren elegir la carta. La aplicación muestra cantidades actuales y exige confirmar antes de sumar copias. La revisión marca individualmente las ya aplicadas para que un reintento tras un error no duplique las anteriores. Falta medir la precisión con fotografías reales de distintos dispositivos y condiciones.

Las cuentas reales siguen usando IDs publicados y operaciones de Supabase. El almacenamiento local no se importa automáticamente a cuentas ni se sincroniza entre amigos o dispositivos. El PDF oficial del catálogo sigue pendiente de contraste; consultar `CATALOGO.md`.

## Acceso

El enlace de visita sigue accesible por URL. Bloquear indexación no establece acceso privado para el grupo. La sincronización y la restricción a usuarios invitados necesitan configurar Auth y el backend antes de tratarlas como activas.
