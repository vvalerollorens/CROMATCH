# Dirección visual de CROMATCH

La referencia pedida es la comunicación en redes de RSC Anderlecht, no su interfaz web. Se revisaron piezas de partido y alineaciones publicadas por el club y la dirección creativa de la campaña RSCA × Mosaert:

- [Pieza de partido Anderlecht–Charleroi](https://www.rsca.be/nl/fixture/view/2406).
- [Alineación publicada por RSCA](https://www.rsca.be/en/lineup241124).
- [RSCA × Mosaert](https://mosaert.com/project/rsca-mosaert/).
- [Campaña cultural 1985–2025, comunicación oficial](https://press.rsca.be/1985-2025-a-celebration-of-rsc-anderlecht-culture-by-mosaert).

Se adapta el lenguaje de carteles de fútbol y coleccionismo: titulares condensados en mayúsculas, números con peso, retículas sencillas, recuadros de impresión, morado profundo, blanco cálido y amarillo dorado. Los brillos anteriores se moderan y las fichas se acercan a un álbum impreso. Se mantienen controles táctiles y lectura clara en móvil.

Las tipografías propias del club no se copian. Se utilizan Barlow Condensed Bold para titulares y dorsales, y Barlow Regular/Semibold para lectura y controles. Se alojan localmente con sus licencias SIL OFL en `src/fonts`, sin llamadas de fuentes a terceros.

Los escudos de FootyLogos se integran en blanco. No se reutilizan fotografías de jugadores, patrocinadores ni composiciones originales de las piezas sociales. CROMATCH conserva su propia marca y no se presenta como producto de Anderlecht.

`vintage.css` contiene esta capa editorial y se carga después de los estilos funcionales y la base oscura. Los detalles de fuentes y las advertencias del catálogo se mantienen disponibles sin ocupar la navegación principal.

La app está pensada para el grupo del usuario. El bloqueo de indexación no sustituye el control de acceso: la vista de visita continúa accesible a quien tenga su URL. La restricción a usuarios invitados debe configurarse en Auth/hosting antes de tratarla como una aplicación cerrada al grupo.
