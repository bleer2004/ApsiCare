"""Gera as páginas HTML públicas (GitHub Pages, branch gh-pages) a partir de docs/*.md.
Uso: python scripts/gerar_paginas_legais.py <pasta_saida>"""
import os
import re
import sys

import markdown

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINAS = [
    ('politica-de-privacidade', 'Política de Privacidade'),
    ('termos-de-uso', 'Termos de Uso'),
    ('exclusao-de-conta', 'Exclusão de Conta'),
]
CSS = """
:root{--roxo:#B367D4;--texto:#1E293B;--suave:#64748B;--fundo:#F6F6F8;--card:#FFFFFF;--borda:#E2E8F0}
@media (prefers-color-scheme:dark){:root{--texto:#E2E8F0;--suave:#94A3B8;--fundo:#0F172A;--card:#1E293B;--borda:#334155}}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background:var(--fundo);color:var(--texto);line-height:1.65}
header{background:var(--roxo);color:#fff;padding:20px 16px}header .w{max-width:820px;margin:0 auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
header a{color:#fff;text-decoration:none;font-weight:700;font-size:1.15rem}nav{margin-left:auto;display:flex;gap:14px;flex-wrap:wrap}nav a{font-weight:500;font-size:.95rem;opacity:.9}nav a[aria-current]{text-decoration:underline;opacity:1}
main{max-width:820px;margin:24px auto;padding:0 16px}article{background:var(--card);border:1px solid var(--borda);border-radius:14px;padding:28px clamp(16px,4vw,40px)}
h1{color:var(--roxo);margin-top:0;font-size:1.9rem;line-height:1.25}h2{margin-top:2rem;font-size:1.3rem;color:var(--roxo)}h3{font-size:1.05rem}
a{color:var(--roxo)}blockquote{margin:1rem 0;padding:12px 16px;background:rgba(179,103,212,.1);border-left:4px solid var(--roxo);border-radius:8px}
.tabela{overflow-x:auto}table{border-collapse:collapse;width:100%;font-size:.92rem}th,td{border:1px solid var(--borda);padding:8px 10px;text-align:left;vertical-align:top}th{background:rgba(179,103,212,.12)}
code{background:rgba(127,127,127,.15);padding:1px 5px;border-radius:4px;font-size:.9em}footer{text-align:center;color:var(--suave);font-size:.85rem;padding:24px 16px}
"""


def nav(atual):
    return '<a href="baixar.html">Baixar</a>' + ''.join(
        f'<a href="{s}.html"{" aria-current=\"page\"" if s == atual else ""}>{t}</a>' for s, t in PAGINAS
    )


def pagina(slug, titulo, corpo):
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo} · Apsicare</title><meta name="description" content="{titulo} do aplicativo Apsicare."><style>{CSS}</style></head>
<body><header><div class="w"><a href="index.html">Apsicare</a><nav>{nav(slug)}</nav></div></header>
<main><article>{corpo}</article></main><footer>Apsicare · projeto acadêmico (TCC) · contato: apsicare.noreply@gmail.com</footer></body></html>
"""


def main(saida):
    os.makedirs(saida, exist_ok=True)
    for slug, titulo in PAGINAS:
        md = open(os.path.join(RAIZ, 'docs', f'{slug}.md'), encoding='utf-8').read()
        md = re.sub(r'\(\./(politica-de-privacidade|termos-de-uso|exclusao-de-conta)\.md\)', r'(\1.html)', md)
        corpo = markdown.markdown(md, extensions=['tables', 'sane_lists'])
        corpo = corpo.replace('<table>', '<div class="tabela"><table>').replace('</table>', '</table></div>')
        open(os.path.join(saida, f'{slug}.html'), 'w', encoding='utf-8').write(pagina(slug, titulo, corpo))
    links = ''.join(f'<li><a href="{s}.html">{t}</a></li>' for s, t in PAGINAS)
    botao = '<p><a href="baixar.html" style="display:inline-block;background:#B367D4;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:10px">Baixar o app (Android)</a></p>'
    indice = f'<h1>Apsicare: documentos legais</h1><p>Diário de humor e bem-estar que conecta paciente e psicólogo.</p>{botao}<ul>{links}</ul>'
    open(os.path.join(saida, 'index.html'), 'w', encoding='utf-8').write(pagina('index', 'Documentos legais', indice))
    open(os.path.join(saida, '.nojekyll'), 'w').close()


if __name__ == '__main__':
    main(sys.argv[1])
