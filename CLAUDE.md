# comensee

Static website for Come n See (art collective / film club). See README.

- Same approach as `../vmbutkevich`: plain HTML, `css/site.css`, `js/site.js`, root-relative URLs, no build step, no dependencies. Reuse its patterns (themes, type scale, scroll-in animation) rather than inventing new ones.
- Preview with `python3 -m http.server 8000` from this folder, or `/preview-site comensee`.
- Images go in `img/`. Instagram can't be scraped (it requires login), so photos come from the user.
- Content wording (about text, event descriptions) is the user's call. Reuse the text from `../vmbutkevich/what-are-we_gtv/index.html` and don't write new copy without asking.
