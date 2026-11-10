# Arreglos del documento entregado

Se aplicaron las indicaciones de `Arreglos a la página.docx`: navegación sin Inicio y con CAUCE independiente; texto y etiquetas de la portada; pestañas de La firma; empresas sin directorio ni filtros; servicios de Corporativo, Minería, Marítimo e Inmobiliario; nueva área Turismo; sectores e imágenes; Familia y Laboral en una columna; perfil de Makarena y retiro de Roxana del equipo de Familia; tipografía e infografía de CAUCE; fotografía de Camila y trayectoria de Jorge.

Las fotografías de oficinas usan `assets/oficinas/calama/calama.png` y `assets/oficinas/puerto varas/puerto varas.png`. Luis utiliza `assets/personas/luis miranda.jpeg`. Las siete imágenes insertadas en el DOCX se conservaron en `assets/actualizacion/`, en el mismo orden del documento.

Los registros de servicios y profesionales también se actualizaron en el CMS de Supabase mediante una transacción, conservando los campos ajenos a las correcciones y comprobando las revisiones anteriores. Turismo y Makarena son registros independientes y pueden editarse o despublicarse desde el administrador. No se modificó el esquema de la base de datos. Las imágenes y los cambios de presentación están en el checkout local y deben incluirse en la próxima publicación del sitio.

Se corrigió el generador de la firma para renovar las secciones que ya tienen atributos `data-firm-*`, conservando las actualizaciones al regenerar. El manifiesto del editor visual se actualizó con las nuevas secciones e imágenes.

Verificación: 36 pruebas automatizadas aprobadas. Inicio, Makarena, Luis y CAUCE revisados con Edge a 1440 y 390 píxeles, sin imágenes rotas, desbordes horizontales ni errores de JavaScript. Evidencia local en `artifacts/arreglos/` (carpeta excluida de Git).

La comprobación posterior, punto por punto, está en [COMPROBACION-ARREGLOS.md](COMPROBACION-ARREGLOS.md). Incluye la corrección del título de la tarjeta marítima y la revisión de las diez páginas a 1440, 390 y 320 píxeles.
