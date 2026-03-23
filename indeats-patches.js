/**
 * indeats-patches.js — PRECISION BUILD
 * Selectors verified against the actual HTML source.
 *
 * Issues fixed:
 *  #1  Get Started / Heart / Menu / Reserve Seat / See Details → My Bookings
 *  #2  No confirmation after Confirm Reservation
 *  #5  Search bars non-functional (Home + Deals)
 *  #6  Sign In does nothing
 *  #7  Cancel / Edit Booking do nothing
 *  #8  Footer links dead
 *  #9  Holi countdown shows 00:00:00
 *  #12 City switcher (.nav-city) has no dropdown
 *  #13 Nav wraps on detail pages
 *  #14 Featured carousel ignores filter (btn-reserve / btn-event-details)
 *  #15 Location pin inconsistent (CSS normalise)
 *  #16 Back to Discover points to index.html not /
 */
(function () {
  'use strict';

  const PATH = window.location.pathname;
  const PAGE = PATH.includes('deals')     ? 'deals'
             : PATH.includes('events')    ? 'events'
             : PATH.includes('bookings')  ? 'bookings'
             : (PATH.includes('charminar') || PATH.includes('nagas') ||
                PATH.includes('mylapore') || PATH.includes('kongunadu') ||
                PATH.includes('paradise') || PATH.includes('a2b')  ||
                PATH.includes('meenakshi')|| PATH.includes('saravana')) ? 'detail'
             : 'home';

  /* ─────────────────────────────────────────────
     SHARED HELPERS
  ───────────────────────────────────────────── */
  function injectCSS(id, css) {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = css;
    document.head.appendChild(s);
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#171717;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-family:Inter,sans-serif;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.3);white-space:nowrap;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2500);
    setTimeout(() => t.remove(), 2800);
  }

  /* ─────────────────────────────────────────────
     1 + 6. NAV — Sign In / Get Started
     Actual selectors: a.nav-btn.ghost  a.nav-btn.primary
     All pages route these to bookings.html — intercept them.
  ───────────────────────────────────────────── */
  function fixNav() {
    document.querySelectorAll('a.nav-btn').forEach(el => {
      const txt = el.innerText.trim();
      if (txt === 'Sign In' || txt === 'Get Started') {
        el.removeAttribute('href');
        el.style.cursor = 'pointer';
        el.addEventListener('click', e => {
          e.preventDefault();
          openAuthModal(txt === 'Sign In' ? 'signin' : 'signup');
        });
      }
    });
  }

  /* ─────────────────────────────────────────────
     1. RESTAURANT CARDS — home page
     Cards: a.rest-card.restaurant-card  href="bookings.html"
     Name:  div.rest-name
     Menu btn: button.btn-menu
     No heart button exists in the current HTML — skip.
  ───────────────────────────────────────────── */
  const CARD_ROUTES = {
    'charminar':        'charminar.html',
    "naga's kitchen":   'nagas-kitchen.html',
    'mylapore':         'mylapore.html',
    'kongunadu':        'kongunadu.html',
    'paradise':         'paradise.html',
    'a2b':              'a2b.html',
    'meenakshi bhavan': 'meenakshi-bhavan.html',
    'saravana bhavan':  'saravana-bhavan.html',
  };

  function fixRestaurantCards() {
    document.querySelectorAll('a.rest-card').forEach(card => {
      const nameEl = card.querySelector('.rest-name');
      if (!nameEl) return;
      const route = CARD_ROUTES[nameEl.innerText.trim().toLowerCase()];
      if (route) card.setAttribute('href', route);
    });

    document.querySelectorAll('button.btn-menu').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        const card    = btn.closest('a.rest-card');
        const nameEl  = card?.querySelector('.rest-name');
        const route   = nameEl ? (CARD_ROUTES[nameEl.innerText.trim().toLowerCase()] || '/') : '/';
        window.location.href = route;
      });
    });
  }

  /* ─────────────────────────────────────────────
     1 + 14. EVENTS PAGE — featured carousel + event-card buttons
     Featured: button.btn-reserve  onclick="location.href='bookings.html'"
               button.btn-event-details  onclick="location.href='bookings.html'"
     Event cards: button.btn-event-reserve  onclick="location.href='bookings.html'"
  ───────────────────────────────────────────── */
  function fixEventButtons() {
    // Override onclick by replacing the attribute and adding a proper listener
    document.querySelectorAll(
      'button.btn-reserve, button.btn-event-details, button.btn-event-reserve'
    ).forEach(btn => {
      // Remove inline onclick
      btn.removeAttribute('onclick');
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        if (btn.classList.contains('btn-event-details')) {
          // Scroll to the card, don't navigate
          btn.closest('.featured-event')?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        openEventBookingModal(btn);
      });
    });
  }

  /* ─────────────────────────────────────────────
     2. RESERVATION CONFIRMATION — detail pages
     Confirm button: #booking-confirm
  ───────────────────────────────────────────── */
  function fixReservationConfirm() {
    const confirmBtn = document.getElementById('booking-confirm');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', e => {
      e.preventDefault();
      const dateEl   = document.getElementById('booking-date');
      const guestsEl = document.getElementById('booking-guests');
      const timeEl   = document.querySelector('.time-slot.selected, .time-slot.active');
      const date     = dateEl?.value   || 'your selected date';
      const guests   = guestsEl?.value || '2 guests';
      const time     = timeEl?.innerText?.trim() || '7:00 PM';
      const modal    = document.getElementById('booking-modal');
      if (modal) { modal.setAttribute('aria-hidden', 'true'); modal.style.display = 'none'; }
      showConfirmationModal({ date, guests, time });
    });
  }

  function showConfirmationModal({ date, guests, time }) {
    let displayDate = date;
    try { displayDate = new Date(date + 'T00:00').toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' }); } catch(e) {}
    const ref = 'IND-' + Math.floor(Math.random() * 90000 + 10000);
    const overlay = document.createElement('div');
    overlay.id = 'confirm-overlay';
    overlay.innerHTML = `
      <div id="confirm-dialog">
        <div class="confirm-icon">&#10003;</div>
        <h2 class="confirm-title">Booking Confirmed</h2>
        <p class="confirm-sub">Your table is reserved. Deal auto-applied — no code needed.</p>
        <div class="confirm-details">
          <div class="confirm-row"><span class="confirm-label">Restaurant</span><span class="confirm-val">Charminar, Fremont</span></div>
          <div class="confirm-row"><span class="confirm-label">Date</span><span class="confirm-val">${displayDate}</span></div>
          <div class="confirm-row"><span class="confirm-label">Time</span><span class="confirm-val">${time}</span></div>
          <div class="confirm-row"><span class="confirm-label">Guests</span><span class="confirm-val">${guests}</span></div>
          <div class="confirm-row"><span class="confirm-label">Deal</span><span class="confirm-val confirm-deal">20% off on all Biryani</span></div>
          <div class="confirm-row"><span class="confirm-label">Ref</span><span class="confirm-val confirm-ref">${ref}</span></div>
        </div>
        <div class="confirm-actions">
          <a href="bookings.html" class="confirm-btn-primary">View My Bookings</a>
          <button id="confirm-close" class="confirm-btn-ghost">Done</button>
        </div>
      </div>`;
    injectCSS('confirm-styles', `
      #confirm-overlay{position:fixed;inset:0;background:rgba(4,22,37,.75);backdrop-filter:blur(6px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;}
      #confirm-dialog{background:#fff;border-radius:20px;padding:32px 28px;max-width:400px;width:100%;text-align:center;box-shadow:0 24px 64px rgba(0,0,0,.3);}
      .confirm-icon{width:56px;height:56px;border-radius:50%;background:#eef7ef;color:#16803d;font-size:26px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
      .confirm-title{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#171717;margin:0 0 6px;}
      .confirm-sub{font-size:13px;color:#7a6e60;margin:0 0 20px;line-height:1.5;}
      .confirm-details{background:#f6f1ea;border-radius:12px;padding:16px;margin-bottom:20px;text-align:left;}
      .confirm-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid rgba(0,0,0,.06);}
      .confirm-row:last-child{border-bottom:none;}
      .confirm-label,.confirm-val{font-size:12px;font-weight:600;}
      .confirm-label{color:#7a6e60;}
      .confirm-val{color:#171717;}
      .confirm-deal{color:#f2551c;}
      .confirm-ref{font-family:monospace;color:#7a6e60;}
      .confirm-actions{display:flex;flex-direction:column;gap:10px;}
      .confirm-btn-primary{display:block;height:44px;background:#f2551c;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;text-decoration:none;line-height:44px;transition:background .15s;}
      .confirm-btn-primary:hover{background:#ff6a3d;}
      .confirm-btn-ghost{height:44px;background:transparent;color:#7a6e60;border:1px solid #e6d8c8;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;}`);
    document.body.appendChild(overlay);
    document.getElementById('confirm-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if(e.target === overlay) overlay.remove(); });
  }

  /* ─────────────────────────────────────────────
     5. SEARCH — Home + Deals
     Home: div.hero-search > input[type="text"] + button"Search"
     Deals: div.hero-search > input[type="text"] + button"Find Deals"
     Cards to filter: a.rest-card (home), deal-card / .deal-item (deals)
  ───────────────────────────────────────────── */
  function fixSearch() {
    document.querySelectorAll('.hero-search').forEach(bar => {
      const input = bar.querySelector('input[type="text"]');
      const btn   = bar.querySelector('button');
      if (!input || input.dataset.patched) return;
      input.dataset.patched = '1';

      const doSearch = () => {
        const q = input.value.trim().toLowerCase();
        const cards = document.querySelectorAll('a.rest-card, .deal-card, [class*="deal-item"]');
        if (!q) { cards.forEach(c => c.style.display = ''); return; }
        let matched = 0;
        cards.forEach(c => {
          const show = c.innerText.toLowerCase().includes(q);
          c.style.display = show ? '' : 'none';
          if (show) matched++;
        });
        if (!matched) {
          showToast(`No results for "${q}"`);
          cards.forEach(c => c.style.display = '');
        }
      };

      input.addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
      if (btn) btn.addEventListener('click', e => { e.preventDefault(); doSearch(); });
    });
  }

  /* ─────────────────────────────────────────────
     7. CANCEL BOOKING — bookings.html
     Actual: button.btn-booking-danger  text="Cancel"
  ───────────────────────────────────────────── */
  function fixCancelBooking() {
    document.querySelectorAll('button.btn-booking-danger').forEach(btn => {
      if (btn.innerText.trim() !== 'Cancel') return;
      if (btn.dataset.patched) return;
      btn.dataset.patched = '1';
      btn.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        // Find the wrapping booking card — look up several levels
        const card = btn.closest('[class*="booking"], li, article, .card');
        const restName = card?.querySelector('h3, h4, strong, [class*="name"]')?.innerText?.trim() || 'this booking';
        showCancelDialog(restName, () => {
          if (card) {
            card.style.opacity = '0.5';
            card.style.transition = 'opacity .3s';
            const badge = card.querySelector('[class*="badge"], [class*="status"], [class*="tag"]');
            if (badge) { badge.textContent = 'Cancelled'; badge.style.background = '#fde8e6'; badge.style.color = '#c03020'; }
            btn.disabled = true;
            card.querySelectorAll('button.btn-booking-ghost').forEach(b => b.disabled = true);
          }
          showToast('Booking cancelled.');
        });
      });
    });
  }

  function showCancelDialog(restName, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'ia-cancel-overlay';
    overlay.innerHTML = `
      <div class="ia-cancel-dialog">
        <h3>Cancel this booking?</h3>
        <p>Your reservation at <strong>${restName}</strong> will be cancelled. This cannot be undone.</p>
        <div class="ia-cancel-actions">
          <button class="ia-cancel-confirm">Yes, cancel booking</button>
          <button class="ia-cancel-dismiss">Keep booking</button>
        </div>
      </div>`;
    injectCSS('cancel-styles', `
      .ia-cancel-overlay{position:fixed;inset:0;background:rgba(4,22,37,.65);backdrop-filter:blur(4px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;}
      .ia-cancel-dialog{background:#fff;border-radius:16px;padding:28px 24px;max-width:360px;width:100%;box-shadow:0 16px 48px rgba(0,0,0,.25);}
      .ia-cancel-dialog h3{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#171717;margin:0 0 8px;}
      .ia-cancel-dialog p{font-size:14px;color:#7a6e60;line-height:1.5;margin:0 0 20px;}
      .ia-cancel-dialog strong{color:#171717;}
      .ia-cancel-actions{display:flex;flex-direction:column;gap:10px;}
      .ia-cancel-confirm{height:44px;background:#c03020;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:14px;cursor:pointer;}
      .ia-cancel-confirm:hover{background:#a02010;}
      .ia-cancel-dismiss{height:44px;background:transparent;color:#7a6e60;border:1px solid #e6d8c8;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;}`);
    document.body.appendChild(overlay);
    overlay.querySelector('.ia-cancel-confirm').addEventListener('click', () => { onConfirm(); overlay.remove(); });
    overlay.querySelector('.ia-cancel-dismiss').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ─────────────────────────────────────────────
     7. EDIT BOOKING — bookings.html
     Actual: button.btn-booking-ghost  text="Edit Booking"
  ───────────────────────────────────────────── */
  function fixEditBooking() {
    document.querySelectorAll('button.btn-booking-ghost').forEach(btn => {
      if (btn.innerText.trim() !== 'Edit Booking') return;
      if (btn.dataset.patched) return;
      btn.dataset.patched = '1';
      btn.addEventListener('click', () => showToast('Edit booking — coming soon. Call the restaurant to modify your reservation.'));
    });
  }

  /* ─────────────────────────────────────────────
     8. FOOTER LINKS
     All footer links currently href="#" — map by text content.
     On deals.html they href="index.html" — normalise to "/".
  ───────────────────────────────────────────── */
  const FOOTER_MAP = {
    'fremont':         '/?city=fremont',
    'san jose':        '/?city=san-jose',
    'sunnyvale':       '/?city=sunnyvale',
    'artesia':         '/?city=artesia',
    'hyderabadi':      '/?cuisine=hyderabadi',
    'south indian':    '/?cuisine=south-indian',
    'gujarati':        '/?cuisine=gujarati',
    'kongu nadu':      '/?cuisine=kongu-nadu',
  };

  function fixFooterLinks() {
    document.querySelectorAll('footer a.footer-link').forEach(link => {
      const label = link.innerText.trim().toLowerCase();
      const dest  = FOOTER_MAP[label];

      // Replace index.html with /
      if (link.getAttribute('href') === 'index.html') {
        link.setAttribute('href', dest || '/');
        return;
      }
      // href="#" — map or add coming-soon toast
      if (link.getAttribute('href') === '#' || !link.getAttribute('href')) {
        if (dest) {
          link.setAttribute('href', dest);
        } else {
          link.addEventListener('click', e => { e.preventDefault(); showToast('Coming soon.'); });
        }
      }
    });
  }

  /* ─────────────────────────────────────────────
     9. HOLI COUNTDOWN
     IDs: #cd-days  #cd-hours  #cd-mins  #cd-secs
     Label: span.countdown-label
     Event name: span.countdown-event-name  > strong
  ───────────────────────────────────────────── */
  function fixHoliCountdown() {
    const banner = document.querySelector('.countdown-banner');
    if (!banner) return;

    const NEXT_EVENTS = [
      { name: 'Ghazal Night at Charminar', date: new Date('2026-03-29T19:00:00') },
      { name: 'Bay Area Diaspora Meetup',  date: new Date('2026-03-30T17:00:00') },
      { name: 'Ugadi Feast at Mylapore',   date: new Date('2026-04-06T12:00:00') },
    ];
    const now  = new Date();
    const next = NEXT_EVENTS.find(ev => ev.date > now);
    if (!next) { banner.style.display = 'none'; return; }

    // Update label text
    const label = banner.querySelector('.countdown-label');
    if (label) label.textContent = next.name.split(' ').slice(0, 3).join(' ') + ' starts in';

    // Update event name strong
    const nameStrong = banner.querySelector('.countdown-event-name strong');
    if (nameStrong) nameStrong.textContent = next.name;

    // Hook up live countdown to the real IDs
    const dEl = document.getElementById('cd-days');
    const hEl = document.getElementById('cd-hours');
    const mEl = document.getElementById('cd-mins');
    const sEl = document.getElementById('cd-secs');

    function tick() {
      const diff = Math.max(0, next.date - new Date());
      if (dEl) dEl.textContent = String(Math.floor(diff / 86400000)).padStart(2, '0');
      if (hEl) hEl.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      if (mEl) mEl.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      if (sEl) sEl.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ─────────────────────────────────────────────
     12. CITY SWITCHER
     Actual element: a.nav-city (index) | div.nav-city (other pages)
     Both are just static text. We build a dropdown on click.
  ───────────────────────────────────────────── */
  const CITIES = ['All Cities', 'Fremont', 'San Jose', 'Sunnyvale', 'Artesia'];

  function fixCitySwitcher() {
    document.querySelectorAll('.nav-city').forEach(switcher => {
      if (switcher.dataset.patched) return;
      switcher.dataset.patched = '1';
      switcher.style.position = 'relative';
      switcher.style.cursor   = 'pointer';

      const dropdown = document.createElement('ul');
      dropdown.style.cssText = [
        'display:none', 'position:absolute', 'top:calc(100% + 8px)', 'right:0',
        'min-width:160px', 'background:#fff', 'border:1px solid #e6d8c8',
        'border-radius:12px', 'box-shadow:0 8px 28px rgba(0,0,0,.12)',
        'padding:6px 0', 'z-index:5000', 'list-style:none', 'margin:0'
      ].join(';');

      CITIES.forEach(city => {
        const li = document.createElement('li');
        li.textContent = city;
        li.style.cssText = 'padding:10px 16px;font-size:14px;font-weight:600;color:#171717;cursor:pointer;font-family:Inter,sans-serif;';
        li.addEventListener('mouseover', () => li.style.background = '#f6f1ea');
        li.addEventListener('mouseout',  () => li.style.background = '');
        li.addEventListener('click', e => {
          e.stopPropagation();
          // Update visible label (last text node or span)
          const textNode = [...switcher.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
          if (textNode) textNode.textContent = ' ' + city;
          else {
            const span = switcher.querySelector('span, div');
            if (span) span.textContent = city;
          }
          dropdown.style.display = 'none';
          filterByCity(city === 'All Cities' ? null : city);
          showToast(city === 'All Cities' ? 'Showing all cities' : 'Showing ' + city);
        });
        dropdown.appendChild(li);
      });

      switcher.appendChild(dropdown);
      switcher.addEventListener('click', e => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
      });
      document.addEventListener('click', () => { dropdown.style.display = 'none'; });
    });
  }

  function filterByCity(city) {
    document.querySelectorAll('a.rest-card, .deal-card').forEach(card => {
      if (!city) { card.style.display = ''; return; }
      card.style.display = card.innerText.toLowerCase().includes(city.toLowerCase()) ? '' : 'none';
    });
  }

  /* ─────────────────────────────────────────────
     13. NAV WRAP FIX — detail pages
  ───────────────────────────────────────────── */
  function fixDetailNavLayout() {
    injectCSS('nav-detail-fix', `
      @media (max-width:900px){
        .nav-links{flex-wrap:nowrap!important;overflow-x:auto;}
        .nav-btn{padding:7px 12px!important;font-size:13px!important;white-space:nowrap;}
        .nav{flex-wrap:nowrap!important;}
      }
    `);
  }

  /* ─────────────────────────────────────────────
     14. EVENTS CAROUSEL FILTER
     Filter chips: button.filter-chip[data-filter]
     Event cards: div.event-card[data-type]
     Featured events: div.featured-event (no data-type, use innerText)
     The existing JS already filters .event-card by data-type.
     We additionally sync .featured-event visibility.
  ───────────────────────────────────────────── */
  function fixEventsCarouselFilter() {
    document.querySelectorAll('.filter-chip[data-filter]').forEach(chip => {
      if (chip.dataset.patchedCarousel) return;
      chip.dataset.patchedCarousel = '1';
      chip.addEventListener('click', () => {
        // Let the existing JS run first, then sync featured
        setTimeout(() => {
          const active = document.querySelector('.filter-chip[data-filter].active');
          const filter = active?.dataset?.filter || 'all';
          document.querySelectorAll('.featured-event').forEach(fe => {
            if (filter === 'all') { fe.style.display = ''; return; }
            const text = fe.innerText.toLowerCase();
            const tags = (fe.dataset.type || fe.dataset.filter || '').toLowerCase();
            fe.style.display = (text.includes(filter) || tags.includes(filter)) ? '' : 'none';
          });
        }, 60);
      });
    });
  }

  /* ─────────────────────────────────────────────
     15. LOCATION PIN NORMALISE
  ───────────────────────────────────────────── */
  function fixLocationPin() {
    injectCSS('pin-normalise', `
      .rest-city svg, .rest-location svg, [class*="loc"] svg, [class*="pin"] svg {
        width:12px!important;height:12px!important;flex-shrink:0!important;vertical-align:middle!important;
      }
    `);
  }

  /* ─────────────────────────────────────────────
     16. BACK TO DISCOVER — replace index.html with /
     Affects: brand links, nav Discover link, hero-back link, footer links
  ───────────────────────────────────────────── */
  function fixBackToDiscover() {
    document.querySelectorAll('a[href="index.html"]').forEach(a => {
      a.setAttribute('href', '/');
    });
  }

  /* ─────────────────────────────────────────────
     AUTH MODAL
  ───────────────────────────────────────────── */
  function openAuthModal(mode) {
    document.getElementById('auth-overlay')?.remove();
    const isSignup = mode === 'signup';
    const overlay  = document.createElement('div');
    overlay.id     = 'auth-overlay';
    overlay.innerHTML = `
      <div id="auth-dialog">
        <button id="auth-close">&#215;</button>
        <div class="auth-logo">Indeats<span style="color:#f2551c;">&#183;</span></div>
        <h2 class="auth-title">${isSignup ? 'Create your account' : 'Welcome back'}</h2>
        <p class="auth-sub">${isSignup ? 'Discover deals, book tables, and get personalised dining picks.' : 'Sign in to see your bookings and unlock deals.'}</p>
        <div class="auth-form">
          ${isSignup ? '<input class="auth-input" placeholder="Your name" type="text">' : ''}
          <input class="auth-input" placeholder="Email address" type="email">
          <button class="auth-btn-primary auth-submit">
            ${isSignup ? 'Get Started' : 'Sign In'}
          </button>
          <p class="auth-coming" style="display:none;color:#f2551c;font-size:13px;text-align:center;margin-top:8px;">
            Auth launching soon &#8212; you're on the early access list!
          </p>
          <p class="auth-toggle">
            ${isSignup
              ? 'Already have an account? <a href="#" id="auth-switch">Sign in</a>'
              : "Don't have an account? <a href='#' id='auth-switch'>Get started</a>"}
          </p>
        </div>
      </div>`;
    injectCSS('auth-styles', `
      #auth-overlay{position:fixed;inset:0;background:rgba(4,22,37,.75);backdrop-filter:blur(6px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;}
      #auth-dialog{background:#fff;border-radius:20px;padding:36px 28px;max-width:380px;width:100%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.3);}
      #auth-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:#f6f1ea;border:none;cursor:pointer;font-size:18px;color:#7a6e60;display:flex;align-items:center;justify-content:center;}
      .auth-logo{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#171717;margin-bottom:20px;}
      .auth-title{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#171717;margin:0 0 8px;}
      .auth-sub{font-size:13px;color:#7a6e60;line-height:1.5;margin:0 0 24px;}
      .auth-form{display:flex;flex-direction:column;gap:12px;}
      .auth-input{height:46px;border:1.5px solid #e6d8c8;border-radius:10px;padding:0 14px;font-size:14px;color:#171717;outline:none;transition:border-color .15s;}
      .auth-input:focus{border-color:#f2551c;}
      .auth-btn-primary{height:46px;background:#f2551c;color:#fff;border:none;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;transition:background .15s;}
      .auth-btn-primary:hover{background:#ff6a3d;}
      .auth-toggle{font-size:13px;color:#7a6e60;text-align:center;margin:4px 0 0;}
      .auth-toggle a{color:#f2551c;text-decoration:none;font-weight:600;}`);
    document.body.appendChild(overlay);
    overlay.querySelector('.auth-submit').addEventListener('click', () => {
      overlay.querySelector('.auth-coming').style.display = 'block';
    });
    document.getElementById('auth-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    document.getElementById('auth-switch')?.addEventListener('click', e => {
      e.preventDefault(); overlay.remove(); openAuthModal(isSignup ? 'signin' : 'signup');
    });
  }

  /* ─────────────────────────────────────────────
     EVENT BOOKING MODAL
  ───────────────────────────────────────────── */
  function openEventBookingModal(triggerEl) {
    const fe        = triggerEl.closest('.featured-event, .event-card');
    const eventName = fe?.querySelector('.featured-event-name, .event-title, h2, h3')?.innerText?.trim() || 'this event';
    const priceTxt  = fe?.querySelector('.featured-event-price, .event-price, [class*="price"]')?.innerText?.trim() || '';
    const overlay   = document.createElement('div');
    overlay.className = 'event-modal-overlay';
    overlay.innerHTML = `
      <div class="event-modal-dialog">
        <button class="event-modal-close">&#215;</button>
        <h2 class="event-modal-title">Reserve your seat</h2>
        <p class="event-modal-event">${eventName}</p>
        ${priceTxt ? `<p class="event-modal-meta">${priceTxt}/person</p>` : ''}
        <div class="event-modal-form">
          <div class="field"><label>Seats</label>
            <select class="auth-input" style="height:46px;">
              <option>1 person</option><option selected>2 people</option>
              <option>3 people</option><option>4 people</option>
            </select>
          </div>
          <button class="auth-btn-primary event-confirm-btn">Confirm Seat Reservation</button>
          <div class="event-confirm-state" style="display:none;background:#eef7ef;border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:22px;margin-bottom:6px;">&#10003;</div>
            <p style="font-weight:700;color:#16803d;margin:0 0 4px;font-family:Georgia,serif;">Seats reserved!</p>
            <p style="font-size:12px;color:#7a6e60;margin:0;">Check <a href="bookings.html" style="color:#f2551c;font-weight:600;">My Bookings</a> for details.</p>
          </div>
        </div>
      </div>`;
    injectCSS('event-modal-styles', `
      .event-modal-overlay{position:fixed;inset:0;background:rgba(4,22,37,.75);backdrop-filter:blur(6px);z-index:9100;display:flex;align-items:center;justify-content:center;padding:20px;}
      .event-modal-dialog{background:#fff;border-radius:20px;padding:32px 28px;max-width:380px;width:100%;position:relative;box-shadow:0 24px 64px rgba(0,0,0,.3);}
      .event-modal-close{position:absolute;top:14px;right:14px;width:30px;height:30px;border-radius:50%;background:#f6f1ea;border:none;cursor:pointer;font-size:18px;color:#7a6e60;}
      .event-modal-title{font-family:Georgia,serif;font-size:20px;font-weight:700;color:#171717;margin:0 0 6px;}
      .event-modal-event{font-size:15px;font-weight:600;color:#f2551c;margin:0 0 4px;}
      .event-modal-meta{font-size:13px;color:#7a6e60;margin:0 0 20px;}
      .event-modal-form{display:flex;flex-direction:column;gap:14px;}
      .field label{display:block;font-size:12px;font-weight:700;color:#7a6e60;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em;}`);
    document.body.appendChild(overlay);
    overlay.querySelector('.event-confirm-btn').addEventListener('click', function() {
      this.style.display = 'none';
      overlay.querySelector('.event-confirm-state').style.display = 'block';
    });
    overlay.querySelector('.event-modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }


  /* ─────────────────────────────────────────────
     AI COMING SOON — intercept FAB, show teaser
     Remove fixAIComingSoon() call when AI is ready to launch.
  ───────────────────────────────────────────── */
  function fixAIComingSoon() {
    function intercept() {
      const fab = document.getElementById('ia-fab');
      if (!fab || fab.dataset.comingSoon) return;
      fab.dataset.comingSoon = '1';
      fab.addEventListener('click', e => {
        e.stopImmediatePropagation();
        const panel    = document.getElementById('ia-panel');
        const backdrop = document.getElementById('ia-backdrop');
        if (panel)    panel.classList.remove('open');
        if (backdrop) backdrop.classList.remove('open');
        fab.classList.remove('open');
        document.body.classList.remove('ia-open');
        showAIComingSoonModal();
      }, true);
    }
    intercept();
    let attempts = 0;
    const poll = setInterval(() => {
      intercept();
      if (++attempts > 20) clearInterval(poll);
    }, 300);
  }

  function showAIComingSoonModal() {
    if (document.getElementById('ai-coming-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'ai-coming-overlay';
    overlay.innerHTML = `
      <div id="ai-coming-dialog">
        <button id="ai-coming-close">&#215;</button>
        <div class="ai-coming-avatar">I</div>
        <div class="ai-coming-badge">Beta &middot; Coming Soon</div>
        <h2 class="ai-coming-title">Indeats AI is almost here</h2>
        <p class="ai-coming-body">
          We're putting the finishing touches on your personal Indian dining coach —
          one that knows your taste, finds the best deals, and plans your evening
          before you even ask.
        </p>
        <div class="ai-coming-features">
          <div class="ai-coming-feature"><span class="ai-coming-dot" style="background:#f2551c;"></span>Personalised restaurant picks</div>
          <div class="ai-coming-feature"><span class="ai-coming-dot" style="background:#d2a145;"></span>Live deal recommendations</div>
          <div class="ai-coming-feature"><span class="ai-coming-dot" style="background:#16803d;"></span>Event planning &amp; seat booking</div>
        </div>
        <div class="ai-coming-input-wrap">
          <input class="ai-coming-input" type="text" placeholder="Ask Indeats AI anything..." disabled>
          <div class="ai-coming-input-note">Available soon &mdash; stay tuned</div>
        </div>
        <button id="ai-coming-dismiss" class="ai-coming-btn">Got it, can't wait!</button>
      </div>`;
    injectCSS('ai-coming-styles', `
      #ai-coming-overlay{position:fixed;inset:0;background:rgba(4,22,37,.8);backdrop-filter:blur(8px);z-index:9300;display:flex;align-items:center;justify-content:center;padding:20px;animation:ai-fade .25s ease;}
      @keyframes ai-fade{from{opacity:0}to{opacity:1}}
      #ai-coming-dialog{background:#0b1e2d;border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:36px 28px;max-width:400px;width:100%;position:relative;box-shadow:0 32px 80px rgba(0,0,0,.5);animation:ai-slide .3s cubic-bezier(.32,.72,0,1);text-align:center;}
      @keyframes ai-slide{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
      #ai-coming-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.07);border:none;cursor:pointer;font-size:18px;color:rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;transition:background .15s;}
      #ai-coming-close:hover{background:rgba(255,255,255,.13);color:#fff;}
      .ai-coming-avatar{width:56px;height:56px;border-radius:50%;margin:0 auto 16px;background:linear-gradient(135deg,#1a0a02,#f2551c);display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:24px;font-weight:700;color:#fff;box-shadow:0 0 0 6px rgba(242,85,28,.15);}
      .ai-coming-badge{display:inline-block;padding:4px 12px;border-radius:999px;background:rgba(242,85,28,.15);border:1px solid rgba(242,85,28,.3);font-size:11px;font-weight:700;color:#ff6a3d;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px;font-family:Inter,sans-serif;}
      .ai-coming-title{font-family:Georgia,serif;font-size:22px;font-weight:700;color:#fff;margin:0 0 12px;line-height:1.3;}
      .ai-coming-body{font-size:14px;color:rgba(255,255,255,.55);line-height:1.65;margin:0 0 24px;font-family:Inter,sans-serif;}
      .ai-coming-features{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:16px;margin-bottom:24px;text-align:left;display:flex;flex-direction:column;gap:10px;}
      .ai-coming-feature{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:600;color:rgba(255,255,255,.75);font-family:Inter,sans-serif;}
      .ai-coming-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0;}
      .ai-coming-input-wrap{margin-bottom:20px;}
      .ai-coming-input{width:100%;height:46px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:0 14px;font-size:14px;color:rgba(255,255,255,.25);font-family:Inter,sans-serif;cursor:not-allowed;box-sizing:border-box;}
      .ai-coming-input-note{font-size:11px;color:rgba(255,255,255,.25);margin-top:6px;font-family:Inter,sans-serif;text-align:center;}
      .ai-coming-btn{width:100%;height:46px;background:#f2551c;color:#fff;border:none;border-radius:12px;font-weight:700;font-size:15px;font-family:Inter,sans-serif;cursor:pointer;transition:background .15s;}
      .ai-coming-btn:hover{background:#ff6a3d;}
    `);
    document.body.appendChild(overlay);
    document.getElementById('ai-coming-close').addEventListener('click', () => overlay.remove());
    document.getElementById('ai-coming-dismiss').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  }

  /* ─────────────────────────────────────────────
     RUN
  ───────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    // Every page
    fixNav();
    fixFooterLinks();
    fixBackToDiscover();
    fixDetailNavLayout();
    fixLocationPin();
    fixCitySwitcher();
    fixAIComingSoon();

    if (PAGE === 'home') {
      fixRestaurantCards();
      fixSearch();
    }
    if (PAGE === 'deals') {
      fixSearch();
    }
    if (PAGE === 'events') {
      fixEventButtons();
      fixHoliCountdown();
      fixEventsCarouselFilter();
    }
    if (PAGE === 'detail') {
      fixReservationConfirm();
    }
    if (PAGE === 'bookings') {
      fixCancelBooking();
      fixEditBooking();
    }
  });

})();
