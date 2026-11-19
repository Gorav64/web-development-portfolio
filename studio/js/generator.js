/* SiteGen — turns a short client brief into a responsive static website.
   Output is plain HTML/CSS/JS: no frameworks, no build step, no dependencies. */
window.SiteGen = (() => {
  'use strict';

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));

  const PRESETS = {
    restaurant: {
      label: 'Restaurant',
      variant: 'split',
      theme: {
        bg: '#fbf6ee', surface: '#ffffff', ink: '#241d17', muted: '#6b5f52',
        line: 'rgba(36,29,23,0.13)', accent: '#b8431f', accent2: '#d9a441', btnInk: '#fff',
        heroBg: '#1f2a22', heroInk: '#f7f1e4', heroMuted: '#c9c3b4',
        fontH: "'Playfair Display', Georgia, serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '16px',
      },
      eyebrow: 'Independent restaurant',
      tagline: 'Honest food, made with care.',
      itemsLabel: 'Menu highlights',
      aboutLabel: 'Our story',
      ctaTitle: 'Ready to book a table?',
      sideTitle: 'Visit us',
      itemUnit: '',
    },
    cafe: {
      label: 'Café',
      variant: 'split',
      theme: {
        bg: '#faf5ef', surface: '#ffffff', ink: '#23201c', muted: '#6f675e',
        line: 'rgba(35,32,28,0.12)', accent: '#8a4b2a', accent2: '#c98f5f', btnInk: '#fff',
        heroBg: '#2b2420', heroInk: '#fbf3e8', heroMuted: '#c6bcae',
        fontH: "'Playfair Display', Georgia, serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '18px',
      },
      eyebrow: 'Neighbourhood café',
      tagline: 'Good coffee. Slow mornings. Better conversation.',
      itemsLabel: 'What we serve',
      aboutLabel: 'About the café',
      ctaTitle: 'Come say hello',
      sideTitle: 'Opening hours',
      itemUnit: '',
    },
    gym: {
      label: 'Gym',
      variant: 'bold',
      theme: {
        bg: '#0b0b0d', surface: '#131316', ink: '#f4f4f2', muted: '#a0a0a8',
        line: 'rgba(255,255,255,0.1)', accent: '#d4ff3f', accent2: '#a3e635', btnInk: '#0b0b0d',
        heroBg: '#0b0b0d', heroInk: '#ffffff', heroMuted: '#a0a0a8',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '10px',
      },
      eyebrow: 'Training facility',
      tagline: 'Train hard. Recover smart. Show up again.',
      itemsLabel: 'Memberships & classes',
      aboutLabel: 'The gym',
      ctaTitle: 'Start your first session',
      sideTitle: 'Opening hours',
      itemUnit: '/mo',
    },
    fitness: {
      label: 'Fitness studio',
      variant: 'bold',
      theme: {
        bg: '#0a0d10', surface: '#12171c', ink: '#f1f7fb', muted: '#93a3b0',
        line: 'rgba(255,255,255,0.1)', accent: '#38bdf8', accent2: '#818cf8', btnInk: '#04121c',
        heroBg: '#0a0d10', heroInk: '#ffffff', heroMuted: '#93a3b0',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '14px',
      },
      eyebrow: 'Fitness studio',
      tagline: 'Small classes. Real coaching. Steady progress.',
      itemsLabel: 'Classes & sessions',
      aboutLabel: 'About the studio',
      ctaTitle: 'Book a first class',
      sideTitle: 'Studio hours',
      itemUnit: '',
    },
    'real-estate': {
      label: 'Real estate agency',
      variant: 'split',
      theme: {
        bg: '#f7f5f0', surface: '#ffffff', ink: '#142033', muted: '#61708a',
        line: 'rgba(20,32,51,0.12)', accent: '#b28a4a', accent2: '#1f3a5f', btnInk: '#fff',
        heroBg: '#142033', heroInk: '#f8f6f0', heroMuted: '#b9c3d4',
        fontH: "'Playfair Display', Georgia, serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '6px',
      },
      eyebrow: 'Property specialists',
      tagline: 'Homes chosen with care, guidance you can trust.',
      itemsLabel: 'How we help',
      aboutLabel: 'About the agency',
      ctaTitle: 'Tell us what you are looking for',
      sideTitle: 'Contact the team',
      itemUnit: '',
    },
    salon: {
      label: 'Salon',
      variant: 'split',
      theme: {
        bg: '#fdf6f4', surface: '#ffffff', ink: '#2b2320', muted: '#7d6a68',
        line: 'rgba(43,35,32,0.11)', accent: '#a8505f', accent2: '#d8a48f', btnInk: '#fff',
        heroBg: '#33231f', heroInk: '#fdf1ec', heroMuted: '#cbb3ac',
        fontH: "'Playfair Display', Georgia, serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '20px',
      },
      eyebrow: 'Hair & beauty studio',
      tagline: 'Considered cuts, colour and care.',
      itemsLabel: 'Services',
      aboutLabel: 'About the salon',
      ctaTitle: 'Book your appointment',
      sideTitle: 'Opening hours',
      itemUnit: '',
    },
    consultant: {
      label: 'Consultant',
      variant: 'centered',
      theme: {
        bg: '#f6f8fb', surface: '#ffffff', ink: '#101828', muted: '#5d6b82',
        line: 'rgba(16,24,40,0.1)', accent: '#2563eb', accent2: '#7c3aed', btnInk: '#fff',
        heroBg: '#ffffff', heroInk: '#101828', heroMuted: '#5d6b82',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '14px',
      },
      eyebrow: 'Independent consultant',
      tagline: 'Clear thinking for complicated decisions.',
      itemsLabel: 'How I can help',
      aboutLabel: 'About',
      ctaTitle: 'Start with a conversation',
      sideTitle: 'Working hours',
      itemUnit: '',
    },
    'local-service': {
      label: 'Local service business',
      variant: 'split',
      theme: {
        bg: '#f7f9fc', surface: '#ffffff', ink: '#0f172a', muted: '#5f6d85',
        line: 'rgba(15,23,42,0.1)', accent: '#ea580c', accent2: '#1d4ed8', btnInk: '#fff',
        heroBg: '#0f172a', heroInk: '#f8fafc', heroMuted: '#a9b6cb',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '12px',
      },
      eyebrow: 'Local service',
      tagline: 'Reliable work, done properly the first time.',
      itemsLabel: 'Services',
      aboutLabel: 'Why choose us',
      ctaTitle: 'Request a quote',
      sideTitle: 'Contact & hours',
      itemUnit: '',
    },
    'small-business': {
      label: 'Small business',
      variant: 'centered',
      theme: {
        bg: '#f8fafc', surface: '#ffffff', ink: '#0f172a', muted: '#5b6a80',
        line: 'rgba(15,23,42,0.1)', accent: '#0f766e', accent2: '#0e7490', btnInk: '#fff',
        heroBg: '#ffffff', heroInk: '#0f172a', heroMuted: '#5b6a80',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '14px',
      },
      eyebrow: 'Local business',
      tagline: 'A name your neighbours know — now easier to find online.',
      itemsLabel: 'What we offer',
      aboutLabel: 'About us',
      ctaTitle: 'Get in touch',
      sideTitle: 'Visit or call',
      itemUnit: '',
    },
    startup: {
      label: 'Startup',
      variant: 'centered',
      theme: {
        bg: '#ffffff', surface: '#f8f7ff', ink: '#0b1020', muted: '#5c6478',
        line: 'rgba(11,16,32,0.1)', accent: '#6d28d9', accent2: '#2563eb', btnInk: '#fff',
        heroBg: '#ffffff', heroInk: '#0b1020', heroMuted: '#5c6478',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '16px',
      },
      eyebrow: 'Early-stage startup',
      tagline: 'A clear product story, built for the next stage.',
      itemsLabel: 'What we are building',
      aboutLabel: 'Our approach',
      ctaTitle: 'Join the early access list',
      sideTitle: 'Get in touch',
      itemUnit: '',
    },
    saas: {
      label: 'SaaS landing page',
      variant: 'centered',
      theme: {
        bg: '#07060d', surface: '#0f0c1c', ink: '#f5f2ff', muted: '#a29ac0',
        line: 'rgba(255,255,255,0.1)', accent: '#8b5cf6', accent2: '#4d8bff', btnInk: '#fff',
        heroBg: '#07060d', heroInk: '#ffffff', heroMuted: '#a29ac0',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '16px',
      },
      eyebrow: 'Software product',
      tagline: 'Less busywork. More of the work that matters.',
      itemsLabel: 'Key features',
      aboutLabel: 'Why teams switch',
      ctaTitle: 'Try it with your own data',
      sideTitle: 'Talk to us',
      itemUnit: '',
    },
    portfolio: {
      label: 'Personal portfolio',
      variant: 'bold',
      theme: {
        bg: '#f6f5f1', surface: '#ffffff', ink: '#111114', muted: '#5f5f66',
        line: 'rgba(17,17,20,0.12)', accent: '#7c3aed', accent2: '#db2777', btnInk: '#fff',
        heroBg: '#111114', heroInk: '#faf9f6', heroMuted: '#b3b3bb',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '8px',
      },
      eyebrow: 'Portfolio',
      tagline: 'Selected work, clearly explained.',
      itemsLabel: 'Selected projects',
      aboutLabel: 'About me',
      ctaTitle: 'Have a project in mind?',
      sideTitle: 'Contact',
      itemUnit: '',
    },
    agency: {
      label: 'Agency',
      variant: 'bold',
      theme: {
        bg: '#0a0a0b', surface: '#141416', ink: '#f5f5f3', muted: '#a1a1a8',
        line: 'rgba(255,255,255,0.1)', accent: '#ff5c1a', accent2: '#f59e0b', btnInk: '#120600',
        heroBg: '#0a0a0b', heroInk: '#ffffff', heroMuted: '#a1a1a8',
        fontH: "'Sora', system-ui, sans-serif", fontB: "'Inter', system-ui, sans-serif",
        radius: '6px',
      },
      eyebrow: 'Creative studio',
      tagline: 'Strategy, design and build — under one roof.',
      itemsLabel: 'What we do',
      aboutLabel: 'The studio',
      ctaTitle: 'Tell us about the project',
      sideTitle: 'Contact',
      itemUnit: '',
    },
  };

  const blank = (value, fallback) => (String(value || '').trim() || fallback);

  function themeCss(preset) {
    const t = preset.theme;
    return `
:root{
  --bg:${t.bg}; --surface:${t.surface}; --ink:${t.ink}; --muted:${t.muted};
  --line:${t.line}; --accent:${t.accent}; --accent-2:${t.accent2}; --btn-ink:${t.btnInk};
  --hero-bg:${t.heroBg}; --hero-ink:${t.heroInk}; --hero-muted:${t.heroMuted};
  --font-h:${t.fontH}; --font-b:${t.fontB}; --radius:${t.radius};
}`;
  }

  function build(brief) {
    const presetId = PRESETS[brief.presetId] ? brief.presetId : 'small-business';
    const preset = PRESETS[presetId];
    const name = blank(brief.businessName, 'Your Business');
    const tagline = blank(brief.tagline, preset.tagline);
    const description = blank(brief.description, '');
    const city = blank(brief.city, '');
    const phone = blank(brief.phone, '');
    const email = blank(brief.email, '');
    const address = blank(brief.address, '');
    const hoursRaw = blank(brief.hours, '');
    const credit = blank(brief.credit, '');
    const items = (Array.isArray(brief.items) ? brief.items : [])
      .filter((item) => String(item.name || '').trim())
      .slice(0, 8);
    const hours = hoursRaw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const variant = preset.variant;
    const year = new Date().getFullYear();
    const mapUrl = address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '';
    const initial = name.trim().charAt(0).toUpperCase() || 'B';

    const navCta = email ? `mailto:${email}` : '#contact';

    const heroActions = `
        <div class="hero-actions">
          <a class="btn btn-primary" href="#contact">${esc(brief.ctaLabel || 'Get in touch')}</a>
          ${items.length ? '<a class="btn btn-quiet" href="#offer">' + esc(preset.itemsLabel) + '</a>' : ''}
        </div>`;

    const heroCard = `
      <aside class="hero-card">
        <h2>${esc(preset.sideTitle)}</h2>
        ${hours.length ? `<ul class="hours">${hours.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>` : ''}
        ${address ? `<p class="hero-address">${esc(address)}</p>` : ''}
        ${phone ? `<a class="hero-contact" href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a>` : ''}
        ${email ? `<a class="hero-contact" href="mailto:${esc(email)}">${esc(email)}</a>` : ''}
        ${mapUrl ? `<a class="map-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Open in Google Maps →</a>` : ''}
      </aside>`;

    const factStrip = [city, hours.length ? hours[0] : '', phone]
      .filter(Boolean)
      .map((fact) => `<span>${esc(fact)}</span>`)
      .join('');

    const itemsSection = items.length ? `
    <section class="section" id="offer">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="eyebrow">${esc(preset.itemsLabel)}</span>
          <h2>${esc(preset.itemsLabel)}</h2>
        </div>
        <div class="items ${variant === 'bold' ? 'items-rows' : ''}">
          ${items.map((item, index) => `
          <article class="item reveal" style="--i:${index}">
            <div class="item-head">
              <h3>${esc(item.name)}</h3>
              ${item.price ? `<span class="price">${esc(item.price)}${esc(preset.itemUnit)}</span>` : ''}
            </div>
            ${item.desc ? `<p>${esc(item.desc)}</p>` : ''}
          </article>`).join('')}
        </div>
      </div>
    </section>` : '';

    const aboutSection = description ? `
    <section class="section section-alt" id="about">
      <div class="wrap about">
        <div class="about-visual reveal" aria-hidden="true">
          <span class="monogram">${esc(initial)}</span>
          <span class="about-ring"></span>
        </div>
        <div class="about-copy reveal">
          <span class="eyebrow">${esc(preset.aboutLabel)}</span>
          <h2>${esc(preset.aboutLabel)}</h2>
          <p>${esc(description).replace(/\n/g, '<br>')}</p>
          ${city ? `<p class="about-note">Based in ${esc(city)}.</p>` : ''}
        </div>
      </div>
    </section>` : '';

    const infoSection = (address || hours.length || phone || email) ? `
    <section class="section" id="visit">
      <div class="wrap">
        <div class="section-head reveal">
          <span class="eyebrow">Details</span>
          <h2>Find us &amp; get in touch</h2>
        </div>
        <div class="info-grid">
          ${address ? `
          <div class="info-card reveal">
            <h3>Address</h3>
            <p>${esc(address)}</p>
            ${mapUrl ? `<a class="text-link" href="${mapUrl}" target="_blank" rel="noopener noreferrer">Get directions →</a>` : ''}
          </div>` : ''}
          ${hours.length ? `
          <div class="info-card reveal">
            <h3>Hours</h3>
            <ul class="hours">${hours.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
          </div>` : ''}
          ${(phone || email) ? `
          <div class="info-card reveal">
            <h3>Contact</h3>
            ${phone ? `<p><a class="text-link" href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a></p>` : ''}
            ${email ? `<p><a class="text-link" href="mailto:${esc(email)}">${esc(email)}</a></p>` : ''}
          </div>` : ''}
        </div>
      </div>
    </section>` : '';

    const contactSection = `
    <section class="section section-alt" id="contact">
      <div class="wrap contact-grid">
        <div class="reveal">
          <span class="eyebrow">Contact</span>
          <h2>${esc(preset.ctaTitle)}</h2>
          <p class="lead">${email ? `Send a message and we will get back to you at <a class="text-link" href="mailto:${esc(email)}">${esc(email)}</a>.` : 'Send a message using the form. It opens your email app with everything pre-filled.'}</p>
          ${phone ? `<p class="lead"><a class="text-link" href="tel:${esc(phone.replace(/[^\d+]/g, ''))}">${esc(phone)}</a></p>` : ''}
        </div>
        <form class="contact-form reveal" id="contact-form" novalidate>
          <label>Name<input name="name" type="text" required autocomplete="name" /></label>
          <label>Email<input name="email" type="email" required autocomplete="email" /></label>
          <label>Message<textarea name="message" rows="4" required></textarea></label>
          <button class="btn btn-primary" type="submit">Send message</button>
          <p class="form-note">This form opens your email app. Nothing is sent until you press send there.</p>
          <p class="form-feedback" id="form-feedback" role="status"></p>
        </form>
      </div>
    </section>`;

    const schema = {
      '@context': 'https://schema.org',
      '@type': presetId === 'portfolio' || presetId === 'agency' ? 'Organization' : 'LocalBusiness',
      name,
      description: description.split(/\r?\n/)[0].slice(0, 200) || tagline,
      email: email || undefined,
      telephone: phone || undefined,
      address: address ? { '@type': 'PostalAddress', streetAddress: address } : undefined,
      areaServed: city || undefined,
    };

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(name)}${city ? ` — ${esc(city)}` : ''} | ${esc(tagline)}</title>
  <meta name="description" content="${esc(`${name}. ${description.split(/\r?\n/)[0] || tagline}`.slice(0, 158))}" />
  <meta name="theme-color" content="${preset.theme.bg}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${esc(name)}" />
  <meta property="og:description" content="${esc(tagline)}" />
  <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${preset.theme.accent}"/><text x="32" y="43" font-family="Georgia,serif" font-size="32" fill="${preset.theme.btnInk}" text-anchor="middle">${initial}</text></svg>`)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:wght@500;600;700&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head>
<body class="variant-${variant}">
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-head" id="site-head">
    <div class="wrap head-inner">
      <a class="brand" href="#top">
        <span class="brand-mark">${esc(initial)}</span>
        <span class="brand-name">${esc(name)}</span>
      </a>
      <button class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="site-nav" aria-label="Menu">
        <span></span><span></span>
      </button>
      <nav class="site-nav" id="site-nav" aria-label="Main">
        ${items.length ? `<a href="#offer">${esc(preset.itemsLabel)}</a>` : ''}
        ${description ? '<a href="#about">About</a>' : ''}
        ${address || hours.length ? '<a href="#visit">Visit</a>' : ''}
        <a href="#contact">Contact</a>
        <a class="btn btn-primary btn-sm" href="${navCta}">${esc(brief.ctaLabel || 'Contact us')}</a>
      </nav>
    </div>
  </header>

  <main id="main">
    <section class="hero hero-${variant}" id="top">
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="wrap ${variant === 'split' ? 'hero-grid' : 'hero-inner'}">
        <div class="hero-copy">
          <span class="eyebrow hero-eyebrow">${esc(blank(brief.eyebrow, preset.eyebrow))}</span>
          <h1>${esc(tagline)}</h1>
          <p class="hero-lead">${esc(blank(brief.heroText, description.split(/\r?\n/)[0] || `Welcome to ${name}${city ? ' in ' + city : ''}.`))}</p>
          ${heroActions}
          ${factStrip ? `<div class="facts">${factStrip}</div>` : ''}
        </div>
        ${variant === 'split' ? heroCard : (variant === 'centered' ? heroCard : '')}
      </div>
    </section>

    ${itemsSection}
    ${aboutSection}
    ${infoSection}
    ${contactSection}
  </main>

  <footer class="site-foot">
    <div class="wrap foot-inner">
      <div>
        <strong>${esc(name)}</strong>
        <p>${city ? esc(city) + ' · ' : ''}${email ? `<a href="mailto:${esc(email)}">${esc(email)}</a>` : ''}</p>
      </div>
      <nav aria-label="Footer">
        ${items.length ? `<a href="#offer">${esc(preset.itemsLabel)}</a>` : ''}
        ${description ? '<a href="#about">About</a>' : ''}
        <a href="#contact">Contact</a>
      </nav>
    </div>
    <div class="wrap foot-bottom">
      <span>© ${year} ${esc(name)}. All rights reserved.</span>
      ${credit ? `<span class="credit">Website by ${esc(credit)}</span>` : ''}
    </div>
  </footer>

  <script src="script.js"></script>
</body>
</html>`;

    const css = `/* ${name} — generated ${new Date().toISOString().slice(0, 10)} */
${themeCss(preset)}
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:84px;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font-b);font-size:16px;line-height:1.65;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:var(--font-h);line-height:1.12;letter-spacing:-.02em;margin:0;font-weight:600;text-wrap:balance}
p{margin:0;text-wrap:pretty}
a{color:inherit;text-decoration:none}
img,svg{display:block;max-width:100%}
ul{margin:0;padding:0;list-style:none}
button{font:inherit;color:inherit;cursor:pointer}
:focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px}
::selection{background:var(--accent);color:var(--btn-ink)}
.skip{position:fixed;left:16px;top:-80px;z-index:100;background:var(--accent);color:var(--btn-ink);padding:10px 16px;border-radius:8px;font-weight:600}
.skip:focus{top:14px}
.wrap{max-width:1120px;margin:0 auto;padding:0 24px}

