# Catálogo y fuentes

## Estado a 8 de noviembre de 2026

Se crearon únicamente los metadatos de «LaLiga ESTE 2026–27». No se importó ningún jugador, código, imagen, cifra de cromos ni número de posiciones físicas sin verificación.

La investigación localizó listados de terceros con cifras diferentes. La consulta de `https://www.panini.es/` mediante la herramienta de búsqueda devolvió HTTP 403. Las búsquedas restringidas al dominio oficial no devolvieron un checklist verificable. Esto no demuestra que no exista un catálogo oficial: solo significa que no se pudo contrastar aquí.

Pistas para revisión humana, **no fuentes aprobadas ni importaciones realizadas**:

- [Stickers.app, Liga ESTE 2026–27](https://stckrs.app/es/albums/2026/liga-este-2026-27/)
- [De Cromos con JR, listado por ediciones](https://www.decromosconjr.es/laliga-ea-sports-2026-27-listado-ediciones/)
- [Cromolista, Liga Este 2026–27](https://cromolista.com/coleccion/liga-este-2026-27)
- [Panini España](https://www.panini.es/)

Las páginas de terceros deben abrirse y revisarse individualmente; los extractos de un buscador no bastan para verificar cada fila. No se mezclan temporadas ni huecos reservados con cromos publicados.

## Formato de importación JSON

El administrador carga un array JSON de 1 a 2000 filas. No hay importador CSV en esta versión; conviértelo a JSON antes de validar.

| Campo               | Obligación                                   |
| ------------------- | -------------------------------------------- |
| `official_code`     | Cadena exacta, incluidos sufijos y letras    |
| `name`              | Nombre publicado, sin inventarlo             |
| `edition`           | Edición de publicación                       |
| `variant`           | Variante; valor por defecto `base`           |
| `team`, `series`    | Opcionales, texto normalizado                |
| `sticker_type`      | Tipo; por defecto `normal`                   |
| `album_position`    | Opcional; puede ser compartida por variantes |
| `source_url`        | HTTPS de la fuente primaria oficial          |
| `corroboration_url` | HTTPS de otra fuente contrastada             |
| `verified_at`       | ISO 8601 con zona horaria, no futura         |

La validación local no publica. Tras revisar los errores y contrastar las fuentes, el administrador confirma la importación. La base vuelve a validar las condiciones esenciales y guarda las revisiones. Una URL con HTTPS no acredita por sí sola autoridad ni exactitud; el administrador es responsable de la comprobación editorial.

## Identidad estable y correcciones

La identidad natural es colección + código + edición + variante; cada cromo tiene además un UUID interno. Corregir su nombre o posición conserva su UUID. Cambiar la identidad crea otra fila, nunca reutiliza silenciosamente los inventarios. Las fusiones, retirada de datos erróneos y migraciones de identidad requieren una migración explícita y auditada; no hay botón de borrado.

El importador no descarga imágenes. Las fotografías y escudos quedan fuera hasta contar con licencia verificable. Los diseños genéricos de la interfaz son originales y no representan cromos oficiales.

## Equipos de la barra visual

Los nombres de los veinte clubes de la temporada 2026/27 se contrastaron con el [directorio de clubes de LaLiga](https://www.laliga.com/es-NG/laliga-easports/clubes), consultado el 8 de noviembre de 2026. Se versionan en `src/lib/teams.ts`; esto no acredita los cromos publicados por Panini. Los escudos son formas y monogramas originales, sin descargar logotipos. Los equipos de otras colecciones se derivan de su catálogo.

En modo visita, los doce casilleros por equipo son exclusivamente controles de prueba del diseño, sin numeración ni nombres oficiales. No se publican como catálogo ni se mezclan con el inventario.
