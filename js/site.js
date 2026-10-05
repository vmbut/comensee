// Come n See: the star show, the prints below it, and the fade-ins.
//
// Both use the event photos listed in the .star-show template. Each photo is
// "printed" (grain, banding, ink-on-paper tones) and its people, outlined in
// data-people, are cut out of it in stars:
// - the star show on the first screen shows only the stars, as if the
//   people had been cut out of the print and laid on the page;
// - the prints below show the same photo at the same time, with the
//   star-shaped holes.
// Photos with data-cutout and data-print are hand-made collages split in
// two: the cut-out pieces (data-cutout) take the stars' place on the first
// screen, and the photo they were cut from (data-print) is the print below.

var photos = readPhotos(document.querySelector('.star-show template'));
var show = document.querySelector('.star-show');
var prints = document.querySelector('.prints');
var showPrint = prints && photos.length ? startPrints(prints, photos) : null;
if (show && photos.length) startStarShow(show, photos, showPrint);

function readPhotos(template) {
  if (!template) return [];
  return Array.prototype.map.call(template.content.querySelectorAll('img'), function (el) {
    return {
      src: el.dataset.src,
      w: Number(el.getAttribute('width')),
      h: Number(el.getAttribute('height')),
      // outlines as [[x, y], ...] in fractions of the photo
      people: el.dataset.people.split(';').map(function (p) {
        var v = p.trim().split(/\s+/).map(Number), pts = [];
        for (var i = 0; i + 1 < v.length; i += 2) pts.push([v[i] / 100, v[i + 1] / 100]);
        return pts;
      }),
      cutout: el.dataset.cutout || '',
      printSrc: el.dataset.print || '',
      img: null,
      ready: false,
      waiting: []
    };
  });
}

// Load a photo once and make its print (or, for a collage, load its cut-out
// pieces); call back when it's ready.
function loadPhoto(photo, done) {
  if (photo.ready) { if (done) done(photo); return; }
  if (done) photo.waiting.push(done);
  if (photo.img) return;
  photo.img = new Image();
  photo.img.onload = function () {
    photo.w = photo.img.naturalWidth;
    photo.h = photo.img.naturalHeight;
    if (!photo.cutout) photo.print = printed(photo.img);
    photo.ready = true;
    photo.waiting.splice(0).forEach(function (f) { f(photo); });
  };
  photo.img.src = photo.cutout || photo.src;
}

// Make the photo look printed: ink never gets fully black or paper fully
// white, colours soften, and there's grain, faint banding from the print
// head, and the red ink sits a pixel off.
function printed(img) {
  var k = Math.min(1, 1400 / Math.max(img.naturalWidth, img.naturalHeight));
  var w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
  var c = document.createElement('canvas');
  c.width = w; c.height = h;
  var g = c.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  var data;
  try { data = g.getImageData(0, 0, w, h); } catch (e) { return img; }
  var src = data.data, out = new Uint8ClampedArray(src);
  var band = [];
  for (var y = 0; y < h; y++) band.push(4 * Math.sin(y / 3.1) + (Math.random() - 0.5) * 6);
  for (y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4, j = (y * w + Math.max(0, x - 1)) * 4;
      var r = src[j], gr = src[i + 1], b = src[i + 2];
      var l = 0.3 * r + 0.59 * gr + 0.11 * b;
      var grain = (Math.random() + Math.random() + Math.random() - 1.5) * 14 + band[y];
      out[i] = 30 + (l + (r - l) * 0.82) * 0.8 + grain;
      out[i + 1] = 28 + (l + (gr - l) * 0.82) * 0.8 + grain;
      out[i + 2] = 32 + (l + (b - l) * 0.82) * 0.78 + grain;
    }
  }
  data.data.set(out);
  g.putImageData(data, 0, 0);
  return c;
}

// A star cut out by hand: same size as the others, but every point and
// edge a little off, with a thin, uneven margin of paper around it.
function cutStar(r) {
  var turn = Math.random() * Math.PI, star = [], margin = [];
  for (var i = 0; i < 10; i++) {
    var a = turn + i * Math.PI / 5 - Math.PI / 2 + (Math.random() - 0.5) * 0.16;
    var d = (i % 2 ? 0.45 : 1) * r * (1 + (Math.random() - 0.5) * 0.2);
    var m = d + r * (0.08 + Math.random() * 0.14);
    star.push([Math.cos(a) * d, Math.sin(a) * d]);
    margin.push([Math.cos(a) * m, Math.sin(a) * m]);
  }
  return { star: roughen(star, r), margin: roughen(margin, r) };
}