/* Header */
.site-head{position:sticky;top:0;z-index:60;background:var(--bg);border-bottom:1px solid var(--line);backdrop-filter:blur(14px)}
@supports (background:color-mix(in srgb,red 50%,blue)){.site-head{background:color-mix(in srgb,var(--bg) 88%,transparent)}}
.head-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:72px}
.brand{display:flex;align-items:center;gap:11px;font-family:var(--font-h);font-weight:600;letter-spacing:-.01em}
.brand-mark{display:grid;place-items:center;width:36px;height:36px;border-radius:calc(var(--radius) * .6);background:var(--accent);color:var(--btn-ink);font-family:var(--font-h);font-size:1rem;font-weight:700}
.site-nav{display:flex;align-items:center;gap:6px}
.site-nav a{padding:8px 12px;border-radius:8px;font-size:.88rem;color:var(--muted);transition:color .2s,background .2s}
.site-nav a:hover{color:var(--ink);background:color-mix(in srgb,var(--ink) 6%,transparent)}
.site-nav a.btn{color:var(--btn-ink);padding:9px 16px}
.site-nav a.btn:hover{background:var(--accent);color:var(--btn-ink)}
.nav-toggle{display:none;width:42px;height:42px;border:1px solid var(--line);border-radius:10px;background:transparent;position:relative}
.nav-toggle span{position:absolute;left:11px;width:19px;height:1.6px;background:var(--ink);transition:.25s}
.nav-toggle span:nth-child(1){top:16px}
.nav-toggle span:nth-child(2){top:23px}
.menu-open .nav-toggle span:nth-child(1){top:20px;transform:rotate(45deg)}
.menu-open .nav-toggle span:nth-child(2){top:20px;transform:rotate(-45deg)}

/* Buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 24px;border-radius:calc(var(--radius) * .55);font-weight:600;font-size:.94rem;border:1px solid transparent;transition:transform .22s cubic-bezier(.22,1,.36,1),box-shadow .22s,background .22s}
.btn-primary{background:var(--accent);color:var(--btn-ink);box-shadow:0 12px 30px -16px var(--accent)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 18px 36px -16px var(--accent)}
.btn-quiet{border-color:var(--line);color:var(--ink);background:transparent}
.btn-quiet:hover{background:color-mix(in srgb,var(--ink) 6%,transparent)}
.btn-sm{padding:9px 16px;font-size:.82rem}

/* Hero */
.hero{position:relative;overflow:hidden}
.hero-glow{position:absolute;width:640px;height:640px;right:-180px;top:-260px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--accent) 30%,transparent),transparent 68%);pointer-events:none}
.hero-split{background:var(--hero-bg);color:var(--hero-ink);padding:76px 0}
.hero-split .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:56px;align-items:center;position:relative}
.hero-split h1{font-size:clamp(2.4rem,5.2vw,4rem);color:var(--hero-ink)}
.hero-split .hero-lead{color:var(--hero-muted)}
.hero-split .hero-eyebrow{color:color-mix(in srgb,var(--hero-ink) 72%,transparent);border-color:color-mix(in srgb,var(--hero-ink) 22%,transparent)}
.hero-split .hero-card{background:color-mix(in srgb,var(--hero-ink) 6%,transparent);border-color:color-mix(in srgb,var(--hero-ink) 16%,transparent);color:var(--hero-ink)}
.hero-split .hero-card h2{color:var(--hero-ink)}
.hero-split .hours{color:var(--hero-muted)}
.hero-split .hero-contact,.hero-split .hero-address{color:var(--hero-muted)}
.hero-split .map-link{color:color-mix(in srgb,var(--hero-ink) 85%,transparent)}
.hero-centered{padding:96px 0 84px;text-align:center}
.hero-centered .hero-inner{max-width:840px;position:relative}
.hero-centered h1{font-size:clamp(2.5rem,5.6vw,4.3rem)}
.hero-centered .hero-lead{margin:20px auto 0;max-width:600px;color:var(--muted)}
.hero-centered .hero-actions{justify-content:center}
.hero-centered .facts{justify-content:center}
.hero-centered .hero-card{margin:38px auto 0;max-width:440px;text-align:left}
.hero-bold{padding:92px 0 84px;background:var(--hero-bg);color:var(--hero-ink)}
.hero-bold .hero-inner{position:relative;max-width:920px}
.hero-bold h1{font-size:clamp(2.6rem,6.4vw,5rem);line-height:1.02;letter-spacing:-.035em;text-transform:none;color:var(--hero-ink)}
.hero-bold .hero-lead{color:var(--hero-muted);max-width:560px}
.hero-bold .hero-eyebrow{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)}
.hero-bold .btn-quiet{border-color:color-mix(in srgb,var(--hero-ink) 25%,transparent);color:var(--hero-ink)}
.hero-bold .facts{border-top-color:color-mix(in srgb,var(--hero-ink) 16%,transparent)}
.hero-bold .facts span{color:var(--hero-muted)}
.hero-eyebrow{display:inline-block;padding:6px 13px;border-radius:100px;border:1px solid var(--line);color:var(--muted);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500;margin-bottom:24px}
.hero h1{margin-bottom:20px}
.hero-lead{max-width:560px;color:var(--muted);font-size:1.02rem;line-height:1.7}
.hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
.hero-bold .hero-actions{margin-top:36px}
.facts{display:flex;flex-wrap:wrap;gap:10px 26px;margin-top:38px;padding-top:22px;border-top:1px solid var(--line);font-size:.8rem;color:var(--muted)}
.hero-card{border:1px solid var(--line);border-radius:var(--radius);padding:26px;background:var(--surface)}
.hero-card h2{font-size:1rem;margin-bottom:14px;font-family:var(--font-b);font-weight:600;letter-spacing:0}
.hours{display:flex;flex-direction:column;gap:5px;font-size:.84rem;color:var(--muted)}
.hours li{display:flex;justify-content:space-between;gap:16px}
.hero-address{font-size:.84rem;color:var(--muted);margin-top:14px}
.hero-contact{display:block;margin-top:10px;font-size:.84rem;font-weight:500}
.hero-contact:hover{color:var(--accent)}
.map-link{display:inline-block;margin-top:16px;font-size:.78rem;font-weight:600;color:var(--accent)}
.map-link:hover{text-decoration:underline}

