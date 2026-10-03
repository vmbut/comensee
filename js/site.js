// Come n See: the star show on the home page and the fade-in of its text.

// Star show: each event photo is seen only through a cluster of stars laid
// over the people in it (the areas come from each photo's data-stars). The
// stars pop in, hold, and pop out as the next photo's stars pop in.
var show = document.querySelector('.star-show');
if (show) startStarShow(show);

function startStarShow(show) {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SLIDE_MS = reduced ? 6000 : 3200; // from one photo appearing to the next
  var SPREAD_MS = reduced ? 0 : 700;    // stars start at random times within this
  var POP_MS = reduced ? 0 : 450;       // how long one star takes to grow or shrink

  var canvas = show.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var W = 0, H = 0;

  var slides = Array.prototype.map.call(show.querySelector('template').content.querySelectorAll('img'), function (el) {
    return {
      src: el.dataset.src,
      areas: el.dataset.stars.split(',').map(function (a) { return a.trim().split(/\s+/).map(Number); }),
      img: null,
      ready: false
    };
  });
  if (!slides.length) return;

  var active = [];  // slides on screen: the current one, plus the one popping out
  var index = 0;
  var dirty = true;

  function load(slide) {
    if (slide.img) return;
    slide.img = new Image();
    slide.img.onload = function () { slide.ready = true; };
    slide.img.src = slide.src;
  }

  // Where the stars go: the band between the wordmark and the text, or the
  // whole screen when that band is too thin (phones).
  var logo = document.querySelector('.logo');
  var text = document.querySelector('.hero-text');
  function pageTop(el) {
    for (var t = 0; el; el = el.offsetParent) t += el.offsetTop;
    return t;
  }
  function band() {
    var top = logo ? pageTop(logo) + logo.offsetHeight : 0;
    var bottom = text ? pageTop(text) : H;
    return bottom - top < H * 0.4 ? { top: 0, bottom: H } : { top: top, bottom: bottom };
  }

  // Scale the photo so its starred areas fit the band, centred, but never
  // larger than it takes to cover the screen.
  function layout(slide) {
    var iw = slide.img.naturalWidth, ih = slide.img.naturalHeight;
    var x0 = 1, y0 = 1, x1 = 0, y1 = 0;
    slide.areas.forEach(function (a) {
      x0 = Math.min(x0, a[0] - a[2]); x1 = Math.max(x1, a[0] + a[2]);
      y0 = Math.min(y0, a[1] - a[3]); y1 = Math.max(y1, a[1] + a[3]);
    });
    x0 = Math.max(x0, 0); y0 = Math.max(y0, 0); x1 = Math.min(x1, 1); y1 = Math.min(y1, 1);
    var b = band(), bh = b.bottom - b.top;
    var pad = Math.min(W, bh) * 0.05;
    var scale = Math.min((W - 2 * pad) / ((x1 - x0) * iw), (bh - 2 * pad) / ((y1 - y0) * ih), Math.max(W / iw, H / ih));
    slide.scale = scale;
    slide.x = W / 2 - (x0 + x1) / 2 * iw * scale;
    slide.y = (b.top + b.bottom) / 2 - (y0 + y1) / 2 * ih * scale;
    scatter(slide);
  }

  // Fill each area with stars, kept a little apart so the gaps show.
  function scatter(slide) {
    var iw = slide.img.naturalWidth * slide.scale, ih = slide.img.naturalHeight * slide.scale;
    var r = Math.max(5, Math.min(14, Math.min(W, H) * 0.0125));
    var gap = r * 1.7;
    var stars = [];
    slide.areas.forEach(function (a) {
      var cx = slide.x + a[0] * iw, cy = slide.y + a[1] * ih, rx = a[2] * iw, ry = a[3] * ih;
      var want = Math.max(1, Math.round(Math.PI * rx * ry / (gap * gap)));
      for (var tries = want * 30; tries > 0 && want > 0; tries--) {
        var t = Math.random() * 2 * Math.PI, d = Math.sqrt(Math.random());
        var x = cx + Math.cos(t) * d * rx, y = cy + Math.sin(t) * d * ry;
        if (stars.some(function (s) { return (s.x - x) * (s.x - x) + (s.y - y) * (s.y - y) < gap * gap; })) continue;
        stars.push({
          x: x, y: y,
          r: r * (0.7 + Math.random() * 0.45),
          turn: Math.random() * Math.PI,
          inAt: Math.random() * SPREAD_MS,
          outAt: Math.random() * SPREAD_MS
        });
        want--;
      }
    });
    slide.stars = stars;
  }

  function ease(t) { return t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3); }

  // How big a star is right now, from 0 (gone) to 1.
  function size(slide, star, now) {
    if (!POP_MS) return slide.end != null && now >= slide.end ? 0 : 1;
    var grow = ease((now - slide.start - star.inAt) / POP_MS);
    if (slide.end == null) return grow;
    return Math.min(grow, 1 - ease((now - slide.end - star.outAt) / POP_MS));
  }

  function addStar(path, x, y, r, turn) {
    for (var i = 0; i < 10; i++) {
      var a = turn + i * Math.PI / 5 - Math.PI / 2, d = i % 2 ? r * 0.45 : r;
      if (i) path.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
      else path.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    path.closePath();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    active.forEach(function (slide) {
      var path = new Path2D(), any = false;
      slide.stars.forEach(function (s) {
        var k = size(slide, s, now);
        if (k > 0) { addStar(path, s.x, s.y, s.r * k, s.turn); any = true; }
      });
      if (!any) return;
      ctx.save();
      ctx.clip(path);
      ctx.drawImage(slide.img, slide.x, slide.y, slide.img.naturalWidth * slide.scale, slide.img.naturalHeight * slide.scale);
      ctx.restore();
    });
  }

  function begin(slide, now) {
    slide.start = now;
    slide.end = null;
    layout(slide);
    active.push(slide);
    load(slides[(slides.indexOf(slide) + 1) % slides.length]);
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
    // Drop a slide once all its stars have shrunk away.
    active = active.filter(function (s) { return s.end == null || now < s.end + SPREAD_MS + POP_MS; });

    var last = active[active.length - 1];
    var moving = active.length > 1 || (last && now - last.start < SPREAD_MS + POP_MS + 50);
    if (moving || dirty) { draw(now); dirty = false; }
    requestAnimationFrame(frame);
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = show.clientWidth; H = show.clientHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    active.forEach(layout);
    dirty = true;
  }

  resize();
  new ResizeObserver(resize).observe(show);
  load(slides[0]);
  requestAnimationFrame(frame);
}

// The wordmark and text fade and slide in, one after the other.
document.querySelectorAll('.hero-content > *').forEach(function (el, i) {
  setTimeout(function () { el.classList.add('in'); }, 150 + i * 250);
});
