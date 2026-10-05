# comensee

Website for Come n See, an East London art collective and film club run by Veronika Butkevich (@vmbut). Instagram: [@_come_n_see_](https://www.instagram.com/_come_n_see_/). Contact: comensee.info@gmail.com.

A static site in the same style as `../vmbutkevich`: plain HTML, one stylesheet, one script, no build step and no dependencies.

## Layout

- `index.html`: home page. The crayon logo centred at the top, the star show in the middle, the concept and links below, then the prints.
- `css/site.css`: paper background, black ink, the handwriting font (Nanum Pen Script, from Google Fonts) and the type scale carried over from vmbutkevich.
- `js/site.js`: the star show, the prints and collages, and the fade-ins.
- `img/`: web-sized photos (1400px on the long side, JPEG quality 70; the print effect never uses more), plus:
  - `logo.png`: the crayon "COME n SEE", cut out of the launch party poster (`references/logo plus writing.png`) onto a transparent background.
  - `paper.png`: a seamless 512px printed-paper tile (grain, specks, faint banding and scratches), used as the page background.
- `originals/`: full-size photos as supplied, and in `originals/posters/` the full-size hand-made collages. Ignored by git, so keep a backup.
- `references/`: design references (the printed-paper example, the launch party poster, the two mixed-media poster examples and the star-logo example). Ignored by git.

## The star show and the prints

The event photos are used twice, at the same time:

- **Star show** (first screen, under the crayon logo): the people from one photo, cut out in stars and laid on the paper. The stars are put down one by one, held for about three seconds, and lifted off as the next photo's go down. Each photo is given a printed look in the browser (lifted blacks, softer colour, grain, banding, slightly off-register red), and every star is the same size, with rough scissor-cut edges, a thin paper margin and a soft shadow.
- **Prints** (one screen down): the photo the stars came from, filling the screen with star-shaped holes where the people are, so the paper shows through. It changes with the star show. On upright screens (phones) each print is shown whole in the middle of the screen.

The stars land at random within each person's outline, more of them over the head (so faces show clearly) and fewer over the body (so it's patchier), and they may overlap. About one in five drifts well outside the outline so the shapes aren't neat. Stars that would cross the edge of the photo are left out.

Five photos are hand-made collages instead (`data-cutout` and `data-print` on the photo), split in two from the full-size posters in `originals/posters/`:

- **The cut-out pieces** (`img/posters/NAME-top.webp`): shown on the first screen in place of that photo's stars, put down and lifted off whole with a soft shadow.
- **The photo they were cut from** (`img/posters/NAME-bottom.webp`): shown as the print below, whole, as a sheet laid on the paper.

Each poster was cut where its bottom photo begins, so pen lines that cross from one half to the other are split there. Both halves are WebP with transparent backgrounds, so the paper shows around the pieces and through the holes.

The photos are listed in the `<template>` inside `.star-show` in `index.html`, with their size in `width` and `height`. Each one has a `data-people` attribute with an outline of every person in it: `x y x y …` in percent of the photo's width and height (`0 0` is the top-left corner), one outline per person, separated by `;`. The stars are scattered over these outlines.

To add a photo:

1. Put the original in `originals/` and make a web copy:
   ```sh
   sips -Z 1400 -s format jpeg -s formatOptions 70 originals/NAME.jpg --out img/name.jpg
   ```
2. Add an `<img alt="" data-src="/img/name.jpg" width="…" height="…" data-people="…">` line to the template, with an outline for each person. It joins the star show's rotation. For a hand-made collage, save its two halves as WebP in `img/posters/` and add `data-cutout="/img/posters/name-top.webp" data-print="/img/posters/name-bottom.webp"`.

## Preview locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