/* Sections */
.section{padding:88px 0}
.section-alt{background:color-mix(in srgb,var(--ink) 4%,var(--bg))}
.section-head{margin-bottom:38px;max-width:640px}
.eyebrow{display:inline-block;margin-bottom:12px;font-size:.7rem;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);font-weight:600}
.section-head h2{font-size:clamp(1.8rem,3.4vw,2.6rem)}
.items{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.item{border:1px solid var(--line);border-radius:var(--radius);padding:22px;background:var(--surface);transition:transform .3s cubic-bezier(.22,1,.36,1),border-color .3s}
.item:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--accent) 45%,var(--line))}
.item-head{display:flex;align-items:baseline;justify-content:space-between;gap:14px;margin-bottom:8px}
.item h3{font-size:1.06rem;font-family:var(--font-b);font-weight:600;letter-spacing:-.01em}
.item p{font-size:.88rem;color:var(--muted);line-height:1.6}
.price{font-family:var(--font-h);font-weight:600;color:var(--accent);font-size:.95rem;white-space:nowrap}
.items-rows{grid-template-columns:1fr;gap:0;border-top:1px solid var(--line)}
.items-rows .item{border:0;border-bottom:1px solid var(--line);border-radius:0;padding:22px 4px;background:transparent;display:grid;grid-template-columns:.9fr 1.4fr auto;gap:24px;align-items:center}
.items-rows .item-head{display:contents}
.items-rows .item p{margin:0}
.items-rows .item h3{font-family:var(--font-h);font-size:1.3rem}
.items-rows .item:hover{transform:none;background:color-mix(in srgb,var(--accent) 4%,transparent)}

