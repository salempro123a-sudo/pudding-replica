#!/usr/bin/env python3
"""Build the static bakery pages without modifying the archived replica."""

import argparse
import hashlib
import html
import json
from pathlib import Path
import shutil
from string import Template


SOURCE = Path(__file__).resolve().parent
ORIGIN = 'https://salempro123a-sudo.github.io'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=SOURCE.parent / '_site')
    parser.add_argument('--base-path', default='/pudding-replica/')
    args = parser.parse_args()
    base = '/' + args.base_path.strip('/') + '/' if args.base_path.strip('/') else '/'
    output = args.output.resolve()
    if output == SOURCE or SOURCE in output.parents or output == SOURCE.parent:
        parser.error('Build into a separate output directory, such as _site.')
    output.mkdir(parents=True, exist_ok=True)
    products = json.loads((SOURCE / 'products.json').read_text())
    assets = SOURCE / 'assets'
    version = hashlib.sha256(b''.join(p.read_bytes() for p in sorted(assets.rglob('*')) if p.is_file())).hexdigest()[:12]

    def render(template_name, **values):
        text = (SOURCE / 'templates' / template_name).read_text()
        return Template(text).substitute(base=base, **values)

    def card(product):
        return render('card.html', **{key: html.escape(str(value), quote=True) for key, value in product.items()}, display_price=f"S/ {product['price']:.2f}")

    all_cards = ''.join(card(product) for product in products)
    routes = []

    def page(route, title, description, section, body):
        current = {name: 'aria-current="page"' if name == section else '' for name in ('home', 'catalog', 'story', 'shops')}
        canonical = ORIGIN + base + route
        data = json.dumps(products, ensure_ascii=False).replace('<', '\\u003c')
        text = render('base.html', title=html.escape(title), description=html.escape(description, quote=True), canonical=canonical, section=section, body=body, version=version, product_data=data, **current)
        if '\u00b7' in text:
            raise ValueError(f'Middle dot found in {route or "home"}')
        destination = output / route / 'index.html'
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_text(text)
        routes.append((route, text))

    page('', 'Punto de Masa — Pan hecho con tiempo, en Cusco', 'Pan artesanal, masa madre y sabores de Cusco. Conoce nuestros panes, nuestro obrador y nuestras dos tiendas.', 'home', render('home.html', cards=all_cards))
    page('del-horno/', 'Del horno — Punto de Masa', 'Descubre nuestros panes artesanales y antojos dulces. Ingredientes, recomendaciones y una lista para llevar a tu tienda.', 'catalog', render('catalog.html', cards=all_cards))
    page('nuestra-historia/', 'Nuestra historia — Punto de Masa', 'Un obrador, dos tiendas y un oficio que se aprende con las manos. Conoce la historia de Punto de Masa en Cusco.', 'story', render('story.html'))
    page('tiendas/', 'Visítanos — Punto de Masa', 'Encuentra tu Punto de Masa en Centro Histórico o Wanchaq. Consulta nuestros horarios y elige tu tienda.', 'shops', render('shops.html'))
    for product in products:
        values = {key: html.escape(str(value), quote=True) for key, value in product.items()}
        values['category_label'] = 'Nuestros panes' if product['category'] == 'panes' else 'Algo dulce'
        values['display_price'] = f"S/ {product['price']:.2f}"
        values['related'] = ''.join(card(other) for other in products if other['id'] != product['id'])
        page(f"del-horno/{product['slug']}/", product['name'] + ' — Punto de Masa', product['short'], 'catalog', render('product.html', **values))

    not_found = render('base.html', title='Esta página no está en el horno — Punto de Masa', description='Vuelve a descubrir el pan de Punto de Masa.', canonical=ORIGIN + base, section='not-found', body=render('404.html'), version=version, product_data=json.dumps(products, ensure_ascii=False).replace('<', '\\u003c'), home='', catalog='', story='', shops='')
    (output / '404.html').write_text(not_found)
    shutil.copytree(assets, output / 'panaderia' / 'assets', dirs_exist_ok=True)
    (output / '.nojekyll').touch()
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += ''.join(f'  <url><loc>{html.escape(ORIGIN + base + route)}</loc></url>\n' for route, _ in routes)
    (output / 'sitemap.xml').write_text(sitemap + '</urlset>\n')
    print(f'Built {len(routes)} pages, a 404 page and shared assets in {output}')


if __name__ == '__main__':
    main()
