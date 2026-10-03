# comensee

Website for Come n See, an East London art collective and film club run by Veronika Butkevich (@vmbut). Instagram: [@_come_n_see_](https://www.instagram.com/_come_n_see_/). Contact: comensee.info@gmail.com.

A static site in the same style as `../vmbutkevich`: plain HTML, one stylesheet, one script, no build step and no dependencies.

## Layout

- `index.html`: home page. The red wordmark, a short line on the events' concept, and links, over the star show.
- `css/site.css`: colours, type scale and theme, carried over from vmbutkevich.
- `js/site.js`: the star show and the fade-in of the home page text.
- `img/`: web-sized images (2000px on the long side, JPEG quality 72).
- `originals/`: full-size photos as supplied. Ignored by git, so keep a backup.

## The star show

The home page background shows the event photos one at a time, each seen only through a cluster of small stars laid over the people in it. The stars pop in, hold for about three seconds, and pop out as the next photo's stars appear. Visitors who ask for reduced motion get a plain swap every six seconds.

The photos are listed in the `<template>` inside `.star-show` in `index.html`. Each one has a `data-stars` attribute listing the areas to fill with stars, usually a head and a body per person. Each area is `centre-x centre-y radius-x radius-y`, as fractions of the photo's width and height (`0 0` is the top-left corner).

To add a photo:

1. Put the original in `originals/` and make a web copy:
   ```sh
   sips -Z 2000 -s format jpeg -s formatOptions 72 originals/NAME.jpg --out img/name.jpg
   ```
2. Add an `<img alt="" data-src="/img/name.jpg" data-stars="…">` line to the template, with an area for each person.

## Preview locally

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.