.about{display:grid;grid-template-columns:.85fr 1.15fr;gap:64px;align-items:center}
.about-visual{position:relative;aspect-ratio:1;max-width:360px;border-radius:var(--radius);background:linear-gradient(150deg,var(--accent),var(--accent-2));display:grid;place-items:center;overflow:hidden}
.about-visual::before{content:'';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.12) 1px,transparent 1px);background-size:38px 38px;opacity:.6}
.monogram{position:relative;font-family:var(--font-h);font-size:6rem;font-weight:700;color:var(--btn-ink);opacity:.9}
.about-ring{position:absolute;inset:14%;border:1px solid rgba(255,255,255,.4);border-radius:50%}
.about-copy h2{font-size:clamp(1.8rem,3.2vw,2.5rem);margin-bottom:16px}
.about-copy p{color:var(--muted);line-height:1.75}
.about-note{margin-top:14px;font-size:.85rem;font-weight:500;color:var(--accent)}

.info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.info-card{border:1px solid var(--line);border-radius:var(--radius);padding:24px;background:var(--surface)}
.info-card h3{font-family:var(--font-b);font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;font-weight:600}
.info-card p{font-size:.9rem;margin-bottom:6px}
.text-link{color:var(--accent);font-weight:500;font-size:.88rem;text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}
.text-link:hover{color:var(--accent-2)}

