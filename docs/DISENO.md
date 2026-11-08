# Dirección visual de CROMATCH

La referencia actual son las imágenes aportadas por el usuario: superficies translúcidas y suaves, degradados, esquinas redondeadas y contornos luminosos. Sustituye la capa de cartelería condensada inspirada en la comunicación social de Anderlecht.

Se mantiene el morado y amarillo del álbum. `src/app/glass.css` compone fondos con luz morada, reflejos de amarillo cálido, paneles de cristal y navegación inferior flotante. Los estados y el texto no dependen solo del color.

La tipografía es Manrope variable, alojada localmente con licencia SIL OFL. Los titulares dejan las mayúsculas condensadas; el texto corriente y los controles conservan tamaños táctiles y lectura clara. Los cinco iconos principales usan una colección propia de trazos finos en `app-icons.tsx`.

El logo inicial generado a partir de las referencias se conserva en `public/brand/cromatch.png`; el usuario ha indicado que no le gusta y que se revisará en otro momento. No se considera identidad definitiva. El icono vectorial de la app recoge el motivo de dos formas en intercambio.

## Retratos y casilleros

Se usan exclusivamente los retratos disponibles en [FootyLogos / LaLiga](https://www.footylogos.com/es/player-pngs/laliga), descargados como los WebP de 512 px que sirve la propia página. No se han editado los archivos de origen. `public/players/sources.json` conserva nombre, identidad, temporada, club de la foto, URL, advertencias de origen, tamaño y hash SHA-256. El manifiesto ligero del cliente está en `src/data/player-photos.json`.

575 casilleros disponen de retrato, correspondientes a 484 archivos únicos (unos 21 MB en disco; la descarga en el navegador es diferida por imagen, nunca de todo el banco). Los 20 escudos siguen utilizando sus SVG. Los demás casilleros conservan el escudo y una indicación «Retrato pendiente»: no se asignan caras por parecido de nombre. Algunas fotos disponibles pertenecen a temporadas anteriores; su temporada real y club se muestran en el detalle.

Los cromos que faltan muestran la foto desenfocada y atenuada mediante CSS. Al conseguirlos se enfoca y recupera el color, con un indicador amarillo y un destello breve. Nombre y número permanecen siempre nítidos. `prefers-reduced-motion` elimina transición y destello. Los retratos fallidos muestran el estado pendiente sin iconos de imagen rota.

La visita conserva marcas temporales; no se presenta como inventario guardado. Las cuentas reales siguen usando las operaciones existentes y los identificadores publicados por la base de datos.

## Acceso

La app está pensada para el grupo del usuario. El bloqueo de indexación no sustituye el control de acceso: la vista de visita continúa accesible a quien tenga su URL. La restricción a usuarios invitados debe configurarse en Auth/hosting antes de tratarla como una aplicación cerrada al grupo.
