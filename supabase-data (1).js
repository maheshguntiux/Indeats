/**
 * supabase-data.js — Indeats Session 3
 * Shared data layer: fetches live restaurants + deals from Supabase
 * Used by index.html (Discover) and deals.html (Deals)
 */

(function () {

  const SUPABASE_URL = 'https://xblpsbzbxhnqjrxrhyiz.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhibHBzYnpieGhucWpyeHJoeWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTc5NzgsImV4cCI6MjA5MDIzMzk3OH0.VW7yY-kzqFNLepP7yGBq1EHOfrV1uZ5L0mKOhPA2fJw';

  // ── Cuisine-to-fallback image map ─────────────────────────────────
  const CUISINE_IMAGES = {
    'hyderabadi':    'https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?w=400&q=80&fit=crop',
    'biryani':       'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=400&q=80&fit=crop',
    'south indian':  'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400&q=80&fit=crop',
    'tamil':         'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80&fit=crop',
    'north indian':  'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80&fit=crop',
    'gujarati':      'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=400&q=80&fit=crop',
    'punjabi':       'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=400&q=80&fit=crop',
    'street food':   'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80&fit=crop',
    'chaat':         'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80&fit=crop',
    'default':       'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&q=80&fit=crop'
  };

  // ── Deal-type to bg gradient ──────────────────────────────────────
  const DEAL_GRADIENTS = {
    'discount': 'linear-gradient(135deg,#2a0e00,#6b2d00)',
    'fixed':    'linear-gradient(135deg,#001520,#003d5c)',
    'free':     'linear-gradient(135deg,#001a10,#004d2a)',
    'combo':    'linear-gradient(135deg,#1a1400,#4a3a00)',
    'event':    'linear-gradient(135deg,#0d0020,#3d0066)',
    'default':  'linear-gradient(135deg,#1a1a2e,#16213e)'
  };

  // ── Helper: get image for a restaurant ───────────────────────────
  function getRestaurantImage(r) {
    if (r.image_url) return r.image_url;
    const cuisines = (r.cuisine || []).map(c => c.toLowerCase());
    for (const c of cuisines) {
      for (const key of Object.keys(CUISINE_IMAGES)) {
        if (c.includes(key) || key.includes(c)) return CUISINE_IMAGES[key];
      }
    }
    return CUISINE_IMAGES['default'];
  }

  // ── Helper: normalize dietary array to data-diets string ─────────
  function buildDietsAttr(dietary) {
    const arr = (dietary || []).map(d => d.toLowerCase());
    const parts = [];
    if (arr.some(d => d.includes('halal'))) parts.push('halal');
    if (arr.some(d => d.includes('veg') && !d.includes('non'))) parts.push('pure veg');
    if (arr.some(d => d.includes('jain'))) parts.push('jain ok');
    if (arr.some(d => d.includes('non-veg') || d.includes('non veg'))) parts.push('non-veg');
    if (!parts.length) parts.push('non-veg');
    return parts.join(' ');
  }

  // ── Helper: price_range to display ───────────────────────────────
  function priceDisplay(p) {
    if (!p) return '$';
    return p.startsWith('$') ? p.replace(/[^$]/g, '').slice(0, 3) : '$';
  }

  // ── Supabase fetch wrapper ────────────────────────────────────────
  async function sbFetch(path) {
    const res = await fetch(SUPABASE_URL + path, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) throw new Error('Supabase error ' + res.status);
    return res.json();
  }

  // ── Fetch active restaurants ──────────────────────────────────────
  async function fetchRestaurants() {
    return sbFetch('/rest/v1/restaurants?status=eq.active&order=created_at.desc&limit=20');
  }

  // ── Fetch live deals (joined with restaurant name) ────────────────
  async function fetchDeals() {
    return sbFetch('/rest/v1/deals?status=eq.live&order=created_at.desc&limit=30');
  }

  // ── Build a restaurant disc-card HTML string ──────────────────────
  function buildRestaurantCard(r) {
    const img      = getRestaurantImage(r);
    const diets    = buildDietsAttr(r.dietary);
    const price    = priceDisplay(r.price_range);
    const city     = (r.city || 'Bay Area').toLowerCase();
    const cityDisp = r.city || 'Bay Area';
    const type     = (r.type || 'restaurant').toLowerCase();
    const cardClass = type.includes('truck') ? 'truck-card' :
                      type.includes('cloud') || type.includes('virtual') ? 'cloud-card' : 'restaurant-card';
    const isOpen   = true; // default open; extend later with hours field

    // First deal for this restaurant (if deals were pre-loaded)
    const deal = window._indeatsDeals
      ? window._indeatsDeals.find(d => d.restaurant_name === r.name && d.status === 'live')
      : null;
    const badgeHTML = deal ? `<div class="disc-badge">${escHtml(deal.title)}</div>` : '';

    // Rating placeholder (no ratings table yet — use 4.3–4.8 seeded from id)
    const ratingVal = (4.3 + ((r.id ? r.id.charCodeAt(0) : 0) % 6) * 0.1).toFixed(1);

    const cuisines = (r.cuisine || []).join(', ') || 'Indian';
    const tags = (r.cuisine || []).map(c => c.toLowerCase()).join(' ');

    return `<a class="disc-card ${cardClass}" href="bookings.html"
         data-city="${escAttr(city)}"
         data-diets="${escAttr(diets)}"
         data-open="${isOpen}"
         data-price="${escAttr(price)}"
         data-tags="${escAttr(tags)}">
        <div class="disc-img">
          <div class="disc-img-inner" style="background-image:url('${img}');background-size:cover;background-position:center;background-color:#4a3a10;"></div>
          <div class="disc-overlay"></div>
          ${badgeHTML}
          <div class="disc-save">&#9825;</div>
        </div>
        <div class="disc-info">
          <div class="disc-name-row">
            <span class="disc-name">${escHtml(r.name)}</span>
            <span class="disc-rating">&#9733; ${ratingVal}</span>
          </div>
          <div class="disc-sub-text">${escHtml(cityDisp)} &middot; ${escHtml(cuisines)}</div>
        </div>
      </a>`;
  }

  // ── Build a deal card HTML string ─────────────────────────────────
  function buildDealCard(d, expiryClass, expiryText) {
    const grad     = DEAL_GRADIENTS[d.type] || DEAL_GRADIENTS['default'];
    const typeLabel = { discount: '% Off', fixed: 'Fixed Price', free: 'Free Item', combo: 'Combo', event: 'Event' }[d.type] || d.type;
    const expHTML  = expiryText ? `<span class="deal-expiry-badge ${expiryClass}">${escHtml(expiryText)}</span>` : '';
    const ratingVal = (4.3 + ((d.id ? d.id.charCodeAt(0) : 0) % 6) * 0.1).toFixed(1);
    const city = d.city || '';
    const cityStr = city ? `${escHtml(city)} · ` : '';

    return `<div class="deal-card" data-type="${escAttr(d.type || 'discount')}" data-open="true" data-rating="${ratingVal}" data-saving="5" data-distance="20" data-diets="non-veg">
        <div class="deal-img">
          <div class="deal-img-inner" style="background: ${grad};"></div>
          <div class="deal-img-overlay"></div>
          <span class="deal-type-badge">${escHtml(typeLabel)}</span>
          ${expHTML}
          <button class="deal-save" title="Save deal">&#9825;</button>
        </div>
        <div class="deal-body">
          <div class="deal-header">
            <span class="deal-name">${escHtml(d.restaurant_name || 'Restaurant')}</span>
            <span class="deal-rating">&#9733; ${ratingVal}</span>
          </div>
          <div class="deal-offer">${escHtml(d.title || 'Special Deal')}</div>
          ${d.description ? `<div class="deal-meta">${escHtml(d.description)}</div>` : `<div class="deal-meta">${cityStr}Limited time offer</div>`}
          <div class="deal-tags">
            <span class="tag tag-warm">${escHtml(d.restaurant_name ? d.restaurant_name.charAt(0).toUpperCase() + d.restaurant_name.slice(1) : 'Indian')}</span>
          </div>
          <div class="deal-actions">
            <button class="btn-unlock">Unlock Deal</button>
            <button class="btn-deal-menu">Menu</button>
          </div>
        </div>
      </div>`;
  }

  // ── Skeleton shimmer card ─────────────────────────────────────────
  function buildSkeletonCard(type) {
    return `<div class="disc-card ${type} indeats-skeleton" style="pointer-events:none;">
      <div class="disc-img">
        <div class="disc-img-inner" style="background:#e0d8cc;animation:indeats-shimmer 1.4s infinite linear;background-size:200% 100%;background-image:linear-gradient(90deg,#e0d8cc 25%,#f0e8da 50%,#e0d8cc 75%);"></div>
      </div>
      <div class="disc-info" style="padding:12px 14px 14px;">
        <div style="height:14px;border-radius:4px;background:#e0d8cc;margin-bottom:8px;animation:indeats-shimmer 1.4s infinite linear;background-size:200% 100%;background-image:linear-gradient(90deg,#e0d8cc 25%,#f0e8da 50%,#e0d8cc 75%);"></div>
        <div style="height:11px;border-radius:4px;background:#ebe3d8;width:70%;animation:indeats-shimmer 1.4s infinite linear;background-size:200% 100%;background-image:linear-gradient(90deg,#ebe3d8 25%,#f8f2ea 50%,#ebe3d8 75%);"></div>
      </div>
    </div>`;
  }

  // ── Inject skeleton shimmer CSS once ─────────────────────────────
  function injectShimmerCSS() {
    if (document.getElementById('indeats-shimmer-style')) return;
    const s = document.createElement('style');
    s.id = 'indeats-shimmer-style';
    s.textContent = `@keyframes indeats-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
    document.head.appendChild(s);
  }

  // ── Escape helpers ────────────────────────────────────────────────
  function escHtml(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function escAttr(s) {
    return escHtml(s);
  }

  // ═══════════════════════════════════════════════════════════════════
  // DISCOVER PAGE — wire restaurants into r-row / t-row / c-row
  // ═══════════════════════════════════════════════════════════════════
  function initDiscover() {
    const rRow = document.getElementById('r-row');
    const tRow = document.getElementById('t-row');
    const cRow = document.getElementById('c-row');
    if (!rRow && !tRow && !cRow) return;

    // Save hardcoded HTML as fallback BEFORE touching anything
    const fallback = {
      r: rRow ? rRow.innerHTML : '',
      t: tRow ? tRow.innerHTML : '',
      c: cRow ? cRow.innerHTML : ''
    };

    fetchRestaurants().then(restaurants => {
      window._indeatsRestaurants = restaurants;

      return fetchDeals().then(deals => {
        window._indeatsDeals = deals;
        return restaurants;
      }).catch(() => restaurants);

    }).then(restaurants => {

      // No live partners yet — keep hardcoded demo cards exactly as-is
      if (!restaurants || !restaurants.length) return;

      // Split by type
      const byType = { restaurant: [], truck: [], cloud: [] };
      restaurants.forEach(r => {
        const t = (r.type || '').toLowerCase();
        if (t.includes('truck')) byType.truck.push(r);
        else if (t.includes('cloud') || t.includes('virtual')) byType.cloud.push(r);
        else byType.restaurant.push(r);
      });

      // Prepend real cards before demo cards — row always stays full
      function renderRow(row, items) {
        if (!row || !items.length) return;
        const realHTML = items.map(r => buildRestaurantCard(r)).join('');
        row.innerHTML = realHTML + row.innerHTML;
      }

      renderRow(rRow, byType.restaurant);
      renderRow(tRow, byType.truck);
      renderRow(cRow, byType.cloud);

      if (typeof window._indeatsReapplyFilters === 'function') {
        window._indeatsReapplyFilters();
      }

    }).catch(err => {
      console.warn('[Indeats] Could not load restaurant data:', err);
      // On any error, hardcoded demo cards remain untouched
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // DEALS PAGE — wire deals into grid-ending / grid-week / grid-always
  // ═══════════════════════════════════════════════════════════════════
  function initDeals() {
    const gridEnding = document.getElementById('grid-ending');
    const gridWeek   = document.getElementById('grid-week');
    const gridAlways = document.getElementById('grid-always');
    if (!gridEnding && !gridWeek && !gridAlways) return;

    fetchDeals().then(deals => {
      if (!deals || !deals.length) return; // keep hardcoded cards

      // Bucket deals: ending (valid_until within 2 days), week (within 7), always (no expiry / event)
      const now = new Date();
      const ending = [], week = [], always = [];

      deals.forEach(d => {
        if (!d.valid_until) {
          always.push(d);
          return;
        }
        const exp = new Date(d.valid_until);
        const daysLeft = (exp - now) / (1000 * 60 * 60 * 24);
        if (daysLeft <= 2) ending.push({ ...d, daysLeft });
        else if (daysLeft <= 7) week.push({ ...d, daysLeft });
        else always.push(d);
      });

      function renderGrid(grid, items, labelId) {
        if (!grid || !items.length) return;
        const html = items.map(d => {
          let exClass = 'normal', exText = '';
          if (d.daysLeft !== undefined) {
            exText = d.daysLeft < 1 ? 'Ends today' : `Ends in ${Math.ceil(d.daysLeft)} day${Math.ceil(d.daysLeft) > 1 ? 's' : ''}`;
            exClass = d.daysLeft < 1 ? 'urgent' : d.daysLeft <= 3 ? 'soon' : 'normal';
          }
          return buildDealCard(d, exClass, exText);
        }).join('');
        grid.innerHTML = html;
        // Update count badge
        const label = document.getElementById(labelId);
        if (label) {
          const span = label.querySelector('.grid-label-count');
          if (span) span.textContent = items.length;
        }
      }

      renderGrid(gridEnding, ending, 'section-ending');
      renderGrid(gridWeek,   week,   'section-week');
      renderGrid(gridAlways, always, 'section-always');

      // Re-run deal filter if it's already initialized
      if (typeof window._dealsApplyFilter === 'function') {
        window._dealsApplyFilter();
      }

    }).catch(err => {
      console.warn('[Indeats] Could not load deals data:', err);
    });
  }

  // ── Auto-detect page and initialize ──────────────────────────────
  function init() {
    const isDeals    = document.getElementById('grid-ending') || document.getElementById('grid-always');
    const isDiscover = document.getElementById('r-row');
    if (isDeals)    initDeals();
    if (isDiscover) initDiscover();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debug
  window._indeatsData = { fetchRestaurants, fetchDeals };

})();