.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
.contact-grid h2{font-size:clamp(1.8rem,3.2vw,2.5rem);margin-bottom:14px}
.contact-grid .lead{color:var(--muted);margin-bottom:10px;max-width:420px}
.contact-form{display:flex;flex-direction:column;gap:14px}
.contact-form label{display:flex;flex-direction:column;gap:6px;font-size:.78rem;font-weight:500;color:var(--muted)}
.contact-form input,.contact-form textarea{width:100%;padding:12px 14px;border-radius:calc(var(--radius) * .45);border:1px solid var(--line);background:var(--bg);color:var(--ink);font:inherit;font-size:.9rem;transition:border-color .2s,box-shadow .2s}
.contact-form textarea{resize:vertical;min-height:110px}
.contact-form input:focus,.contact-form textarea:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.contact-form .btn{align-self:flex-start;margin-top:4px}
.form-note{font-size:.72rem;color:var(--muted);line-height:1.5}
.form-feedback{font-size:.78rem;color:var(--accent);min-height:1em}

/* Footer */
.site-foot{border-top:1px solid var(--line);padding:42px 0 26px;background:var(--bg)}
.foot-inner{display:flex;justify-content:space-between;gap:32px;flex-wrap:wrap;padding-bottom:26px}
.foot-inner strong{font-family:var(--font-h);font-size:1rem;font-weight:600}
.foot-inner p{font-size:.82rem;color:var(--muted);margin-top:6px}
.foot-inner nav{display:flex;gap:18px;font-size:.84rem;color:var(--muted)}
.foot-inner nav a:hover{color:var(--ink)}
.foot-bottom{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-top:20px;border-top:1px solid var(--line);font-size:.74rem;color:var(--muted)}

