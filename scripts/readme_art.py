"""Draws the README art in docs/readme/: Nobody (light and dark) and the hero
banner (light and dark), in the same paper-and-ink look as the site. Text
is converted to outlines, because GitHub won't load web fonts inside an SVG.

    pip install fonttools brotli uharfbuzz
    npm install            # for the Newsreader, Courier Prime and Kalam files
    python3 scripts/readme_art.py

The social preview PNG is a screenshot of hero-light.svg at 1280x640.
"""

from __future__ import annotations

import io
import re
from functools import lru_cache
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "readme"
FILES = ROOT / "node_modules"
SERIF = FILES / "@fontsource-variable/newsreader/files/newsreader-latin-opsz-normal.woff2"
SERIF_ITALIC = FILES / "@fontsource-variable/newsreader/files/newsreader-latin-opsz-italic.woff2"
MONO = FILES / "@fontsource/courier-prime/files/courier-prime-latin-700-normal.woff2"

THEMES = {
    "light": {
        "paper": "#fdfbf6",
        "edge": "#221e18",
        "shadow": "#221e18",
        "rule": "#c8d8ec",
        "margin": "#eaa29a",
        "fg": "#221e18",
        "fg3": "#776e60",
        "wool": "#fffdf8",
        "face": "#2c2720",
        "line": "#221e18",
        "mask": "#6249cf",
        "eye": "#fffdf8",
        "red": "#cf3a2f",
    },
    "dark": {
        "paper": "#23201b",
        "edge": "#5e5748",
        "shadow": "#070605",
        "rule": "#2c3442",
        "margin": "#5a2e2a",
        "fg": "#efe8da",
        "fg3": "#998f7e",
        "wool": "#ece5d5",
        "face": "#1a1813",
        "line": "#0c0b09",
        "mask": "#b4a3ff",
        "eye": "#ece5d5",
        "red": "#e65a4d",
    },
}

# ------------------------------------------------------------------ Nobody
# Flattened from the sheep that used to live in the app: nine circles of
# wool in one fill, one shape for the face, two legs, and a domino mask.
# Drawn on a 60x64 grid.

WOOL = [
    (15, 29, 10), (22, 19, 10.5), (31, 15, 10.5), (40, 19, 10.5), (46, 29, 10),
    (41, 39, 10.5), (30, 42, 10.5), (19, 39, 10.5), (30, 29, 13),
]
TUFT = [(26, 23.5, 4), (30.5, 21.5, 4.6), (34.6, 23.6, 3.8)]
FACE = "M30 23c6.5 0 9.5 5 9.5 11 0 6.5-4.5 11-9.5 11s-9.5-4.5-9.5-11c0-6 3-11 9.5-11z"
EARS = [(17.5, 31, -22), (42.5, 31, 22)]
# The mask: a band across the eyes with two holes (even-odd fill).
MASK = (
    "M17.2 31.2C19.8 27.9 25 28.4 30 30.1 35 28.4 40.2 27.9 42.8 31.2 43.5 34.4 41.6 37.6 37.8 37.7 "
    "34.9 37.8 32.4 36.3 30 35.4 27.6 36.3 25.1 37.8 22.2 37.7 18.4 37.6 16.5 34.4 17.2 31.2Z"
    "M23.7 33.2a2.7 2.3 0 1 0 5.4 0a2.7 2.3 0 1 0-5.4 0Z"
    "M30.9 33.2a2.7 2.3 0 1 0 5.4 0a2.7 2.3 0 1 0-5.4 0Z"
)


def circles(items: list[tuple[float, float, float]]) -> str:
    return "".join(f'<circle cx="{x}" cy="{y}" r="{r}"/>' for x, y, r in items)


def sheep(t: dict, masked: bool) -> str:
    ears = "".join(
        f'<ellipse cx="{x}" cy="{y}" rx="6.5" ry="3.2" transform="rotate({a} {x} {y})"/>' for x, y, a in EARS
    )
    legs = '<rect x="20" y="44" width="5" height="14" rx="2.5"/><rect x="35" y="44" width="5" height="14" rx="2.5"/>'
    parts = [
        # The silhouette, stroked and drawn first, leaves an ink outline
        # around the outside once the fills go on top.
        f'<g fill="{t["line"]}" stroke="{t["line"]}" stroke-width="3.2" stroke-linejoin="round">{legs}{circles(WOOL)}{ears}</g>',
        f'<g fill="{t["face"]}">{legs}</g>',
        f'<g fill="{t["wool"]}">{circles(WOOL)}</g>',
        f'<g fill="{t["face"]}">{ears}<path d="{FACE}"/></g>',
        f'<g fill="{t["wool"]}">{circles(TUFT)}</g>',
    ]
    if masked:
        parts.append(f'<path d="{MASK}" fill="{t["mask"]}" fill-rule="evenodd"/>')
    # Calm and neutral: two small eyes, no mouth.
    parts.append(f'<g fill="{t["eye"]}"><circle cx="26.4" cy="33.2" r="1.2"/><circle cx="33.6" cy="33.2" r="1.2"/></g>')
    return "".join(parts)


def nobody_svg(t: dict) -> str:
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-8 -6 76 76" '
        'role="img" aria-label="Nobody, a sheep in a small violet mask">'
        f"{sheep(t, True)}</svg>\n"
    )


# ------------------------------------------------------------------ text as outlines