// Scissors don't cut perfectly straight: kink each edge a couple of times.
function roughen(points, r) {
  var out = [];
  points.forEach(function (p, i) {
    var q = points[(i + 1) % points.length];
    var dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1;
    out.push(p);
    [0.2 + Math.random() * 0.25, 0.55 + Math.random() * 0.25].forEach(function (t) {
      var k = (Math.random() - 0.5) * r * 0.14;
      out.push([p[0] + dx * t - dy / len * k, p[1] + dy * t + dx / len * k]);
    });
  });
  return out;
}

function inside(poly, x, y) {
  var hit = false;
  for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    var a = poly[i], b = poly[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) hit = !hit;
  }
  return hit;
}

// Scatter stars of radius r over the outlines (in pixels). How many each
// outline gets is set by `gap`, the typical spacing: the top of the outline
// (the head, for a person) gets them about 0.8 gaps apart, so faces show
// clearly, and the whole body about 1.3 gaps apart, so it's patchier. They
// land at random and may overlap, which keeps it loose. Each may drift up to
// `spill` past the outline (one in five three and a half times as far), so
// the shapes aren't neat, but stars that would cross `bounds` (the photo's
// edges) are left out.
function packStars(outlines, r, gap, spill, bounds) {
  var stars = [];
  outlines.forEach(function (poly) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, area = 0;
    poly.forEach(function (p, i) {
      var q = poly[(i + 1) % poly.length];
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      area += p[0] * q[1] - q[0] * p[1];
    });
    var head = y0 + Math.min(0.28 * (y1 - y0), 0.8 * (x1 - x0));
    // the head, then the whole body
    [[y0, head, gap * 0.81, 1], [y0, y1, gap * 1.3, 0.6]].forEach(function (pass) {
      var top = pass[0], bottom = pass[1], g = pass[2];
      var want = Math.max(1, Math.round(pass[3] * Math.abs(area) / 2 * (bottom - top) / (y1 - y0) / (g * g)));
      for (var tries = want * 40; tries > 0 && want > 0; tries--) {
        var x = x0 + Math.random() * (x1 - x0), y = top + Math.random() * (bottom - top);
        if (!inside(poly, x, y)) continue;
        var t = Math.random() * 2 * Math.PI, d = Math.random() * spill * (Math.random() < 0.2 ? 3.5 : 1);
        x += Math.cos(t) * d; y += Math.sin(t) * d;
        if (x < bounds.left + r || x > bounds.right - r || y < bounds.top + r || y > bounds.bottom - r) continue;
        var s = cutStar(r);
        s.x = x; s.y = y;
        stars.push(s);
        want--;
      }
    });
  });
  return stars;
}

function addShape(path, x, y, points) {
  points.forEach(function (p, i) {
    if (i) path.lineTo(x + p[0], y + p[1]);
    else path.moveTo(x + p[0], y + p[1]);
  });
  path.closePath();
}