/* Reveal */
.reveal{opacity:0;transform:translateY(18px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);transition-delay:calc(var(--i,0) * 60ms)}
.reveal.in{opacity:1;transform:none}

/* Responsive */
@media (max-width:980px){
  .hero-split .hero-grid{grid-template-columns:1fr;gap:40px}
  .hero-split .hero-card{max-width:460px}
  .about{grid-template-columns:1fr;gap:40px}
  .about-visual{max-width:280px}
  .contact-grid{grid-template-columns:1fr;gap:36px}
  .items{grid-template-columns:repeat(2,1fr)}
  .info-grid{grid-template-columns:1fr}
  .items-rows .item{grid-template-columns:1fr auto}
  .items-rows .item p{grid-column:1 / -1}
}
@media (max-width:820px){
  .nav-toggle{display:block}
  .site-nav{position:absolute;top:72px;left:0;right:0;flex-direction:column;align-items:stretch;gap:2px;padding:14px 20px 20px;background:var(--bg);border-bottom:1px solid var(--line);box-shadow:0 24px 40px -20px rgba(0,0,0,.35);display:none}
  .menu-open .site-nav{display:flex}
  .site-nav a{padding:12px;font-size:.95rem}
  .site-nav a.btn{margin-top:8px;justify-content:center}
}
@media (max-width:640px){
  .wrap{padding:0 18px}
  .section{padding:64px 0}
  .hero-split,.hero-bold{padding:56px 0}
  .hero-centered{padding:64px 0 56px}
  .items{grid-template-columns:1fr}
  .facts{gap:8px 18px}
  .foot-inner{flex-direction:column;gap:20px}
}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.01ms!important;transition-duration:.01ms!important}
  .reveal{opacity:1;transform:none}
}
`;

    const js = `/* ${name} — interactions */
