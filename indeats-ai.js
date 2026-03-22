/**
 * indeats-ai.js
 * Drop this single script tag before </body> on any Indeats page:
 * <script src="indeats-ai.js"></script>
 *
 * It injects: FAB button + backdrop + panel + all styles
 * Works on: index.html, deals.html, events.html, bookings.html
 * Mobile: bottom sheet · Desktop: side panel with page shift
 */

(function () {
  'use strict';

  /* ============================================
     DETECT CURRENT PAGE for contextual greeting
     ============================================ */
  const PATH = window.location.pathname;
  const PAGE =
    PATH.includes('deals')    ? 'deals'    :
    PATH.includes('events')   ? 'events'   :
    PATH.includes('bookings') ? 'bookings' : 'discover';

  const GREETINGS = {
    discover: {
      text: `Hey <strong>Mahesh</strong>, good evening.<br><br>Your last booking was <span class="ia-hl">Charminar on Mar 8</span> — you haven't tried South Indian this week. <span class="ia-hl">Saravana Bhavan</span> has a live deal right now, and there's a <span class="ia-hl">Ghazal Night</span> at Charminar on Mar 29.<br><br>Want me to plan something tonight?`,
      chips: ['Plan my evening', 'Best deal right now', 'Pure Veg for family', 'Events this weekend']
    },
    deals: {
      text: `Hey <strong>Mahesh</strong>. You're browsing deals — nice.<br><br>Based on your history, the <span class="ia-hl">20% off Biryani at Charminar</span> is your best match right now. The <span class="ia-hl">Thali Special at Mylapore</span> is a great Pure Veg option too.<br><br>Want me to pick the best deal for tonight?`,
      chips: ['Best deal for me tonight', 'Halal deals only', 'Under $15', 'Deals ending today']
    },
    events: {
      text: `Hey <strong>Mahesh</strong>. Looks like you're exploring events.<br><br>The <span class="ia-hl">Holi Feast at Mylapore</span> tonight has only <span class="ia-hl">7 seats left</span> — worth grabbing. If you prefer something later, the <span class="ia-hl">Ghazal Night at Charminar</span> on Mar 29 is a great fit for a couple's evening.<br><br>Which sounds more like your vibe?`,
      chips: ['Book Holi Feast tonight', 'Ghazal Night details', 'Free events only', 'Events for families']
    },
    bookings: {
      text: `Hey <strong>Mahesh</strong>. You have <span class="ia-hl">1 upcoming booking</span> at Charminar on Mar 8.<br><br>Your last South Indian meal was at Mylapore on Mar 2 — it's been a while. <span class="ia-hl">Meenakshi Bhavan</span> has a Buy 2 Get 1 Free deal on right now.<br><br>Want to add another booking this week?`,
      chips: ['Book another table', 'South Indian tonight', 'Remind me about Charminar', 'Cancel Charminar booking']
    }
  };

  /* ============================================
     DATA
     ============================================ */
  const RESTAURANTS = [
    { name:'Charminar',        cuisine:'Hyderabadi · Biryani',    city:'Fremont',   distance:'25 min', price:'$$', rating:'4.6', diets:['Halal'],             tags:['Biryani','Hyderabadi'], deal:'20% off on all Biryani',      gradient:'linear-gradient(135deg,#2a0e00,#6b2d00)', href:'charminar.html'    },
    { name:"Naga's Kitchen",   cuisine:'Tamil Home-style',         city:'Fremont',   distance:'15 min', price:'$',  rating:'4.8', diets:['Halal'],             tags:['South Indian'],         deal:'Free Chai with any meal',     gradient:'linear-gradient(135deg,#001a0d,#005c28)', href:'nagas-kitchen.html'},
    { name:'Mylapore',         cuisine:'South Indian · Pure Veg',  city:'Fremont',   distance:'20 min', price:'$',  rating:'4.3', diets:['Pure Veg','Jain Ok'],tags:['South Indian','Dosas'], deal:'Thali Special $11.99',        gradient:'linear-gradient(135deg,#0d0020,#3d0066)', href:'mylapore.html'     },
    { name:'Kongunadu',        cuisine:'Regional · Kongu Nadu',    city:'San Jose',  distance:'18 min', price:'$$', rating:'4.5', diets:['Regional'],          tags:['Regional'],             deal:'Lunch Special $12.99',        gradient:'linear-gradient(135deg,#001520,#003d5c)', href:'bookings.html'    },
    { name:'Meenakshi Bhavan', cuisine:'South Indian · Pure Veg',  city:'Fremont',   distance:'12 min', price:'$',  rating:'4.4', diets:['Pure Veg'],          tags:['South Indian'],         deal:'Buy 2 Dosas, Get 1 Free',     gradient:'linear-gradient(135deg,#001a10,#004d2a)', href:'bookings.html'    },
    { name:'A2B',              cuisine:'South Indian · Pure Veg',  city:'Sunnyvale', distance:'14 min', price:'$',  rating:'4.5', diets:['Pure Veg','Jain Ok'],tags:['South Indian'],         deal:'Festival Combo Meal',         gradient:'linear-gradient(135deg,#1a1400,#4a3a00)', href:'bookings.html'    },
    { name:'Saravana Bhavan',  cuisine:'South Indian · Pure Veg',  city:'Sunnyvale', distance:'10 min', price:'$',  rating:'4.6', diets:['Pure Veg','Jain Ok'],tags:['South Indian'],         deal:'Masala Dosa + Filter Coffee', gradient:'linear-gradient(135deg,#0a1a00,#2a4a00)', href:'bookings.html'    },
    { name:'Paradise',         cuisine:'Hyderabadi · Biryani',     city:'Fremont',   distance:'22 min', price:'$$', rating:'4.4', diets:['Halal'],             tags:['Biryani'],              deal:'15% Off Family Pack',         gradient:'linear-gradient(135deg,#1a0a00,#4a2000)', href:'bookings.html'    }
  ];

  const USER = { name:'Mahesh', city:'Fremont', pastBookings:['Charminar','Mylapore',"Naga's Kitchen"], preferences:'Halal preferred, loves Biryani, open to South Indian' };

  const SYSTEM_PROMPT = `You are the Indeats AI — a warm, personal dining coach for ${USER.name} in ${USER.city}, CA. Help them find Indian restaurants, deals, and events.

User context: past bookings: ${USER.pastBookings.join(', ')}. Preferences: ${USER.preferences}.

Restaurants:
${RESTAURANTS.map(r=>`- ${r.name} (${r.city}): ${r.cuisine}, ${r.price}, ${r.rating}★, Diets: ${r.diets.join('/')}, Deal: "${r.deal}"`).join('\n')}

Events: Holi Feast @ Mylapore Fri Mar 21 $34.99 | South Indian Buffet @ Saravana Bhavan Sat Mar 22 $18.99 | Ghazal Night @ Charminar Sat Mar 29 $22 | Diaspora Meetup @ Naga's Kitchen Sun Mar 30 Free

Be warm and direct like a local friend. Max 3 sentences unless asked for detail.

For restaurant recommendations respond ONLY in this JSON (no markdown):
{"type":"recommendation","restaurant_name":"exact name","why":"1-2 sentences","deal_highlight":"short text","message":"conversational line above the card"}

For all other responses:
{"type":"text","message":"your response"}`;

  /* ============================================
     INJECT STYLES
     ============================================ */
  const PANEL_W = '400px';
  const PANEL_H = '82vh';

  const css = `
  #ia-fab {
    position:fixed; bottom:28px; right:28px; z-index:9200;
    width:56px; height:56px; border-radius:50%;
    background:linear-gradient(135deg,#1a0a02 0%,#3d1200 60%,#f2551c 100%);
    border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    box-shadow:0 4px 20px rgba(242,85,28,.5),0 2px 8px rgba(0,0,0,.3);
    transition:transform .2s,box-shadow .2s;
    animation:ia-fab-in .4s ease .3s both;
    font-family:Georgia,"Times New Roman",serif;
  }
  @keyframes ia-fab-in{from{opacity:0;transform:scale(.6) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
  #ia-fab::before{content:'';position:absolute;inset:-6px;border-radius:50%;border:2px solid rgba(242,85,28,.35);animation:ia-ring 3s ease-in-out infinite;}
  @keyframes ia-ring{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.1;transform:scale(1.18)}}
  #ia-fab.open{transform:scale(1.05);box-shadow:0 8px 32px rgba(242,85,28,.7),0 0 0 4px rgba(242,85,28,.2);}
  #ia-fab.open::before{display:none;}
  #ia-fab:hover{transform:scale(1.08);box-shadow:0 8px 32px rgba(242,85,28,.65),0 4px 12px rgba(0,0,0,.3);}
  #ia-fab .ia-letter{font-size:22px;font-weight:700;color:#fff;line-height:1;letter-spacing:-.02em;pointer-events:none;}
  #ia-fab .ia-tip{position:absolute;right:calc(100% + 12px);top:50%;transform:translateY(-50%);background:#171717;color:#fff;font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s;font-family:Inter,sans-serif;}
  #ia-fab .ia-tip::after{content:'';position:absolute;left:100%;top:50%;transform:translateY(-50%);border:5px solid transparent;border-left-color:#171717;}
  #ia-fab:hover .ia-tip{opacity:1;}

  #ia-backdrop{position:fixed;inset:0;background:rgba(4,22,37,.6);backdrop-filter:blur(4px);z-index:9190;opacity:0;pointer-events:none;transition:opacity .3s;}
  #ia-backdrop.open{opacity:1;pointer-events:all;}

  #ia-panel{position:fixed;z-index:9195;background:#0b1e2d;display:flex;flex-direction:column;overflow:hidden;transition:transform .38s cubic-bezier(.32,.72,0,1);}

  @media(max-width:767px){
    #ia-panel{bottom:0;left:0;right:0;height:${PANEL_H};border-radius:24px 24px 0 0;transform:translateY(100%);}
    #ia-panel.open{transform:translateY(0);}
    #ia-fab{bottom:max(24px,env(safe-area-inset-bottom,24px) + 12px);right:20px;}
  }
  @media(min-width:768px){
    #ia-panel{top:0;right:0;bottom:0;width:${PANEL_W};border-left:1px solid rgba(255,255,255,.07);transform:translateX(100%);}
    #ia-panel.open{transform:translateX(0);}
    body.ia-open .nav,body.ia-open .hero,body.ia-open section,body.ia-open footer{margin-right:${PANEL_W};transition:margin-right .38s cubic-bezier(.32,.72,0,1);}
    .nav,.hero,section,footer{transition:margin-right .38s cubic-bezier(.32,.72,0,1);}
  }

  .ia-handle{width:36px;height:4px;background:rgba(255,255,255,.2);border-radius:2px;margin:12px auto 0;flex-shrink:0;}
  @media(min-width:768px){.ia-handle{display:none;}}

  .ia-phdr{display:flex;align-items:center;gap:10px;padding:16px 18px 14px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;}
  .ia-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a0a02,#f2551c);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
  .ia-av span{font-family:Georgia,serif;font-size:16px;font-weight:700;color:#fff;}
  .ia-ptb{flex:1;min-width:0;}
  .ia-ptitle{font-size:14px;font-weight:800;color:#fff;display:flex;align-items:center;gap:6px;font-family:Inter,sans-serif;}
  .ia-beta{font-size:9px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#ff6a3d;background:rgba(242,85,28,.15);border:1px solid rgba(242,85,28,.25);border-radius:4px;padding:2px 5px;}
  .ia-psub{font-size:11px;color:rgba(255,255,255,.35);margin-top:1px;font-family:Inter,sans-serif;}
  .ia-close{width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.07);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.5);transition:background .15s,color .15s;flex-shrink:0;}
  .ia-close:hover{background:rgba(255,255,255,.13);color:#fff;}

  .ia-body{flex:1;overflow-y:auto;padding:20px 18px 12px;display:flex;flex-direction:column;gap:16px;-webkit-overflow-scrolling:touch;}
  .ia-body::-webkit-scrollbar{width:3px;}
  .ia-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:2px;}

  .ia-ctx{display:flex;gap:8px;flex-wrap:wrap;}
  .ia-pill{display:inline-flex;align-items:center;gap:5px;padding:5px 10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:999px;font-size:11px;font-weight:600;color:rgba(255,255,255,.6);font-family:Inter,sans-serif;}
  .ia-pdot{width:5px;height:5px;border-radius:50%;flex-shrink:0;}

  .ia-msg{display:flex;flex-direction:column;gap:10px;animation:ia-in .35s ease;}
  @keyframes ia-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  .ia-bubble{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px 16px 16px 4px;padding:14px 16px;font-size:14px;line-height:1.6;color:rgba(255,255,255,.85);font-family:Inter,sans-serif;}
  .ia-bubble strong{color:#fff;font-weight:700;}
  .ia-hl{color:#ff6a3d;font-weight:600;}
  .ia-ububble{background:rgba(242,85,28,.15);border:1px solid rgba(242,85,28,.2);border-radius:16px 16px 4px 16px;padding:12px 16px;font-size:14px;color:#fff;align-self:flex-end;max-width:85%;animation:ia-in .25s ease;font-family:Inter,sans-serif;}

  .ia-chips{display:flex;gap:7px;flex-wrap:wrap;}
  .ia-chip{padding:8px 14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:999px;font-size:12px;font-weight:600;color:rgba(255,255,255,.75);cursor:pointer;font-family:Inter,sans-serif;transition:all .15s;white-space:nowrap;}
  .ia-chip:hover{background:rgba(242,85,28,.18);border-color:rgba(242,85,28,.4);color:#fff;}

  .ia-think{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:16px 16px 16px 4px;padding:14px 18px;display:inline-flex;align-items:center;gap:5px;animation:ia-in .25s ease;}
  .ia-tdot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);animation:ia-bounce 1.2s ease-in-out infinite;}
  .ia-tdot:nth-child(2){animation-delay:.2s;}.ia-tdot:nth-child(3){animation-delay:.4s;}
  @keyframes ia-bounce{0%,80%,100%{transform:scale(.8);opacity:.4}40%{transform:scale(1.2);opacity:1}}

  .ia-rec{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,.25);animation:ia-in .35s ease;}
  .ia-rec-img{height:100px;position:relative;overflow:hidden;}
  .ia-rec-img-inner{width:100%;height:100%;background-size:cover;background-position:center;}
  .ia-rec-img-ov{position:absolute;inset:0;background:linear-gradient(180deg,transparent 30%,rgba(0,0,0,.55) 100%);}
  .ia-rec-name{position:absolute;bottom:10px;left:12px;font-family:Georgia,serif;font-size:20px;font-weight:700;color:#fff;}
  .ia-rec-body{padding:12px 14px 14px;}
  .ia-rec-why{font-size:12px;color:#7a6e60;font-style:italic;line-height:1.4;margin-bottom:8px;font-family:Inter,sans-serif;}
  .ia-rec-deal{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(242,85,28,.08);border:1px solid rgba(242,85,28,.18);border-radius:999px;font-size:11px;font-weight:700;color:#f2551c;margin-bottom:10px;font-family:Inter,sans-serif;}
  .ia-rec-actions{display:flex;gap:8px;}
  .ia-btn-p{flex:1;height:34px;background:#f2551c;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:12px;font-family:Inter,sans-serif;cursor:pointer;transition:background .15s;}
  .ia-btn-p:hover{background:#ff6a3d;}
  .ia-btn-g{height:34px;padding:0 12px;background:transparent;color:#7a6e60;border:1px solid #e6d8c8;border-radius:8px;font-weight:600;font-size:12px;font-family:Inter,sans-serif;cursor:pointer;transition:border-color .15s,color .15s;white-space:nowrap;}
  .ia-btn-g:hover{border-color:#c0a88c;color:#171717;}
  .ia-tag{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:700;font-family:Inter,sans-serif;}
  .ia-tg{background:#eef7ef;color:#16803d;}.ia-tr{background:#fde8e6;color:#c03020;}.ia-tb{background:#e8eefc;color:#2c5ad9;}.ia-tw{background:#f3efe9;color:#6f5c42;}

  .ia-footer{padding:12px 14px;padding-bottom:max(14px,env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,.07);display:flex;gap:10px;align-items:center;flex-shrink:0;}
  .ia-input{flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:10px 14px;font-size:14px;color:#fff;font-family:Inter,sans-serif;outline:none;transition:border-color .15s;min-height:42px;}
  .ia-input::placeholder{color:rgba(255,255,255,.28);}
  .ia-input:focus{border-color:rgba(242,85,28,.4);}
  .ia-send{width:42px;height:42px;background:#f2551c;border:none;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;transition:background .15s,transform .1s;flex-shrink:0;}
  .ia-send:hover{background:#ff6a3d;transform:scale(1.05);}
  .ia-send:disabled{opacity:.4;cursor:not-allowed;transform:none;}
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ============================================
     INJECT HTML
     ============================================ */
  const greeting = GREETINGS[PAGE];

  const chipsHTML = greeting.chips.map(c =>
    `<button class="ia-chip" data-msg="${c}">${c}</button>`
  ).join('');

  const html = `
  <!-- Indeats AI FAB -->
  <button id="ia-fab" aria-label="Open Indeats AI Coach">
    <span class="ia-tip">Indeats AI</span>
    <span class="ia-letter">I</span>
  </button>

  <!-- Backdrop -->
  <div id="ia-backdrop"></div>

  <!-- Panel -->
  <div id="ia-panel">
    <div class="ia-handle"></div>

    <div class="ia-phdr">
      <div class="ia-av"><span>I</span></div>
      <div class="ia-ptb">
        <div class="ia-ptitle">Indeats AI <span class="ia-beta">Beta</span></div>
        <div class="ia-psub">Your personal dining coach</div>
      </div>
      <button class="ia-close" id="ia-close" aria-label="Close">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
      </button>
    </div>

    <div class="ia-body" id="ia-body">
      <div class="ia-ctx">
        <span class="ia-pill"><span class="ia-pdot" style="background:#16803d;"></span>Fremont</span>
        <span class="ia-pill"><span class="ia-pdot" style="background:#f2551c;"></span>3 past bookings</span>
        <span class="ia-pill"><span class="ia-pdot" style="background:#d2a145;"></span>Halal · Biryani fan</span>
      </div>
      <div class="ia-msg" id="ia-greeting">
        <div class="ia-bubble">${greeting.text}</div>
        <div class="ia-chips" id="ia-gchips">${chipsHTML}</div>
      </div>
    </div>

    <div class="ia-footer">
      <input class="ia-input" id="ia-input" type="text" placeholder="Ask Indeats AI anything...">
      <button class="ia-send" id="ia-send" aria-label="Send">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12M9 3.5L14 8l-5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
  </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  /* ============================================
     PANEL LOGIC
     ============================================ */
  let isOpen = false;
  const fab      = document.getElementById('ia-fab');
  const backdrop = document.getElementById('ia-backdrop');
  const panel    = document.getElementById('ia-panel');
  const body     = document.getElementById('ia-body');
  const input    = document.getElementById('ia-input');
  const sendBtn  = document.getElementById('ia-send');

  function openPanel() {
    isOpen = true;
    panel.classList.add('open');
    backdrop.classList.add('open');
    fab.classList.add('open');
    document.body.classList.add('ia-open');
    setTimeout(() => input.focus(), 400);
  }
  function closePanel() {
    isOpen = false;
    panel.classList.remove('open');
    backdrop.classList.remove('open');
    fab.classList.remove('open');
    document.body.classList.remove('ia-open');
  }

  fab.addEventListener('click', () => isOpen ? closePanel() : openPanel());
  backdrop.addEventListener('click', closePanel);
  document.getElementById('ia-close').addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && isOpen) closePanel(); });

  // Swipe down to close on mobile
  let touchY = 0;
  panel.addEventListener('touchstart', e => { touchY = e.touches[0].clientY; }, { passive: true });
  panel.addEventListener('touchend',   e => { if(e.changedTouches[0].clientY - touchY > 80) closePanel(); }, { passive: true });

  /* ============================================
     CHIP CLICKS
     ============================================ */
  document.getElementById('ia-gchips').addEventListener('click', e => {
    const chip = e.target.closest('.ia-chip');
    if(chip) { input.value = chip.dataset.msg; sendMessage(); }
  });

  /* ============================================
     SEND MESSAGE
     ============================================ */
  const history = [];

  input.addEventListener('keydown', e => {
    if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = input.value.trim();
    if(!text) return;

    input.value = '';
    sendBtn.disabled = true;

    // Hide greeting chips
    const gchips = document.getElementById('ia-gchips');
    if(gchips) gchips.style.display = 'none';

    appendUser(text);
    history.push({ role:'user', content: text });

    const thinkId = appendThinking();

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: history
        })
      });
      const data   = await res.json();
      const raw    = data.content?.[0]?.text || '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g,'').trim());

      removeThinking(thinkId);

      if(parsed.type === 'recommendation') {
        const r = RESTAURANTS.find(r => r.name.toLowerCase() === (parsed.restaurant_name || '').toLowerCase()) || RESTAURANTS[0];
        if(parsed.message) appendAI(parsed.message);
        appendRec(r, parsed.why, parsed.deal_highlight);
      } else {
        appendAI(parsed.message || 'Let me find something great for you.');
        appendFollowUp();
      }
      history.push({ role:'assistant', content: raw });

    } catch {
      removeThinking(thinkId);
      appendAI('Something went wrong — try asking again.');
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  /* ============================================
     DOM HELPERS
     ============================================ */
  function scroll() {
    setTimeout(() => body.scrollTo({ top: body.scrollHeight, behavior:'smooth' }), 50);
  }

  function appendUser(text) {
    const el = document.createElement('div');
    el.className = 'ia-ububble';
    el.textContent = text;
    body.appendChild(el); scroll();
  }

  function appendAI(html) {
    const el = document.createElement('div');
    el.className = 'ia-msg';
    el.innerHTML = `<div class="ia-bubble">${html}</div>`;
    body.appendChild(el); scroll();
  }

  function appendThinking() {
    const id = 'ia-t-' + Date.now();
    const el = document.createElement('div');
    el.id = id; el.className = 'ia-think';
    el.innerHTML = '<div class="ia-tdot"></div><div class="ia-tdot"></div><div class="ia-tdot"></div>';
    body.appendChild(el); scroll();
    return id;
  }

  function removeThinking(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
  }

  function appendRec(r, why, deal) {
    const dietTags = r.diets.slice(0,2).map(d => {
      const cls = d==='Halal'?'ia-tr':d.includes('Veg')?'ia-tg':d==='Jain Ok'?'ia-tb':'ia-tw';
      return `<span class="ia-tag ${cls}">${d}</span>`;
    }).join('');
    const el = document.createElement('div');
    el.className = 'ia-rec';
    el.innerHTML = `
      <div class="ia-rec-img">
        <div class="ia-rec-img-inner" style="background:${r.gradient};"></div>
        <div class="ia-rec-img-ov"></div>
        <div class="ia-rec-name">${r.name}</div>
      </div>
      <div class="ia-rec-body">
        <div class="ia-rec-why">"${why}"</div>
        <div class="ia-rec-deal">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1l1 2.5L8 4.5 5.5 5.5l-1 2.5-1-2.5L1 4.5l2.5-1L4.5 1z" fill="currentColor"/></svg>
          ${deal || r.deal}
        </div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">${dietTags}</div>
        <div class="ia-rec-actions">
          <button class="ia-btn-p" onclick="location.href='${r.href}'">Reserve Table</button>
          <button class="ia-btn-g" onclick="location.href='deals.html'">All Deals</button>
        </div>
      </div>`;
    body.appendChild(el); scroll();
  }

  function appendFollowUp() {
    const old = body.querySelector('.ia-follow');
    if(old) old.remove();
    const chips = [
      { l:'Recommend a restaurant', m:'Recommend the best restaurant for me tonight' },
      { l:'Best deal now',          m:'What is the best deal available right now?' },
      { l:'Jain options',           m:'Show me Jain-friendly restaurants' },
      { l:'Plan my evening',        m:'Plan my full evening with restaurant and event' }
    ];
    const el = document.createElement('div');
    el.className = 'ia-chips ia-follow';
    chips.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'ia-chip';
      btn.textContent = c.l;
      btn.addEventListener('click', () => { input.value = c.m; sendMessage(); });
      el.appendChild(btn);
    });
    body.appendChild(el); scroll();
  }

})();
