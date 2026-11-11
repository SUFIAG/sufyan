(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  /* ---------- theme ---------- */
  var themeMeta = $$('meta[name="theme-color"]');
  function currentTheme() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  function applyTheme(next) {
    root.dataset.theme = next;
    themeMeta.forEach(function (m) { m.setAttribute('content', next === 'dark' ? '#0A0E19' : '#F7F7F4'); });
    try { localStorage.setItem('theme', next); } catch (e) {}
  }
  $('.theme-toggle').addEventListener('click', function (e) {
    var next = currentTheme() === 'dark' ? 'light' : 'dark';
    if (reduce || typeof document.startViewTransition !== 'function') { applyTheme(next); return; }
    // Circular reveal from the toggle button.
    var r = e.currentTarget.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2;
    var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theming');
    var vt = document.startViewTransition(function () { applyTheme(next); });
    vt.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 600, easing: 'cubic-bezier(.22,.8,.3,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
    vt.finished.finally(function () { root.classList.remove('theming'); });
  });

  /* ---------- mobile menu ---------- */
  var nav = $('#nav');
  var menuBtn = $('.menu-btn');
  function closeMenu() { nav.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------- header state + progress bar ---------- */
  var bar = $('.bar');
  var progress = $('.progress');
  var toTop = $('.to-top');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.classList.toggle('scrolled', y > 8);
    toTop.classList.toggle('show', y > window.innerHeight * 1.2);
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- scroll spy ---------- */
  var navLinks = $$('a[href^="#"]', nav);
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal on scroll ---------- */
  var items = $$('.rv');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
    $$('.product').forEach(function (el) { el.classList.add('in-view'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = $$(':scope > .rv', el.parentNode);
        el.style.transitionDelay = Math.min(Math.max(sibs.indexOf(el), 0), 5) * 70 + 'ms';
        el.classList.add('in');
        if (el.classList.contains('product')) {
          setTimeout(function () { el.classList.add('in-view'); }, 250);
          // Drop the stagger delay once revealed so hover feels immediate.
          setTimeout(function () { el.style.transitionDelay = ''; }, 1200);
        }
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- counters ---------- */
  if (!reduce && 'IntersectionObserver' in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, target = +el.dataset.count, suffix = el.dataset.suffix || '';
        var start = null, dur = 1300;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(eased * target) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        el.textContent = '0' + suffix;
        requestAnimationFrame(step);
        co.unobserve(el);
      });
    }, { threshold: 0.6 });
    $$('[data-count]').forEach(function (el) { co.observe(el); });
  }

  /* ---------- hero event stream (simulated) ---------- */
  var feed = $('#feed');
  var icons = {
    settle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    match: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/></svg>',
    screen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>',
    lc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'
  };
  var events = [
    { i: 'settle', c: 'c-teal', t: 'Payout settled · GBP → PKR', s: 'idempotency key reused, no duplicate', tag: 'SETTLED' },
    { i: 'screen', c: 'c-brand', t: 'Sanctions screening cleared', s: 'PEP + OFAC · 41 ms', tag: 'CLEAR' },
    { i: 'match', c: 'c-teal', t: 'Bank line matched to ledger', s: '1:N · 3 invoices', tag: 'MATCHED' },
    { i: 'alert', c: 'c-rose', t: 'Provider timeout, reconciling', s: 'state: PENDING_CONFIRM', tag: 'HELD' },
    { i: 'lc', c: 'c-amber', t: 'LC presentation examined', s: 'UCP 600 · 1 discrepancy cited', tag: 'REVIEW' },
    { i: 'settle', c: 'c-teal', t: 'Payroll batch released · AED', s: '214 contractors · 3 countries', tag: 'SETTLED' },
    { i: 'alert', c: 'c-violet', t: 'Mule pattern detected', s: 'case drafted for analyst', tag: 'CASE' },
    { i: 'match', c: 'c-teal', t: 'Gateway payout reconciled', s: 'fee break auto-classified', tag: 'MATCHED' },
    { i: 'screen', c: 'c-brand', t: 'Name match below threshold', s: 'precision ↑, recall unchanged', tag: 'CLEAR' }
  ];
  var idx = 0, settled = 12480, alerts = 7;
  var kSettled = $('#k-settled'), kAlerts = $('#k-alerts');
  function pushEvent(animate) {
    var ev = events[idx++ % events.length];
    var li = document.createElement('li');
    if (!animate) li.style.animation = 'none';
    li.innerHTML = '<span class="ico ' + ev.c + '">' + icons[ev.i] + '</span>' +
      '<span class="t"><b>' + ev.t + '</b><span>' + ev.s + '</span></span>' +
      '<span class="tag ' + ev.c + '">' + ev.tag + '</span>';
    feed.insertBefore(li, feed.firstChild);
    while (feed.children.length > 7) feed.removeChild(feed.lastChild);
    if (animate) {
      if (ev.tag === 'SETTLED') settled += 1 + Math.floor(Math.random() * 40);
      if (ev.tag === 'CASE' || ev.tag === 'HELD') alerts += 1;
      if (ev.tag === 'MATCHED' && alerts > 3) alerts -= 1;
      kSettled.textContent = settled.toLocaleString('en-US');
      kAlerts.textContent = alerts;
    }
  }
  for (var n = 0; n < 5; n++) pushEvent(false);
  if (!reduce) {
    var timer = null;
    var start = function () { if (!timer) timer = setInterval(function () { pushEvent(true); }, 2400); };
    var stop = function () { clearInterval(timer); timer = null; };
    // Only animate while the console is on screen and the tab is visible.
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(feed);
    } else { start(); }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
  }

  /* ---------- product filters ---------- */
  var chips = $$('.chip');
  var products = $$('.product');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
      products.forEach(function (p) {
        var show = f === 'all' || p.dataset.cat === f;
        if (show) {
          p.classList.remove('hide');
          requestAnimationFrame(function () { p.classList.remove('fade'); });
        } else {
          p.classList.add('fade');
          setTimeout(function () { if (p.classList.contains('fade')) p.classList.add('hide'); }, reduce ? 0 : 300);
        }
      });
    });
  });

  /* ---------- product card spotlight ---------- */
  if (!reduce && window.matchMedia('(hover: hover)').matches) {
    products.forEach(function (p) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect();
        p.style.setProperty('--spot-x', (e.clientX - r.left) + 'px');
        p.style.setProperty('--spot-y', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- product detail dialog ---------- */
  var sheet = $('#sheet');
  var lastFocus = null;
  function field(card, k) { var el = $('[data-k="' + k + '"]', card); return el ? el : null; }
  function openProduct(card) {
    var name = $('h3', card).textContent;
    $('#sheet-kicker').textContent = field(card, 'kicker').textContent;
    $('#sheet-kicker').style.color = getComputedStyle(card).getPropertyValue('--accent') || '';
    $('#sheet-title').textContent = name;
    $('#sheet-lead').textContent = field(card, 'lead').textContent;
    $('#sheet-problem').textContent = field(card, 'problem').textContent;
    $('#sheet-who').textContent = field(card, 'who').textContent;
    $('#sheet-features').innerHTML = field(card, 'features').innerHTML;
    $('#sheet-ai').innerHTML = '<b>How AI is used: </b>' + field(card, 'ai').innerHTML;
    $('#sheet-stack').innerHTML = field(card, 'stack').textContent.split('|').map(function (s) { return '<span>' + s + '</span>'; }).join('');
    var repo = field(card, 'repo').textContent.trim();
    var repoBtn = $('#sheet-repo');
    if (repo) { repoBtn.href = repo; repoBtn.hidden = false; } else { repoBtn.hidden = true; }
    $('#sheet-demo').dataset.product = name;
    lastFocus = card;
    if (typeof sheet.showModal === 'function') sheet.showModal(); else sheet.setAttribute('open', '');
    document.body.style.overflow = 'hidden';
    $('.sheet-inner', sheet).scrollTop = 0;
  }
  function closeSheet() {
    if (sheet.open && typeof sheet.close === 'function') sheet.close(); else sheet.removeAttribute('open');
  }
  sheet.addEventListener('close', function () {
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
  $$('[data-close]', sheet).forEach(function (b) {
    b.addEventListener('click', function () {
      // Links that leave the dialog should not pull focus back to the card.
      if (b.tagName === 'A') lastFocus = null;
      closeSheet();
    });
  });
  products.forEach(function (card) {
    card.addEventListener('click', function () { openProduct(card); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct(card); }
    });
  });

  /* ---------- case study tabs ---------- */
  var tabs = $$('.case-tab');
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) { panel.classList.remove('enter'); void panel.offsetWidth; panel.classList.add('enter'); }
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      selectTab(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });

  /* ---------- contact form -> mailto ---------- */
  var form = $('#contact-form');
  var topic = $('#f-topic');
  $$('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () {
      topic.value = a.dataset.topic;
      var msg = $('#f-msg');
      if (a.dataset.product && !msg.value) msg.value = 'I would like a demo of ' + a.dataset.product + '.\n\n';
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var note = $('#form-note');
    var bad = $$('[required]', form).filter(function (el) { return !el.checkValidity(); });
    if (bad.length) {
      note.style.color = 'var(--rose)';
      note.textContent = 'Please add your name, a valid email and a short message.';
      bad[0].focus();
      return;
    }
    var d = new FormData(form);
    var subject = (d.get('topic') || 'Enquiry') + ' — ' + d.get('name') + (d.get('company') ? ' (' + d.get('company') + ')' : '');
    var body = d.get('message') + '\n\n—\n' + d.get('name') + '\n' + d.get('email') + (d.get('company') ? '\n' + d.get('company') : '');
    window.location.href = 'mailto:sufyan.abdulghani@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    note.style.color = '';
    note.textContent = 'Your email app should open with the message ready. If it doesn’t, write to sufyan.abdulghani@gmail.com.';
  });

  /* ---------- toast feedback for the résumé download ---------- */
  var toast = $('#toast');
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2600);
  }
  var resume = $('a[href$="Resume.pdf"]');
  if (resume) resume.addEventListener('click', function () { showToast('Downloading résumé…'); });

  $('#year').textContent = new Date().getFullYear();
})();
