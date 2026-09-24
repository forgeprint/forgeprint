# Core Web Vitals

The thresholds are about real users: **LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1,
at the 75th percentile of page loads, mobile and desktop separately.** Lab tools
find causes; they do not decide the result.

| #   | Check                                                                                                      | How                                                                     | Source                       |
| --- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| V1  | The three thresholds and the percentile are written in the project's targets file                          | the file exists and states them                                         | Web Vitals                   |
| V2  | Pass or fail is decided on field data at p75, per device class, wherever the project has users             | web-vitals `onLCP`, `onINP`, `onCLS` reporting, or the page's CrUX data | Web Vitals; web-vitals 6.2   |
| V3  | Every lab number is labelled lab; INP is never claimed from a load-only run; TBT is named as a proxy       | read the report                                                         | INP article; Lighthouse 13.5 |
| V4  | The LCP element is identified, and if it is an image it is not lazy-loaded and is discoverable in the HTML | find it in a lab trace; command V4 on that template                     | Optimize LCP                 |
| V5  | Every `img` and `video` has `width` and `height`, or its box has an `aspect-ratio`                         | command V5; read each hit                                               | Optimize CLS                 |
| V6  | Web fonts have a `font-display` strategy and a fallback chosen to keep the swap from shifting text         | command V6; read each `@font-face`                                      | Optimize CLS                 |
| V7  | Nothing is inserted above painted content without space reserved for it — banners, embeds, late ads        | read every insertion that happens after load                            | Optimize CLS                 |
| V8  | No input handler runs a task longer than 50 ms; long work is split and yields to the main thread           | record a trace of the interaction in the browser's performance panel    | Long tasks; INP article      |

## Commands

```sh
# V4 — lazy-loading in the templates that render the LCP element
grep -rnE 'loading="lazy"' src

# V5 — images and videos with no width attribute (then check for aspect-ratio in CSS)
grep -rnE '<(img|video)\b' src | grep -v 'width='

# V6 — font faces, to read their font-display
grep -rn '@font-face' src
```

## Why each one

**V2 is the row that stops the most common false claim.** A Lighthouse score
from a developer's machine is one load, on fast hardware, with no interaction.
The thresholds are defined at the 75th percentile of real loads, and a site can
be green in the lab and failing in the field for most of its mobile users.

**V3 follows from it.** A load-only lab run observes no interaction, so it has
no INP to report. Total Blocking Time moves with INP often enough to be useful,
and differently often enough that it is never reported as INP.

**V4** is the single cheapest fix in this list. Lazy-loading the image the page
is measured by tells the browser to fetch it late, on purpose.
