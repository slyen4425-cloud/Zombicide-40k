"""Extract only twelve author-approved PNGs from immutable GitHub upload.

This script is for the WORK branch only. The original user ZIP is never
modified or deleted. Any unexpected archive/path/pixel metadata fails closed.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
from zipfile import ZipFile

SOURCE_SHA256 = "18da5d1e84401c0b68ded24971d892f26f2338b92c1b02330254d20ffde13f7f"
NAMES = (
    "drop_elfe_vent_plume.png",
    "drop_gemmor_graine_carnivore.png",
    "drop_gorice_cristal_givre.png",
    "drop_grenou_poche_aquatique.png",
    "drop_heriplante_bourgeon_epineux.png",
    "drop_kitsune_lunaire_amulette_lunaire.png",
    "drop_liane_venimeuse_fleur_venimeuse.png",
    "drop_lumilo_eclat_lumiere.png",
    "drop_moussado_feuille.png",
    "drop_peste_noire_spore_pestilentielle.png",
    "drop_pieuvre_perle_encre.png",
    "drop_venombre_croc_venimeux.png",
)
PREFIX = "icones_png_512/"
SIGNATURE = bytes([137, 80, 78, 71, 13, 10, 26, 10])


def main(archive_path: str, destination_path: str) -> None:
    archive = Path(archive_path)
    if not archive.is_file():
        raise FileNotFoundError(archive)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError("Uploaded ZIP changed: refusing to invent a new asset source")
    dest = Path(destination_path).resolve()
    verified = []
    with ZipFile(archive) as z:
        source = {
            info.filename: info
            for info in z.infolist()
            if not info.is_dir()
        }
        expected = {PREFIX + x for x in NAMES}
        found = {name for name in source if name.startswith(PREFIX)}
        if found != expected or len(source) != 17:
            raise ValueError(
                "Expected precisely 12 uploaded PNG assets and 5 source/reference files"
            )
        for filename in NAMES:
            name = PREFIX + filename
            info = source[name]
            if info.file_size > 2_000_000:
                raise ValueError("Unexpected oversized PNG: " + filename)
            content = z.read(info)
            if content[:8] != SIGNATURE or content[12:16] != b"IHDR":
                raise ValueError("Not a real PNG file: " + filename)
            width, height = struct.unpack(">II", content[16:24])
            if (width, height) != (512, 512):
                raise ValueError("Uploaded icon is not exactly 512 x 512: " + filename)
            if content[25] not in (4, 6):
                raise ValueError("Uploaded icon must use PNG with alpha: " + filename)
            target = dest / filename
            if target.exists() and target.read_bytes() != content:
                raise ValueError("Refusing to overwrite an existing icon: " + filename)
            verified.append((target, content))
    # Only mutate the working tree after every single image is validated.
    dest.mkdir(parents=True, exist_ok=True)
    for target, content in verified:
        target.write_bytes(content)
    provenance = {
        "schema": "gensrpg-capture-drop-icons-source-v1",
        "sourceRepository": "slyen4425-cloud/Zombicide-40k",
        "sourceCommit": "4bac69424ccf0dabb078258eba0d0ab45689b496",
        "sourceArchive": archive.name,
        "sourceZipSha256": SOURCE_SHA256,
        "iconCount": 12,
        "files": [
            {
                "name": target.name,
                "sha256": hashlib.sha256(content).hexdigest(),
                "width": 512,
                "height": 512,
            }
            for target, content in verified
        ],
    }
    (dest / "provenance.v1.json").write_text(
        json.dumps(provenance, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print("GENSRPG_AUTHOR_DROP_PNGS_IMPORTED", len(verified), digest)
    print("GENSRPG_AUTHOR_DROP_OUTPUT", str(dest))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("usage: import_capture_drop_icons_20261110.py uploaded.zip dest")
    main(sys.argv[1], sys.argv[2])