@lru_cache(maxsize=None)
def load_font(path: Path, axes: tuple[tuple[str, float], ...]) -> tuple[TTFont, hb.Font]:
    font = TTFont(path)
    font.flavor = None
    if axes:
        font = instantiateVariableFont(font, dict(axes), inplace=False)
    buf = io.BytesIO()
    font.save(buf)
    data = buf.getvalue()
    return TTFont(io.BytesIO(data)), hb.Font(hb.Face(hb.Blob(data)))


def text_path(text: str, font_file: Path, size: float, x: float, y: float, axes: dict | None = None, tracking_em: float = 0.0) -> tuple[str, float]:
    """Returns an SVG path for `text` with its baseline at (x, y), and its width."""
    ft, font = load_font(font_file, tuple(sorted((axes or {}).items())))
    upem = ft["head"].unitsPerEm
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": True})
    glyphs = ft.getGlyphSet()
    order = ft.getGlyphOrder()
    scale = size / upem
    pen = SVGPathPen(glyphs)
    cursor = 0.0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        transform = (scale, 0, 0, -scale, x + (cursor + pos.x_offset) * scale, y - pos.y_offset * scale)
        glyphs[name].draw(TransformPen(pen, transform))
        cursor += pos.x_advance + tracking_em * upem
    width = (cursor - tracking_em * upem) * scale
    return pen.getCommands(), width


# ------------------------------------------------------------------ hero banner

# The red-pencil ring from the site's headline, drawn in a 200x100 box.
RING = "M34 16C86 0 172 4 190 40C202 72 146 96 92 93C38 90 4 72 10 46C15 26 48 12 104 9"


def ring(x: float, y: float, w: float, h: float) -> str:
    nums = iter(float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", RING))
    out = []
    for cmd in re.findall(r"[MC]", RING):
        k = 1 if cmd == "M" else 3
        pts = []
        for _ in range(k):
            px, py = next(nums), next(nums)
            pts.append(f"{x + px / 200 * w:.1f} {y + py / 100 * h:.1f}")
        out.append(cmd + " ".join(pts))
    return "".join(out)


def hero_svg(t: dict) -> str:
    w, h = 1280, 640
    left = 116
    serif = {"wght": 400, "opsz": 36}
    # Text sits on the ruled lines, 46px apart, the way handwriting would.
    label, _ = text_path("A PRIVACY CHECK FOR ANONYMOUS POSTS", MONO, 18, left + 4, 198, tracking_em=0.08)
    word, _ = text_path("OneOfMany", SERIF_ITALIC, 100, left, 336, {"wght": 700, "opsz": 72}, -0.02)
    line1, _ = text_path("Your account is anonymous.", SERIF, 42, left + 4, 428, serif, -0.01)
    lead, lead_w = text_path("Is your ", SERIF, 42, left + 4, 474, serif, -0.01)
    post, post_w = text_path("post?", SERIF, 42, left + 4 + lead_w, 474, serif, -0.01)
    circle = ring(left + 4 + lead_w - 6, 432, post_w + 22, 58)

    # Ruled lines and a red margin, like a page of the notebook.
    rules = "".join(f'<line x1="10" x2="{w - 22}" y1="{y}" y2="{y}"/>' for y in range(64, h - 30, 46))

    # A 3x3 flock on the right; the middle one is Nobody.
    cell, scale = 138, 1.95
    gx, gy = 800, (h - 3 * cell) / 2 - 6
    flock = []
    for row in range(3):
        for col in range(3):
            ox = gx + col * cell + (cell - 60 * scale) / 2
            oy = gy + row * cell + (cell - 64 * scale) / 2
            flock.append(f'<g transform="translate({ox:.1f} {oy:.1f}) scale({scale})">{sheep(t, row == 1 and col == 1)}</g>')

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" '
        'aria-label="OneOfMany. Your account is anonymous. Is your post? A flock of nine identical sheep on a notebook page; '
        'the one in the middle, Nobody, wears a small violet mask.">'
        f'<rect x="14" y="14" width="{w - 20}" height="{h - 20}" rx="10" fill="{t["shadow"]}"/>'
        f'<rect x="4" y="4" width="{w - 20}" height="{h - 20}" rx="10" fill="{t["paper"]}" stroke="{t["edge"]}" stroke-width="3"/>'
        f'<g stroke="{t["rule"]}" stroke-width="1.5">{rules}</g>'
        f'<line x1="80" x2="80" y1="6" y2="{h - 18}" stroke="{t["margin"]}" stroke-width="2"/>'
        f'<path d="{label}" fill="{t["fg3"]}"/>'
        f'<path d="{word}" fill="{t["fg"]}"/>'
        f'<path d="{line1}" fill="{t["fg"]}"/>'
        f'<path d="{lead}" fill="{t["fg"]}"/>'
        f'<path d="{post}" fill="{t["fg"]}"/>'
        f'<path d="{circle}" fill="none" stroke="{t["red"]}" stroke-width="4" stroke-linecap="round"/>'
        f'{"".join(flock)}'
        "</svg>\n"
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, t in THEMES.items():
        suffix = "" if name == "light" else "-dark"
        (OUT / f"nobody{suffix}.svg").write_text(nobody_svg(t))
        (OUT / f"hero-{name}.svg").write_text(hero_svg(t))
    print("wrote", sorted(p.name for p in OUT.glob("*.svg")))


if __name__ == "__main__":
    main()