// Star show: the people cut out in stars are put down one by one, held,
// and lifted off as the next photo's go down; a collage's cut-out pieces are
// put down and lifted off whole. onSlide(i) is told each time photo i
// starts, so the prints below can change with it.
function startStarShow(show, slides, onSlide) {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SLIDE_MS = reduced ? 6000 : 3200; // from one photo appearing to the next
  var SPREAD_MS = reduced ? 0 : 900;    // stars appear (and go) at random times within this

  var canvas = show.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;

  var active = [];  // slides on screen: the current one, plus the one being lifted off
  var index = 0;
  var dirty = true;

  // Where the stars go: the middle of the screen, between the logo above
  // and the text below.
  var logo = document.querySelector('.logo img');
  var text = document.querySelector('.hero-text');
  function pageOffset(el, prop) {
    for (var t = 0; el && el !== show.offsetParent; el = el.offsetParent) t += el[prop];
    return t;
  }
  function room() {
    if (!logo || !text) return { left: 0, right: W, top: 0, bottom: H };
    var band = { left: 0, right: W, top: pageOffset(logo, 'offsetTop') + logo.offsetHeight, bottom: pageOffset(text, 'offsetTop') };
    return band.bottom - band.top > H * 0.3 ? band : { left: 0, right: W, top: 0, bottom: H };
  }

  // Scale the photo so its people fit that space, centred, but never larger
  // than it takes to cover the screen; then cut the people out in stars.
  // A collage's pieces just fit the space, centred.
  function layout(slide) {
    var r0 = room(), bw = r0.right - r0.left, bh = r0.bottom - r0.top;
    var pad = Math.min(bw, bh) * 0.03;
    if (slide.cutout) {
      var k = Math.min(bw * 0.8 / slide.w, (bh - 2 * pad) / slide.h, 1);
      slide.scale = k;
      slide.x = (r0.left + r0.right - slide.w * k) / 2;
      slide.y = (r0.top + r0.bottom - slide.h * k) / 2;
      slide.stars = [];
      return;
    }
    var b = bbox(slide.people);
    var scale = Math.min((bw - 2 * pad) / ((b.x1 - b.x0) * slide.w), (bh - 2 * pad) / ((b.y1 - b.y0) * slide.h), Math.max(W / slide.w, H / slide.h));
    var iw = slide.w * scale, ih = slide.h * scale;
    slide.scale = scale;
    slide.x = (r0.left + r0.right) / 2 - (b.x0 + b.x1) / 2 * iw;
    slide.y = (r0.top + r0.bottom) / 2 - (b.y0 + b.y1) / 2 * ih;
    var r = Math.max(5, Math.min(12, Math.min(W, H) * 0.011));
    slide.stars = starsFor(slide, slide.x, slide.y, iw, ih, r);
    slide.stars.forEach(function (s) {
      s.inAt = Math.random() * SPREAD_MS;
      s.outAt = Math.random() * SPREAD_MS;
    });
  }

  // Stars don't grow or shrink: each one is either down on the page or not.
  function shown(slide, star, now) {
    if (now < slide.start + star.inAt) return false;
    return slide.end == null || now < slide.end + star.outAt;
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    active.forEach(function (slide) {
      if (slide.cutout) {
        // the pieces go down halfway through the stars' spread, and lift off the same
        var half = SPREAD_MS / 2;
        if (now < slide.start + half || (slide.end != null && now >= slide.end + half)) return;
        ctx.save();
        ctx.shadowColor = 'rgba(40, 30, 20, .3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0.8;
        ctx.shadowOffsetY = 2;
        ctx.drawImage(slide.img, slide.x, slide.y, slide.w * slide.scale, slide.h * slide.scale);
        ctx.restore();
        return;
      }
      var stars = slide.stars.filter(function (s) { return shown(slide, s, now); });
      if (stars.length) layStars(ctx, stars, slide.print, slide.x, slide.y, slide.w * slide.scale, slide.h * slide.scale, grain);
    });
  }

  function begin(slide, now) {
    slide.start = now;
    slide.end = null;
    layout(slide);
    active.push(slide);
    if (onSlide) onSlide(slides.indexOf(slide));
    loadPhoto(slides[(slides.indexOf(slide) + 1) % slides.length]);
  }

  function frame(now) {
    var current = active[active.length - 1];
    if (!current) {
      if (slides[index].ready) begin(slides[index], now);
    } else if (slides.length > 1 && now - current.start >= SLIDE_MS) {
      // Move on once the next photo has loaded; until then the current one stays.
      var next = slides[(index + 1) % slides.length];
      if (next.ready) {
        current.end = now;
        index = (index + 1) % slides.length;
        begin(next, now);
      }
    }
    // Drop a slide once all its stars have been lifted off.
    active = active.filter(function (s) { return s.end == null || now < s.end + SPREAD_MS; });

    var last = active[active.length - 1];
    var moving = active.length > 1 || (last && now - last.start < SPREAD_MS + 50);
    if (moving || dirty) { draw(now); dirty = false; }
    requestAnimationFrame(frame);
  }

  // Toner grain and fine print lines, at the screen's own pixel size so they
  // stay crisp however much the photo is scaled.
  var grain;
  function makeGrain(dpr) {
    var n = 128, c = document.createElement('canvas');
    c.width = c.height = n;
    var g = c.getContext('2d'), img = g.createImageData(n, n), d = img.data;
    for (var i = 0; i < n * n; i++) {
      var v = Math.random() - 0.5, line = Math.floor(i / n) % 3 === 0 ? 0.07 : 0;
      d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v < 0 ? 0 : 255;
      d[i * 4 + 3] = Math.round((Math.abs(v) * 0.5 + line) * 255);
    }
    g.putImageData(img, 0, 0);
    grain = ctx.createPattern(c, 'repeat');
    if (grain.setTransform) grain.setTransform(new DOMMatrix().scale(1 / dpr));
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = show.clientWidth; H = show.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    makeGrain(dpr);
    active.forEach(layout);
    dirty = true;
  }

  resize();
  new ResizeObserver(resize).observe(show);
  loadPhoto(slides[0]);
  requestAnimationFrame(frame);
}