(function () {
  var head = document.getElementById('site-head');
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('site-nav');

  if (toggle && head) {
    toggle.addEventListener('click', function () {
      var open = head.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    });
    if (nav) {
      nav.addEventListener('click', function (event) {
        if (event.target.closest('a')) {
          head.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = [].slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { observer.observe(el); });
  }

  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var feedback = document.getElementById('form-feedback');
      var data = new FormData(form);
      var name = String(data.get('name') || '').trim();
      var email = String(data.get('email') || '').trim();
      var message = String(data.get('message') || '').trim();
      if (!name || !email || !message) {
        if (feedback) feedback.textContent = 'Please fill in every field.';
        return;
      }
      var to = ${JSON.stringify(email)};
      if (!to) {
        if (feedback) feedback.textContent = 'Add your email address in script.js to enable this form.';
        return;
      }
      var subject = 'Website enquiry from ' + name;
      var body = name + ' (' + email + ') wrote:\\n\\n' + message;
      window.location.href = 'mailto:' + to + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      if (feedback) feedback.textContent = 'Opening your email app with the message pre-filled.';
    });
  }
})();
`;

    const readme = `# ${name} — website delivery files

Generated by Studio on ${new Date().toISOString().slice(0, 10)} from a client brief.
Stack: plain HTML, CSS and JavaScript. No build step, no dependencies.

## Files

| File | Purpose |
| --- | --- |
| \`index.html\` | The page structure and content |
| \`styles.css\` | All styling (theme variables at the top) |
| \`script.js\` | Mobile menu, scroll reveals, contact form behaviour |
| \`README.md\` | This document |

## Preview locally

Double-click \`index.html\`, or run a local server from this folder:

\`\`\`bash
py -m http.server 8080
\`\`\`

Then open http://localhost:8080

## First edits

- **Brand colours and fonts** — the \`:root\` block at the top of \`styles.css\`.
- **Content** — every section is commented in \`index.html\`; headings are plain text.
- **Contact email** — in \`script.js\`, the value assigned to \`to\`. Replace it with the client's address.
- **Pages** — add new HTML files and link them in the header/footer navigation.

## Contact form

The form opens the visitor's email app with the message pre-filled. It does **not**
send silently, because there is no backend. To collect submissions properly:

1. Create a free endpoint (Formspree, Getform, Basin, Netlify Forms).
2. Replace the form handler in \`script.js\` with a \`fetch\` POST to that endpoint.
3. Test with a real submission before launch.

## Before delivery

- [ ] Replace all placeholder copy with the client's approved content.
- [ ] Confirm phone, email, address and opening hours.
- [ ] Test on a real phone, not only the browser's responsive mode.
- [ ] Check every link and the map link.
- [ ] Run Lighthouse (Chrome DevTools → Lighthouse) for performance and accessibility.
- [ ] Add analytics only if the client agreed to it.
- [ ] Ask the client to confirm the final content in writing.

## Deploy

See \`docs/deployment.md\` in the portfolio repository. Netlify and Vercel both
accept a folder of static files with no configuration.

## Note on claims

Nothing in this site should promise revenue, rankings or results. Review all copy
with the client and remove any statement they cannot support.
`;

    return {
      presetId,
      presetLabel: preset.label,
      name,
      title: `${name}${city ? ' — ' + city : ''}`,
      html,
      css,
      js,
      readme,
      preview: html
        .replace('<link rel="stylesheet" href="styles.css" />', `<style>${css}</style>`)
        .replace('<script src="script.js"></script>', `<script>${js}</script>`),
    };
  }

  return { PRESETS, build };
})();
