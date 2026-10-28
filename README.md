# Punto de Masa

Sitio: https://salempro123a-sudo.github.io/pudding-replica/

Sitio de la panadería Punto de Masa, con páginas independientes de inicio, catálogo, historia, tiendas y productos. La navegación utiliza documentos HTML, y la selección de productos y tienda se conserva entre páginas en el navegador.

## Desarrollo

Requiere Python 3.12. No hay dependencias de compilación externas.

```bash
python3 panaderia/build.py --output _site
```

Las fuentes editables están en `panaderia/templates/`, los productos en `panaderia/products.json` y los estilos, scripts, fuentes e imágenes en `panaderia/assets/`. El resultado se genera en `_site/`, sin alterar las fuentes ni los archivos de la copia original.

Para servirlo con el prefijo que usa GitHub Pages:

```bash
mkdir -p /workspace/pudding-replica-runtime/www
ln -s /workspace/pudding-replica/_site /workspace/pudding-replica-runtime/www/pudding-replica
python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace/pudding-replica-runtime/www
```

Si el enlace ya existe y apunta a `_site`, reutilízalo. No reemplaces rutas existentes sin revisarlas. Cada tarea ya tiene un entorno aislado; usa el checkout disponible.

El pedido se descarga como una lista para presentar en tienda. El sitio no registra reservas ni cobra pagos. Las fuentes Cormorant Garamond y DM Sans se sirven desde este repositorio; sus licencias se incluyen en `panaderia/assets/fonts/`.

## Archivo original

Se conserva la copia estática preparada a partir de la descarga de SiteOne del 12 de octubre de 2026 de https://pudding.cool/.

Los archivos `site.tar.gz.part-*` contienen la copia completa. Se dividen en partes de 8 MiB para poder subirlas desde el navegador en grupos pequeños. `SHA256SUMS` y `snapshot.json` registran su integridad. GitHub Actions verifica las partes, extrae el sitio y lo publica en Pages.

El despliegue verifica y extrae el archivo original y después genera las páginas de Punto de Masa. Los relatos archivados conservan sus rutas. No modifiques las partes, `SHA256SUMS` ni `snapshot.json` al editar la panadería.

Contenido, autorías y marca originales: The Pudding.
