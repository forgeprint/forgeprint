"""Render the mark to PNG, for the places that will not take an SVG.

GitHub's organisation avatar is the reason this exists: it accepts PNG, GIF
and JPG and nothing else. The SVG stays the source of truth — the geometry
below is the same two paths, written as coordinates instead of a path string —
and this script is here so the PNGs can be regenerated rather than treated as
artefacts nobody can reproduce.

Needs Pillow, which is not a dependency of this repository:

    pip install pillow
    python docs/brand/make-png.py
"""

from PIL import Image, ImageDraw

# The 24-unit grid the SVG is drawn on.
DIE = [(12, 2), (22, 7.5), (12, 13), (2, 7.5)]
IMPRESSION = [(12, 10.5), (22, 16), (12, 21.5), (2, 16)]
IMPRESSION_WIDTH = 1.8
IMPRESSION_ALPHA = 0.55

# Supersample, because Pillow's polygon fill has no antialiasing. Four is
# enough for a clean edge at these sizes and costs nothing here.
SUPERSAMPLE = 4

VARIANTS = [
    # name, size, foreground, background, scale of the 24-grid within the canvas
    # 17.0 puts the mark at about two thirds of the canvas. GitHub renders an
    # avatar at 20-40px in lists, and at 55% the two shapes were a smudge.
    ("forgeprint-avatar-512.png", 512, "#ff9f57", "#15151a", 17.0),
    ("forgeprint-avatar-light-512.png", 512, "#b8541a", "#ffffff", 17.0),
]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def render(path: str, size: int, fg: str, bg: str, scale: float) -> None:
    canvas = size * SUPERSAMPLE
    step = scale * SUPERSAMPLE
    # Centre the 24-grid on the canvas.
    offset = canvas / 2 - 12 * step

    def place(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
        return [(x * step + offset, y * step + offset) for x, y in points]

    image = Image.new("RGBA", (canvas, canvas), (*hex_to_rgb(bg), 255))

    # The impression goes down first and the die covers it. Drawn the other
    # way round, the semi-transparent outline crosses the die and leaves a
    # band through the one shape that is meant to be solid.
    layer = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
    outline = place(IMPRESSION)
    ImageDraw.Draw(layer).line(
        outline + [outline[0]],
        fill=(*hex_to_rgb(fg), round(IMPRESSION_ALPHA * 255)),
        width=round(IMPRESSION_WIDTH * step),
        joint="curve",
    )
    image = Image.alpha_composite(image, layer)
    ImageDraw.Draw(image).polygon(place(DIE), fill=(*hex_to_rgb(fg), 255))
    image = image.convert("RGB")

    image.resize((size, size), Image.LANCZOS).save(path, "PNG", optimize=True)
    print(f"wrote {path}  {size}x{size}")


if __name__ == "__main__":
    from pathlib import Path

    here = Path(__file__).parent
    for name, size, fg, bg, scale in VARIANTS:
        render(str(here / name), size, fg, bg, scale)
