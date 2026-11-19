#!/usr/bin/env python3
"""
Gera o ZIP do totem Windows em dist-totem/mediaplayer-totem-AAAAMMDD-HHMM.zip.

Conteúdo: backend/app + requirements, frontend/dist (compilado aqui, o totem não
precisa de Node) e os arquivos de totem/ (instaladores .bat/.ps1 e LEIA-ME).
Não inclui banco, uploads, .env nem .venv: o conteúdo do totem é separado do programa.

Uso (na raiz do projeto):
    python3 scripts/empacotar_totem.py              # compila o frontend e empacota
    python3 scripts/empacotar_totem.py --sem-build  # usa o frontend/dist já existente
"""
import argparse
import datetime
import subprocess
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
TOTEM = RAIZ / "totem"
SAIDA = RAIZ / "dist-totem"
PASTA_NO_ZIP = "mediaplayer-totem"


def executar(cmd, cwd):
    print("$", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def saida_git(*args):
    try:
        r = subprocess.run(["git", *args], cwd=RAIZ, capture_output=True, text=True, check=True)
        return r.stdout.strip()
    except Exception:
        return ""


def compilar_frontend():
    frontend = RAIZ / "frontend"
    if not (frontend / "node_modules").exists():
        executar(["npm", "ci"], frontend)
    executar(["npm", "run", "build"], frontend)


def para_windows(caminho: Path) -> bytes:
    """Converte para CRLF; .ps1/.txt em UTF-8 com BOM (Windows PowerShell 5.1 e Bloco de Notas)."""
    texto = caminho.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\n", "\r\n")
    if caminho.suffix.lower() == ".bat":
        # cmd.exe lê na página de código do console: acentos quebrariam
        if not texto.isascii():
            raise SystemExit(f"{caminho} tem caracteres não-ASCII; .bat deve ser só ASCII")
        return texto.encode("ascii")
    return b"\xef\xbb\xbf" + texto.encode("utf-8")


def arquivos_programa():
    """(caminho no disco, caminho dentro do ZIP) do backend, frontend compilado e totem/."""
    backend_app = RAIZ / "backend" / "app"
    for f in sorted(backend_app.rglob("*")):
        if f.is_file() and "__pycache__" not in f.parts and f.suffix != ".pyc":
            yield f, f.relative_to(RAIZ).as_posix()
    yield RAIZ / "backend" / "requirements.txt", "backend/requirements.txt"

    dist = RAIZ / "frontend" / "dist"
    if not (dist / "index.html").exists():
        raise SystemExit("frontend/dist não encontrado: rode sem --sem-build")
    for f in sorted(dist.rglob("*")):
        if f.is_file():
            yield f, f.relative_to(RAIZ).as_posix()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--sem-build", action="store_true", help="não compila o frontend")
    args = parser.parse_args()

    if not args.sem_build:
        compilar_frontend()

    agora = datetime.datetime.now()
    commit = saida_git("rev-parse", "--short", "HEAD")
    branch = saida_git("rev-parse", "--abbrev-ref", "HEAD")
    sujo = " (com alterações não commitadas)" if saida_git("status", "--porcelain") else ""
    versao = f"Pacote gerado em {agora:%d/%m/%Y %H:%M} - branch {branch} commit {commit}{sujo}\n"

    SAIDA.mkdir(exist_ok=True)
    destino = SAIDA / f"{PASTA_NO_ZIP}-{agora:%Y%m%d-%H%M}.zip"
    total = 0
    with zipfile.ZipFile(destino, "w", zipfile.ZIP_DEFLATED) as z:
        def add(nome, dados):
            nonlocal total
            z.writestr(f"{PASTA_NO_ZIP}/{nome}", dados)
            total += 1

        for origem, nome in arquivos_programa():
            add(nome, origem.read_bytes())
        for f in sorted(TOTEM.rglob("*")):
            if f.is_file():
                add(f.relative_to(TOTEM).as_posix(), para_windows(f))
        add("VERSAO.txt", b"\xef\xbb\xbf" + versao.replace("\n", "\r\n").encode("utf-8"))

    mb = destino.stat().st_size / 1024 / 1024
    print(f"\nOK: {destino.relative_to(RAIZ)}  ({total} arquivos, {mb:.1f} MB)")
    print(versao.strip())


if __name__ == "__main__":
    sys.exit(main())
