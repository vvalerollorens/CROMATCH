# Catálogo, edición y fuentes

## Fuente indicada por el usuario

[Listado de Panini: LaLiga 2026–27, cuarta edición](https://www.panini.es//media/paniniFiles/Checklist_LALIGA_2026-27-4aED.pdf).

El 8 de noviembre de 2026 se intentó leer esta URL, también normalizando la doble barra. Tanto el cliente HTTP como la herramienta web recibieron **403 Forbidden**. No se ha podido comprobar el contenido del PDF. Es la referencia pendiente de cotejar; su URL no se presenta como prueba de haberla leído. Una copia adjunta del documento permitirá hacer la comparación de primera mano.

## Catálogo de consulta disponible

`src/data/catalogue-2026-27.json` reúne **661 registros en 29 apartados**: veinte equipos, ADN LaLiga Prime, LaLiga Fantasy, Draft 23, Draft 23 Kromix, tres acabados Extra Sticker, Últimos Fichajes y Top Fichajes. El orden de equipos se contrastó con los listados de Cromolista, Stickers.app y JR: Alavés, Athletic, Atlético, Barcelona, Betis, Celta, Deportivo, Elche, Espanyol, Getafe, Levante, Real Madrid, Málaga, Osasuna, Racing, Rayo, Real Sociedad, Sevilla, Valencia y Villarreal.

Se conservaron los nombres y números de los listados, sin crear jugadores, huecos ni numeraciones de relleno. Cada registro incluye referencias y sus valores originales. Las fuentes son:

- [Cromolista](https://cromolista.com/coleccion/liga-este-2026-27).
- [Stickers.app](https://stckrs.app/albums/2026/liga-este-2026-27/).
- [De Cromos con JR](https://www.decromosconjr.es/laliga-ea-sports-2026-27-listado-ediciones/).
- [HobbyRadar](https://hobbyradar.es/deportivas/liga-este-2026-27), como contraste del listado inicial, excluyendo los registros «Por anunciar».

**No se afirma que estos 661 registros sean la colección oficial completa.** El dato `officially_complete` permanece en `false`. Este catálogo no se importa automáticamente en inventarios de usuarios: se muestra como consulta hasta poder cotejar Panini y resolver las discrepancias.

## Incidencias explícitas

Hay siete registros marcados para revisión: Altay Bayındır, Hugo Burcio, Marc Casadó, John Chetauya y las tres fichas de Top Fichajes. En las tres últimas, los listados no coinciden en orden/número: la interfaz muestra `?`, no elige un número sin respaldo suficiente.

Los Extra Sticker aparecen como **S/N** porque los identificadores E1 o LY-B empleados por algunas webs no acreditan numeración impresa. Para los colocas con número compartido, no se presentan los sufijos internos BIS2/BisB como número oficial confirmado. Una misma posición física no se cuenta automáticamente como dos posiciones de álbum.

Racing/Rayo también presentan diferencias de agrupación en una fuente. JR y Cromolista sitúan Pedro Díaz 11A y Nteka 11B en Rayo; no se duplica Nteka en Racing. Las discrepancias y valores originales pueden consultarse desde el botón de fuentes de cada ficha.

Las ediciones se muestran cuando una fuente las identifica. «Edición por confirmar» significa que no se ha inferido la edición a partir de la posición del registro.

## Consulta frente a inventario

Sin catálogo publicado en Supabase, el álbum muestra el listado de consulta. En `/visita#album` sus marcas son efímeras y no modifican inventarios. Una cuenta real puede consultar sus fuentes, pero no guardar los UUID de referencia como cromos publicados. Cuando exista catálogo en la base, las operaciones usan exclusivamente sus IDs y las funciones transaccionales.

## Importación JSON del catálogo publicado

El importador administrativo mantiene su validación independiente. Exige código, nombre, edición, variante, dos fuentes HTTPS y fecha. No descarga fotografías. La validación estructural no demuestra exactitud editorial: antes de publicar hay que cotejar la fuente del editor y resolver las incidencias.

Las correcciones de nombres conservan los UUID de la base y quedan auditadas. No deben reemplazarse inventarios ni IDs existentes por los IDs del listado de consulta.

## Escudos de clubes

Los veinte escudos SVG blancos se descargaron por petición expresa del usuario desde [FootyLogos](https://www.footylogos.com/es/competition/laliga). Se sirven sin modificaciones desde `public/badges/`; `sources.json` registra la URL de la ficha, descarga, fecha, tamaño y SHA-256. La interfaz incluye atribución a FootyLogos. Los escudos pertenecen a sus respectivos titulares; no se afirma afiliación con los clubes ni una licencia de uso comercial.
