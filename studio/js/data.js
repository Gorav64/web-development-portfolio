/* Studio reference data: statuses, categories, pricing estimates, email templates. */
window.StudioData = (() => {
  'use strict';

  const LEAD_STATUSES = [
    { id: 'new', label: 'New', tone: 'tone-new' },
    { id: 'contacted', label: 'Contacted', tone: 'tone-contacted' },
    { id: 'replied', label: 'Replied', tone: 'tone-replied' },
    { id: 'interested', label: 'Interested', tone: 'tone-interested' },
    { id: 'proposal', label: 'Proposal sent', tone: 'tone-proposal' },
    { id: 'won', label: 'Won', tone: 'tone-won' },
    { id: 'completed', label: 'Completed', tone: 'tone-completed' },
    { id: 'lost', label: 'Not a fit', tone: 'tone-lost' },
  ];

  const PROJECT_STATUSES = [
    { id: 'new-inquiry', label: 'New inquiry', tone: 'tone-new' },
    { id: 'discussion', label: 'Discussion', tone: 'tone-contacted' },
    { id: 'proposal-sent', label: 'Proposal sent', tone: 'tone-proposal' },
    { id: 'negotiation', label: 'Negotiation', tone: 'tone-interested' },
    { id: 'confirmed', label: 'Confirmed', tone: 'tone-replied' },
    { id: 'in-development', label: 'In development', tone: 'tone-interested' },
    { id: 'testing', label: 'Testing', tone: 'tone-replied' },
    { id: 'delivered', label: 'Delivered', tone: 'tone-completed' },
    { id: 'completed', label: 'Completed', tone: 'tone-won' },
  ];

  const COUNTRIES = [
    'United States',
    'United Kingdom',
    'Canada',
    'Australia',
    'New Zealand',
    'Ireland',
    'Germany',
    'Netherlands',
    'United Arab Emirates',
    'Singapore',
    'Other',
  ];

  const CATEGORIES = [
    'Restaurant',
    'Cafe',
    'Gym',
    'Fitness studio',
    'Real estate agency',
    'Salon',
    'Consultant',
    'Local service provider',
    'Small business',
    'Startup',
    'Other',
  ];

  const PROJECT_TYPES = [
    { id: 'landing-page', label: 'Landing page', base: 300, days: 5, pages: 1 },
    { id: 'business-website', label: 'Business website', base: 650, days: 10, pages: 4 },
    { id: 'restaurant-website', label: 'Restaurant website', base: 600, days: 9, pages: 4 },
    { id: 'gym-website', label: 'Gym / fitness website', base: 620, days: 9, pages: 4 },
    { id: 'real-estate-website', label: 'Real estate website', base: 700, days: 11, pages: 4 },
    { id: 'saas-landing', label: 'SaaS landing page', base: 800, days: 12, pages: 1 },
    { id: 'portfolio-website', label: 'Personal portfolio', base: 350, days: 6, pages: 3 },
    { id: 'startup-website', label: 'Startup website', base: 750, days: 11, pages: 4 },
    { id: 'agency-website', label: 'Agency website', base: 900, days: 12, pages: 5 },
    { id: 'redesign', label: 'Website redesign', base: 550, days: 9, pages: 4 },
    { id: 'figma-to-code', label: 'Figma to website', base: 450, days: 7, pages: 1 },
    { id: 'frontend', label: 'Frontend development', base: 400, days: 6, pages: 1 },
  ];

  const FEATURES = [
    { id: 'api', label: 'API integration', price: 120 },
    { id: 'animations', label: 'Advanced animations', price: 80 },
    { id: 'seo', label: 'On-page SEO setup', price: 70 },
    { id: 'analytics', label: 'Analytics setup', price: 40 },
    { id: 'booking', label: 'Booking / calendar embed', price: 80 },
    { id: 'multilang', label: 'Second language', price: 120 },
    { id: 'speed', label: 'Speed optimization pass', price: 90 },
    { id: 'copy', label: 'Copy polishing', price: 60 },
  ];

  const PRICING = {
    pagePrice: 70,
    rushFee: 0.25,
    extraRevisionPrice: 60,
    standardRevisions: 2,
    currencies: {
      USD: { symbol: '$', rate: 1, label: 'US Dollar' },
      GBP: { symbol: '£', rate: 0.79, label: 'British Pound' },
      EUR: { symbol: '€', rate: 0.92, label: 'Euro' },
      AUD: { symbol: 'A$', rate: 1.52, label: 'Australian Dollar' },
      CAD: { symbol: 'C$', rate: 1.37, label: 'Canadian Dollar' },
      INR: { symbol: '₹', rate: 84, label: 'Indian Rupee' },
    },
  };

  /* ------------------------------------------------------------------
     Email templates.
     Every template leaves the specific observation in the freelancer's
     hands — nothing is invented automatically. Drafts only, never sent.
     ------------------------------------------------------------------ */

  const firstName = (lead) => {
    const contact = (lead.contactName || '').trim();
    return contact ? contact.split(/\s+/)[0] : 'there';
  };

  const clean = (text) => text.trim().replace(/[.;,\s]+$/, '');

  const observation = (lead, fallback) =>
    clean(lead.problems || '') || fallback;

  const improvement = (lead, fallback) =>
    clean(lead.improvements || '') || fallback;

  const siteLabel = (lead) =>
    (lead.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '') || lead.business;

  const signoff = (settings) => {
    const name = settings.ownerName || 'Your Name';
    const email = settings.email || 'your@email.com';
    const site = settings.portfolioUrl || '';
    return `${name}\n${site ? site + '\n' : ''}${email}`;
  };

  const TEMPLATES = [
    {
      id: 'no-website',
      label: 'No website yet',
      when: 'Business has no official site, or only a social page.',
      subject: (lead) => `A website idea for ${lead.business}`,
      body: (lead, settings) =>
`Hi ${firstName(lead)},

I came across ${lead.business} while looking at ${lead.category.toLowerCase()} businesses in ${lead.country} — ${observation(lead, '[add one genuine, specific observation about the business from your research]')}.

I noticed there doesn't seem to be a website for ${lead.business} yet. A simple, fast site would give people one reliable place to see what you offer, your hours and how to get in touch.

I'm a web developer and I build clean, mobile-friendly websites for small businesses. If it's useful, I can put together a short, no-obligation homepage concept so you can see what it could look like before deciding anything.

Would that be worth a look?

Best regards,
${signoff(settings)}`,
    },
    {
      id: 'outdated',
      label: 'Outdated website',
      when: 'Site exists but looks dated or is hard to use on mobile.',
      subject: (lead) => `A quick note about ${lead.business}'s website`,
      body: (lead, settings) =>
`Hi ${firstName(lead)},

I had a look at ${siteLabel(lead)}'s website and noticed ${observation(lead, '[describe the specific issue you saw — e.g. the menu is hard to read on a phone]')}.

For customers finding you on a phone, that can make it harder to check what you offer and get in touch. A focused refresh — rather than a full rebuild — could fix the parts that matter most without changing the brand you've built.

I'm an independent web developer working on exactly this kind of modernization: same content, cleaner structure, faster on mobile.

I can send a short list of specific fixes with no obligation. Would that be helpful?

Best regards,
${signoff(settings)}`,
    },
    {
      id: 'redesign',
      label: 'Redesign opportunity',
      when: 'Site is functional but the design feels behind the business.',
      subject: (lead) => `${lead.business} — a faster, mobile-first website`,
      body: (lead, settings) =>
`Hi ${firstName(lead)},

I was looking at ${lead.business} online and thought the business comes across better than the website does. ${observation(lead, '[mention one concrete design or UX issue you observed]')}.

I redesign small-business websites with a focus on three things: clear structure, a strong mobile experience and fast loading. ${improvement(lead, '[name the specific improvement you would make first]')}.

I could prepare a redesigned homepage concept for ${lead.business} — one page, your real content — so you can compare it side by side with what you have now.

If you'd like to see it, just reply and I'll get started.

Best regards,
${signoff(settings)}`,
    },
    {
      id: 'landing-page',
      label: 'Landing page offer',
      when: 'Business runs ads or promotions and lacks a focused page.',
      subject: (lead) => `A landing page idea for ${lead.business}`,
      body: (lead, settings) =>
`Hi ${firstName(lead)},

I noticed ${lead.business} is active on social media${lead.notes ? ` — ${lead.notes.trim()}` : ''}, but there's no single page that explains your offer and captures enquiries in one place.

A focused landing page — headline, offer, proof, hours/location and one call to action — is often the fastest way to turn interest into bookings or calls. ${improvement(lead, '[suggest the specific offer or angle you would build the page around]')}.

I build lightweight landing pages in HTML, CSS and JavaScript: fast, responsive and easy to update. I can prepare a concept for ${lead.business} if you want to see the direction first.

Would you like me to send a quick draft?

Best regards,
${signoff(settings)}`,
    },
    {
      id: 'follow-up',
      label: 'Follow-up',
      when: 'Sent an initial email 4–7 days ago with no reply.',
      subject: (lead) => `Following up — ${lead.business}`,
      body: (lead, settings) =>
`Hi ${firstName(lead)},

Just following up on my note about ${lead.business}'s website. I know inboxes get busy, so no pressure at all.

If a quick homepage concept would still be useful, I'm happy to prepare one — no obligation and nothing to sign. If the timing isn't right, just let me know and I'll close the loop.

Either way, wishing ${lead.business} a good week.

Best regards,
${signoff(settings)}`,
    },
  ];

  const OUTREACH_RULES = [
    'Send one email per business, personalized with something only you could have noticed.',
    'Draft first, review every word, and send only from your own email account.',
    'Never invent a problem with their site — look at it first and describe what you actually saw.',
    'No attachments on the first email, no tracking pixels, no fake urgency.',
    'One follow-up only, 4–7 days later. If there is no reply, stop.',
    'Respect opt-outs immediately and keep a do-not-contact note on the lead.',
    'Check local rules before cold outreach (for example GDPR/PECR in the UK/EU, CAN-SPAM in the US, CASL in Canada).',
  ];

  const DEMO_LEADS = [
    {
      id: 'demo-lead-1',
      business: 'Sample: Riverside Café',
      country: 'United Kingdom',
      category: 'Cafe',
      website: '',
      email: 'hello@example.com',
      phone: '',
      status: 'new',
      followUpAt: '',
      problems: '',
      improvements: '',
      opportunity: 'Simple one-page site with menu, hours and directions.',
      notes: 'Fictional sample record used to preview the dashboard. Delete it before real work.',
      source: 'Sample data',
      demo: true,
      outreach: [],
      createdAt: '2026-01-05T10:00:00.000Z',
      updatedAt: '2026-01-05T10:00:00.000Z',
    },
    {
      id: 'demo-lead-2',
      business: 'Sample: Ironline Gym',
      country: 'United States',
      category: 'Gym',
      website: 'https://example.com',
      email: 'info@example.com',
      phone: '',
      status: 'contacted',
      followUpAt: '2026-01-12',
      problems: 'Class schedule is a PDF on a page that is hard to read on a phone.',
      improvements: 'Replace the PDF with a responsive timetable and a clear trial sign-up.',
      opportunity: 'Redesign the homepage and add a class timetable page.',
      notes: 'Fictional sample record. Shows how research notes are stored.',
      source: 'Sample data',
      demo: true,
      outreach: [],
      createdAt: '2026-01-06T10:00:00.000Z',
      updatedAt: '2026-01-07T10:00:00.000Z',
    },
    {
      id: 'demo-lead-3',
      business: 'Sample: Northgate Realty',
      country: 'Canada',
      category: 'Real estate agency',
      website: '',
      email: 'contact@example.com',
      phone: '',
      status: 'interested',
      followUpAt: '2026-01-15',
      problems: '',
      improvements: '',
      opportunity: 'Listings landing page with enquiry form.',
      notes: 'Fictional sample record. Reply received in the demo story — not a real conversation.',
      source: 'Sample data',
      demo: true,
      outreach: [],
      createdAt: '2026-01-08T10:00:00.000Z',
      updatedAt: '2026-01-09T10:00:00.000Z',
    },
  ];

  const DEMO_PROJECTS = [
    {
      id: 'demo-project-1',
      name: 'Sample: Gym homepage redesign',
      client: 'Sample: Ironline Gym',
      leadId: 'demo-lead-2',
      status: 'in-development',
      deadline: '2026-02-10',
      budget: 650,
      currency: 'USD',
      paid: false,
      tasks: [
        { id: 't1', label: 'Discovery notes', done: true },
        { id: 't2', label: 'Homepage wireframe', done: true },
        { id: 't3', label: 'Responsive build', done: false },
        { id: 't4', label: 'Timetable page', done: false },
        { id: 't5', label: 'Cross-device testing', done: false },
      ],
      approvals: [
        { id: 'a1', label: 'Homepage design', status: 'approved', at: '2026-01-11' },
        { id: 'a2', label: 'Final delivery', status: 'pending', at: '' },
      ],
      notes: 'Fictional sample project for previewing the project board.',
      demo: true,
      createdAt: '2026-01-10T10:00:00.000Z',
      updatedAt: '2026-01-12T10:00:00.000Z',
    },
  ];

  return {
    LEAD_STATUSES,
    PROJECT_STATUSES,
    COUNTRIES,
    CATEGORIES,
    PROJECT_TYPES,
    FEATURES,
    PRICING,
    TEMPLATES,
    OUTREACH_RULES,
    DEMO_LEADS,
    DEMO_PROJECTS,
  };
})();
