# comensee

Website for Come n See, an East London art collective and film club run by Veronika Butkevich (@vmbut). Instagram: [@_come_n_see_](https://www.instagram.com/_come_n_see_/). Contact: comensee.info@gmail.com.

A static site in the same style as `../vmbutkevich`: plain HTML, one stylesheet, one script, no build step and no dependencies.

## Layout

- `index.html`: home page. The crayon logo centred at the top, the star show in the middle, the concept and links below, then the prints.
- `css/site.css`: paper background, black ink, the handwriting font (Nanum Pen Script, from Google Fonts) and the type scale carried over from vmbutkevich.
- `js/site.js`: the star show, the prints and mixed-media posters, and the fade-ins.
- `img/`: web-sized photos (1400px on the long side, JPEG quality 70; the print effect never uses more), plus:
  - `logo.png`: the crayon "COME n SEE", cut out of the launch party poster (`references/logo plus writing.png`) onto a transparent background.
  - `paper.png`: a seamless 512px printed-paper tile (grain, specks, faint banding and scratches), used as the page background.
- `originals/`: full-size photos as supplied, and in `originals/posters/` the full-size hand-made posters. Ignored by git, so keep a backup.
- `references/`: design references (the printed-paper example, the launch party poster, the two mixed-media poster examples and the star-logo example). Ignored by git.

## The star show and the prints

The event photos are used twice, at the same time:

- **Star show** (first screen, under the crayon logo): the people from one photo, cut out in stars and laid on the paper. The stars are put down one by one, held for about three seconds, and lifted off as the next photo's go down. Each photo is given a printed look in the browser (lifted blacks, softer colour, grain, banding, slightly off-register red), and every star is the same size, with rough scissor-cut edges, a thin paper margin and a soft shadow.
- **Prints** (one screen down): the photo the stars came from, filling the screen with star-shaped holes where the people are, so the paper shows through. It changes with the star show. On upright screens (phones) each print is shown whole in the middle of the screen.

The stars land at random within each person's outline, more of them over the head (so faces show clearly) and fewer over the body (so it's patchier), and they may overlap. About one in five drifts well outside the outline so the shapes aren't neat. Stars that would cross the edge of the photo are left out.

Some prints are mixed-media posters instead:

- **Hand-made posters** (`data-poster` on the photo): collages made by hand from the printed photos, in `img/posters/`. They're WebP files, 1600px tall, with transparent backgrounds so the paper shows around the pieces and through the holes. The full-size PNGs they were made from are in `originals/posters/`.
- **Halftone posters** (`data-style="halftone"`): generated in the browser, after the red example in `references/`. A CMYK halftone print of one person's face on red paper, signed "@_come_n_see_", over the photo in black and white with a red square of paper covering that face and a star drawn on it in white pen. `data-face` picks the person (0 is the first outline). This style has no star cutouts.

Visitors who ask for reduced motion get a plain swap every six seconds.

The photos are listed in the `<template>` inside `.star-show` in `index.html`, with their size in `width` and `height`. Each one has a `data-people` attribute with an outline of every person in it: `x y x y …` in percent of the photo's width and height (`0 0` is the top-left corner), one outline per person, separated by `;`. The stars are scattered over these outlines, and the halftone posters use them to find a face.

To add a photo:

1. Put the original in `originals/` and make a web copy:
   ```sh
   sips -Z 1400 -s format jpeg -s formatOptions 70 originals/NAME.jpg --out img/name.jpg
   ```
2. Add an `<img alt="" data-src="/img/name.jpg" width="…" height="…" data-people="…">` line to the template, with an outline for each person. It joins the star show's rotation. To show a hand-made poster below it, save a WebP of the poster to `img/posters/` and add `data-poster="/img/posters/name.webp"`; or add `data-style="halftone" data-face="0"` for a generated halftone poster.

## Preview locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
