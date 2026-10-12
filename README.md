# Réplica de The Pudding

Sitio: https://salempro123a-sudo.github.io/pudding-replica/

Una copia estática preparada a partir de la descarga de SiteOne del 12 de octubre de 2026. Conserva el diseño y contenido de https://pudding.cool/ y repara rutas y recursos que faltaban en la exportación.

Los archivos `site.tar.gz.part-*` contienen la copia completa. Se dividen en partes de 8 MiB para poder subirlas desde el navegador en grupos pequeños. `SHA256SUMS` y `snapshot.json` registran su integridad. GitHub Actions verifica las partes, extrae el sitio y lo publica en Pages.

La fuente editable se conserva también en la carpeta local `pudding-replica`. La portada se comparó en escritorio y móvil, y se probaron búsqueda, filtros, carga de historias, navegación principal y una selección de relatos interactivos. Los servicios externos conservan sus enlaces originales.

Contenido, autorías y marca originales: The Pudding.