// The bounding box of all the outlines, in fractions of the photo.
function bbox(outlines) {
  var b = { x0: 1, y0: 1, x1: 0, y1: 0 };
  outlines.forEach(function (poly) {
    poly.forEach(function (p) {
      b.x0 = Math.min(b.x0, p[0]); b.x1 = Math.max(b.x1, p[0]);
      b.y0 = Math.min(b.y0, p[1]); b.y1 = Math.max(b.y1, p[1]);
    });
  });
  return b;
}

// Cut the photo's people out in stars of radius r, with the photo drawn at
// (x, y) and iw by ih in pixels. Stars stay whole inside the photo.
function starsFor(photo, x, y, iw, ih, r) {
  return packStars(photo.people.map(function (poly) {
    return poly.map(function (p) { return [x + p[0] * iw, y + p[1] * ih]; });
  }), r, r * 1.2, r * 1.1, { left: x, top: y, right: x + iw, bottom: y + ih });
}

// Lay cut-out stars on the page: a paper margin with a soft shadow, and the
// print (drawn at x, y, iw by ih) seen through each star, with grain on top.
function layStars(g, stars, print, x, y, iw, ih, grain) {
  var shapes = new Path2D(), margins = new Path2D();
  stars.forEach(function (s) {
    addShape(shapes, s.x, s.y, s.star);
    addShape(margins, s.x, s.y, s.margin);
  });
  g.save();
  g.shadowColor = 'rgba(40, 30, 20, .3)';
  g.shadowBlur = 3;
  g.shadowOffsetX = 0.6;
  g.shadowOffsetY = 1.4;
  g.fillStyle = '#f8f7f2';
  g.fill(margins);
  g.restore();
  g.save();
  g.clip(shapes);
  g.drawImage(print, x, y, iw, ih);
  if (grain) { g.fillStyle = grain; g.fillRect(x, y, iw, ih); }
  g.restore();
}

// Prints: one full screen below the star show, always showing the photo the
// stars above come from and changing with it. Most photos are a print with
// the people cut out in stars; a collage shows the hand-made print its
// pieces were cut from. Returns show(i), which the star show calls.
function startPrints(section, list) {
  var figs = list.map(function (photo) {
    var fig = document.createElement('figure');
    fig.className = 'print' + (photo.printSrc ? ' collage' : '');
    var el = document.createElement(photo.printSrc ? 'img' : 'canvas');
    if (photo.printSrc) el.alt = 'Photo from a Come n See event, with pieces cut out and drawn over in red';
    else {
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'Photo from a Come n See event, with the people cut out in stars');
    }
    fig.appendChild(el);
    fig.photo = photo;
    section.appendChild(fig);
    return fig;
  });

  function make(fig) {
    var photo = fig.photo;
    if (fig.made) return;
    if (photo.printSrc) { fig.made = true; fig.querySelector('img').src = photo.printSrc; return; }
    if (!photo.ready) return;
    fig.made = true;
    makeCutPrint(fig.querySelector('canvas'), photo);
  }

  return function show(i) {
    make(figs[i]);
    figs.forEach(function (f, j) { f.classList.toggle('is-shown', j === i); });
    // get the next one ready while this one is up
    var next = figs[(i + 1) % figs.length];
    loadPhoto(next.photo, function () { setTimeout(function () { make(next); }, 300); });
  };
}

// The print with star-shaped holes where the people are.
function makeCutPrint(canvas, photo) {
  var w = photo.print.width, h = photo.print.height;
  canvas.width = w; canvas.height = h;
  var g = canvas.getContext('2d');
  g.drawImage(photo.print, 0, 0);
  var holes = new Path2D();
  starsFor(photo, 0, 0, w, h, Math.max(w, h) * 0.01).forEach(function (s) { addShape(holes, s.x, s.y, s.star); });
  g.globalCompositeOperation = 'destination-out';
  g.fill(holes);
}

// The logo and text fade and slide in, one after the other.
document.querySelectorAll('.hero-content > *').forEach(function (el, i) {
  setTimeout(function () { el.classList.add('in'); }, 150 + i * 250);
});
