"""Draws the README art in docs/readme/: Nobody (light and dark) and the hero
banner (light and dark). Text is converted to outlines, because GitHub won't
load web fonts inside an SVG.

    pip install fonttools brotli uharfbuzz
    npm install            # for the Geist font files
    python3 scripts/readme_art.py

The social preview PNG is a screenshot of hero-light.svg at 1280x640.
"""

from __future__ import annotations

import io
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "readme"
GEIST = ROOT / "node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2"

THEMES = {
    "light": {
        "page": "#f8f8f9",
        "edge": "#e6e6ea",
        "fg": "#18181b",
        "fg3": "#6d6d77",
        "wool": "#d3d3d9",
        "face": "#3b3b43",
        "mask": "#6e56cf",
        "eye": "#f8f8f9",
    },
    "dark": {
        "page": "#0f0f11",
        "edge": "#29292f",
        "fg": "#ececef",
        "fg3": "#8d8d97",
        "wool": "#3b3b43",
        "face": "#b4b4bc",
        "mask": "#a898fa",
        "eye": "#0f0f11",
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


def load_font(weight: int) -> tuple[TTFont, hb.Font]:
    font = TTFont(GEIST)
    font.flavor = None
    static = instantiateVariableFont(font, {"wght": weight}, inplace=False)
    buf = io.BytesIO()
    static.save(buf)
    data = buf.getvalue()
    hb_font = hb.Font(hb.Face(hb.Blob(data)))
    return TTFont(io.BytesIO(data)), hb_font


def text_path(text: str, weight: int, size: float, x: float, y: float, tracking_em: float = 0.0) -> tuple[str, float]:
    """Returns an SVG path for `text` with its baseline at (x, y), and its width."""
    ft, font = load_font(weight)
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


def mark(t: dict, x: float, y: float, size: float) -> str:
    s = size / 32
    dots = [(7, 7), (16, 7), (25, 7), (7, 16), (25, 16), (7, 25), (16, 25), (25, 25)]
    grey = "".join(f'<circle cx="{x + cx * s:.2f}" cy="{y + cy * s:.2f}" r="{3 * s:.2f}"/>' for cx, cy in dots)
    return (
        f'<g fill="{t["fg"]}" fill-opacity="0.38">{grey}</g>'
        f'<circle cx="{x + 16 * s:.2f}" cy="{y + 16 * s:.2f}" r="{3.4 * s:.2f}" fill="{t["mask"]}"/>'
    )


def hero_svg(t: dict) -> str:
    w, h = 1280, 640
    left = 104
    word, _ = text_path("OneOfMany", 600, 104, left, 330, -0.022)
    line1, _ = text_path("Your account is anonymous.", 400, 38, left + 2, 410, -0.011)
    line2, _ = text_path("Is your post?", 400, 38, left + 2, 462, -0.011)

    # A 3x3 flock on the right; the middle one is Nobody.
    cell, scale = 150, 2.15
    gx, gy = 736, (h - 3 * cell) / 2 + 2
    flock = []
    for row in range(3):
        for col in range(3):
            ox = gx + col * cell + (cell - 60 * scale) / 2
            oy = gy + row * cell + (cell - 64 * scale) / 2
            flock.append(f'<g transform="translate({ox:.1f} {oy:.1f}) scale({scale})">{sheep(t, row == 1 and col == 1)}</g>')

    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" '
        'aria-label="OneOfMany. Your account is anonymous. Is your post? A flock of nine identical sheep; '
        'the one in the middle, Nobody, wears a small violet mask.">'
        f'<rect x="0.5" y="0.5" width="{w - 1}" height="{h - 1}" rx="24" fill="{t["page"]}" stroke="{t["edge"]}"/>'
        f"{mark(t, left + 2, 160, 56)}"
        f'<path d="{word}" fill="{t["fg"]}"/>'
        f'<path d="{line1}" fill="{t["fg3"]}"/>'
        f'<path d="{line2}" fill="{t["fg3"]}"/>'
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
