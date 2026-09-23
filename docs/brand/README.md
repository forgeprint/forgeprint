# Brand

The mark, and the one thing that goes wrong with it.

## The files

| File                              | Colour                       | Use it                                                           |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| `forgeprint-mark.svg`             | `currentColor`               | **Inlined** in a page, where CSS sets the colour                 |
| `forgeprint-mark-accent.svg`      | brand orange, light and dark | Anywhere you cannot set the colour: a README, a listing, a slide |
| `forgeprint-lockup.svg`           | `currentColor`               | Mark plus the word, when you need both in one file               |
| `favicon.svg`                     | brand orange, light and dark | The browser tab. Linked from every page                          |
| `forgeprint-avatar-512.png`       | orange on near-black         | GitHub's organisation avatar, and anywhere that refuses SVG      |
| `forgeprint-avatar-light-512.png` | orange on white              | The same, where a dark square would fight the surroundings       |

The PNGs are generated from the same geometry by `make-png.py`, which needs
Pillow — not a dependency of this repository:

```bash
pip install pillow
python docs/brand/make-png.py
```

They exist because GitHub's avatar field takes PNG, GIF or JPG and nothing
else. The SVG stays the source of truth; regenerate rather than edit the PNG.

## The thing that goes wrong

`currentColor` only resolves against the surrounding page when the SVG is
**inline**. Loaded through `<img src="forgeprint-mark.svg">` it is a separate
document, `currentColor` falls back to black, and the mark disappears on a dark
background.

So: inline `forgeprint-mark.svg`, or `<img>` the accent one. There is no third
option, and this is the mistake to expect.

```html
<!-- Works: the mark takes the colour around it -->
<span class="brand"><svg viewBox="0 0 24 24">…</svg> Forgeprint</span>

<!-- Works: the colour is in the file -->
<img src="brand/forgeprint-mark-accent.svg" width="24" height="24" alt="Forgeprint" />

<!-- Does not: black on black -->
<img src="brand/forgeprint-mark.svg" width="24" height="24" alt="Forgeprint" />
```

## What it is

A die and the impression it leaves — forge and print, in one glyph. The solid
plate is the only emphasis; the outline below is quiet and sits half behind it,
which is what makes it read as an impression rather than a second object.

Two elements, not three. A third echo turned it into a generic layer stack, and
closed into a smudge below about 24px.

**Draw order matters.** The impression goes down first and the die covers it.
The other way round, the semi-transparent outline crosses the die and leaves a
band through the one shape that is meant to be solid.

## Colour

The mark uses one accent, the same one the whole product uses:

| Token      | Light     | Dark      |
| ---------- | --------- | --------- |
| `--accent` | `#b8541a` | `#ff9f57` |

Do not introduce a second brand colour for the mark. Monochrome is fine and
often better — the `currentColor` file exists for exactly that.

## Clear space and size

- Keep clear space of at least half the mark's height on every side.
- Below 24px use `favicon.svg`: it opens the geometry and thickens the stroke,
  because the impression closes into a blob otherwise.
- The mark is square. Do not stretch it, rotate it, or put it in a circle.

## The wordmark is live text

`forgeprint-lockup.svg` sets the word as text rather than outlines, so it
renders with whatever sans the viewer has. That is deliberate: the site already
sets the word in HTML beside the mark, and a second wordmark as paths would
give the project two slightly different ones. Where the rendering has to be
exact, use the mark alone and set the word yourself.

## Name and logo

Both are covered by [TRADEMARK.md](../../TRADEMARK.md): they identify this
project and its official distributions. A published fork renames and uses its
own mark. Blueprint content is CC BY 4.0 and the tooling is PolyForm Shield —
neither licence grants the name or the mark.
