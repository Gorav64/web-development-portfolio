/* Studio app — views, forms and local-first workflows. No network calls. */
(() => {
  'use strict';

  const D = window.StudioData;
  const S = window.StudioStore;
  const G = window.SiteGen;

  const $ = (selector, ctx = document) => ctx.querySelector(selector);
  const $$ = (selector, ctx = document) => Array.from(ctx.querySelectorAll(selector));

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));

  const todayISO = () => new Date().toISOString().slice(0, 10);

  const fmtDate = (iso) => {
    if (!iso) return '—';
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isOverdue = (iso) => {
    if (!iso) return false;
    return new Date(`${iso}T00:00:00`) < new Date(new Date().toDateString());
  };

  const safeUrl = (value) => {
    const url = String(value || '').trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (/^[a-z0-9.-]+\.[a-z]{2,}/i.test(url)) return `https://${url}`;
    return '';
  };

  const currency = (code) => D.PRICING.currencies[code] || D.PRICING.currencies.USD;

  const fmtMoney = (amount, code = 'USD') => {
    const c = currency(code);
    return `${c.symbol}${Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const convert = (inr, code = 'INR') => Math.round(Number(inr || 0) * currency(code).rate);

  const option = (value, label, selected) =>
    `<option value="${esc(value)}"${value === selected ? ' selected' : ''}>${esc(label)}</option>`;

  const optionsFrom = (list, selected) => list.map((item) => {
    const value = typeof item === 'string' ? item : item.id;
    const label = typeof item === 'string' ? item : item.label;
    return option(value, label, selected);
  }).join('');

  const pill = (list, id) => {
    const meta = list.find((item) => item.id === id) || { label: id || 'Unknown', tone: 'tone-neutral' };
    return `<span class="status-pill ${meta.tone}">${esc(meta.label)}</span>`;
  };

  const ui = {
    view: 'overview',
    leadQuery: '',
    leadCountry: '',
    leadCategory: '',
    leadStatus: '',
    projectFilter: '',
    outreach: { leadId: '', templateId: 'no-website', subject: '', body: '', generatedFor: '' },
    proposal: {
      leadId: '', client: '', typeId: 'business-website', pages: 4,
      features: [], rush: false, currency: 'USD', notes: '', result: null,
    },
    builder: { brief: null, result: null },
  };

  /* ------------------------------------------------------------------
     Helpers: toast, modal, downloads
     ------------------------------------------------------------------ */

  let toastTimer = null;
  function toast(message) {
    const el = $('#toast');
    if (!el) return;
    el.innerHTML = message;
    el.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('show'), 4200);
  }

  function openModal(title, html, onMount) {
    const dialog = $('#modal');
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    if (!dialog.open) dialog.showModal();
    if (onMount) onMount($('#modal-body'));
  }

  function closeModal() {
    const dialog = $('#modal');
    if (dialog.open) dialog.close();
  }

  function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = false, onConfirm }) {
    openModal(title, `
      <div class="confirm-body">
        <p>${message}</p>
        <div class="form-actions" style="position:static;margin:0;padding:0;border:0;background:none">
          <button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-action="confirm-yes">${esc(confirmLabel)}</button>
        </div>
      </div>`, (body) => {
      body.querySelector('[data-action="confirm-yes"]').addEventListener('click', () => {
        closeModal();
        onConfirm();
      }, { once: true });
    });
  }

  function download(filename, content, type = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  function emptyState(title, text, actionsHtml = '', icon = '<path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>') {
    return `
      <div class="empty">
        <span class="empty-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg></span>
        <h3>${esc(title)}</h3>
        <p>${text}</p>
        ${actionsHtml ? `<div class="empty-actions">${actionsHtml}</div>` : ''}
      </div>`;
  }

  /* ------------------------------------------------------------------
     Chrome: counts, demo banner, storage meter
     ------------------------------------------------------------------ */

  function updateChrome() {
    const st = S.stats();
    const realLeads = S.leads.filter((lead) => !lead.demo).length;
    const realProjects = S.projects.filter((project) => !project.demo).length;
    $('#count-leads').textContent = String(realLeads);
    $('#count-projects').textContent = String(realProjects);

    const banner = $('#demo-banner');
    banner.hidden = st.demoLeads === 0 && st.demoProjects === 0;

    const bytes = S.storageBytes();
    const kb = bytes / 1024;
    $('#storage-size').textContent = kb < 1 ? `${bytes} B` : `${kb.toFixed(1)} KB`;
    $('#storage-fill').style.width = `${Math.min(100, (bytes / (1024 * 1024)) * 100)}%`;
  }

  /* ------------------------------------------------------------------
     Overview
     ------------------------------------------------------------------ */

  const overviewView = {
    title: 'Overview',
    sub: 'Your pipeline at a glance.',
    actions: () => `<button class="btn btn-primary" data-action="add-lead" aria-label="Add lead" title="Add lead">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span>Add lead</span>
      </button>`,
    render() {
      const st = S.stats();
      const followUps = S.upcomingFollowUps(6);
      const active = S.projects.filter((project) => !project.demo && !['delivered', 'completed'].includes(project.status)).slice(0, 3);
      const maxPipeline = Math.max(1, ...D.LEAD_STATUSES.map((status) => S.leads.filter((lead) => !lead.demo && lead.status === status.id).length));

      const stats = [
        ['Total leads', st.total, 'Real records only'],
        ['New', st.new, 'Not contacted yet'],
        ['Contacted', st.contacted, 'First email sent'],
        ['Replies', st.replied, 'Awaiting your reply'],
        ['Interested', st.interested, 'Warm conversations'],
        ['Proposals sent', st.proposals, 'Awaiting decision'],
        ['Won', st.won, 'Client said yes'],
        ['Completed', st.completed, 'Delivered projects'],
      ];

      return `
        <div class="stat-grid">
          ${stats.map(([label, value, hint]) => `
            <div class="stat-card">
              <div class="stat-label"><span class="stat-dot"></span>${esc(label)}</div>
              <div class="stat-value">${value}</div>
              <div class="stat-hint">${esc(hint)}</div>
            </div>`).join('')}
        </div>

        <div class="overview-grid">
          <div class="stack">
            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Lead pipeline</h2>
                  <p>Counts update as you change lead statuses.</p>
                </div>
                <button class="link-btn" data-view="leads">Open leads →</button>
              </div>
              ${st.total === 0
                ? emptyState('No leads yet', 'Add a business you have researched, or load clearly-labelled sample data to see how the dashboard works.', `
                    <button class="btn btn-primary btn-sm" data-action="add-lead">Add your first lead</button>
                    <button class="btn btn-ghost btn-sm" data-action="load-demo">Load sample data</button>`)
                : `<div class="pipeline-bars">
                    ${D.LEAD_STATUSES.map((status) => {
                      const count = S.leads.filter((lead) => !lead.demo && lead.status === status.id).length;
                      return `
                        <div class="pipeline-row">
                          <span>${esc(status.label)}</span>
                          <div class="pipeline-track"><i style="width:${Math.round((count / maxPipeline) * 100)}%"></i></div>
                          <b>${count}</b>
                        </div>`;
                    }).join('')}
                  </div>`}
            </section>

            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Active projects</h2>
                  <p>${st.activeProjects} in progress.</p>
                </div>
                <button class="link-btn" data-view="projects">Open projects →</button>
              </div>
              ${active.length === 0
                ? `<p class="small muted">No active projects. When a lead says yes, create a project so nothing gets lost.</p>`
                : `<div class="stack">
                    ${active.map((project) => {
                      const done = project.tasks.filter((task) => task.done).length;
                      const total = project.tasks.length || 1;
                      return `
                        <div>
                          <div class="row-between" style="margin-bottom:6px">
                            <strong style="font-size:.84rem;font-weight:500">${esc(project.name)}</strong>
                            ${pill(D.PROJECT_STATUSES, project.status)}
                          </div>
                          <div class="progress-track"><i style="width:${Math.round((done / total) * 100)}%"></i></div>
                          <p class="small muted" style="margin-top:5px">${done} of ${project.tasks.length} tasks · due ${esc(fmtDate(project.deadline))}</p>
                        </div>`;
                    }).join('')}
                  </div>`}
            </section>
          </div>

          <div class="stack">
            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Follow-ups</h2>
                  <p>Overdue first, then upcoming.</p>
                </div>
                <span class="status-pill ${st.followUpsDue ? 'tone-proposal' : 'tone-neutral'}">${st.followUpsDue} due</span>
              </div>
              ${followUps.length === 0
                ? `<p class="small muted">No follow-ups scheduled. Set a follow-up date on a lead after you contact them.</p>`
                : `<div class="followup-list">
                    ${followUps.map((lead) => `
                      <div class="followup-item ${isOverdue(lead.followUpAt) ? 'overdue' : ''}">
                        <span class="followup-date">${esc(fmtDate(lead.followUpAt))}</span>
                        <div class="followup-main">
                          <strong>${esc(lead.business)}</strong>
                          <span>${esc(lead.category)} · ${esc(lead.country)}</span>
                        </div>
                        <button class="btn btn-ghost btn-sm" data-action="edit-lead" data-id="${esc(lead.id)}">Open</button>
                      </div>`).join('')}
                  </div>`}
            </section>

            <section class="panel">
              <div class="panel-head">
                <div>
                  <h2>Start here</h2>
                  <p>A quick path from research to delivery.</p>
                </div>
              </div>
              <div class="stack" style="gap:10px">
                <button class="btn btn-ghost btn-block" data-view="leads">1. Research and add leads</button>
                <button class="btn btn-ghost btn-block" data-view="outreach">2. Draft a personalized email</button>
                <button class="btn btn-ghost btn-block" data-view="proposals">3. Send a proposal after a reply</button>
                <button class="btn btn-ghost btn-block" data-view="builder">4. Build the client website</button>
              </div>
              <p class="small muted" style="margin-top:14px">Studio never sends email or publishes a website. Every action stays under your control.</p>
            </section>
          </div>
        </div>`;
    },
  };

  /* ------------------------------------------------------------------
     Leads
     ------------------------------------------------------------------ */

  function leadForm(lead = {}) {
    const value = (key) => esc(lead[key] || '');
    return `
      <form data-form="lead" data-id="${esc(lead.id || '')}" class="form-grid">
        <div class="field full">
          <label for="lf-business">Business name *</label>
          <input id="lf-business" class="input" name="business" required value="${value('business')}" placeholder="e.g. Riverside Café" />
          <small>Use the name exactly as the business publishes it.</small>
        </div>
        <div class="field">
          <label for="lf-country">Country</label>
          <select id="lf-country" class="select" name="country">${optionsFrom(D.COUNTRIES, lead.country || 'United States')}</select>
        </div>
        <div class="field">
          <label for="lf-category">Category</label>
          <select id="lf-category" class="select" name="category">${optionsFrom(D.CATEGORIES, lead.category || 'Other')}</select>
        </div>
        <div class="field">
          <label for="lf-website">Official website</label>
          <input id="lf-website" class="input" name="website" value="${value('website')}" placeholder="https://example.com" inputmode="url" />
          <small>Leave empty if you could not find an official website.</small>
        </div>
        <div class="field">
          <label for="lf-email">Public business email</label>
          <input id="lf-email" class="input" name="email" type="email" value="${value('email')}" placeholder="hello@business.com" />
          <small>Only an address the business publishes itself.</small>
        </div>
        <div class="field">
          <label for="lf-phone">Public phone</label>
          <input id="lf-phone" class="input" name="phone" value="${value('phone')}" placeholder="+1 555 …" />
        </div>
        <div class="field">
          <label for="lf-contact">Contact person (optional)</label>
          <input id="lf-contact" class="input" name="contactName" value="${value('contactName')}" placeholder="First name used in greetings" />
        </div>
        <div class="field">
          <label for="lf-status">Status</label>
          <select id="lf-status" class="select" name="status">${optionsFrom(D.LEAD_STATUSES, lead.status || 'new')}</select>
        </div>
        <div class="field">
          <label for="lf-followup">Follow-up date</label>
          <input id="lf-followup" class="input" name="followUpAt" type="date" value="${value('followUpAt')}" />
        </div>

        <div class="form-section-title">Research notes</div>

        <div class="field full">
          <label for="lf-problems">Website problems you actually observed</label>
          <textarea id="lf-problems" class="textarea" name="problems" placeholder="e.g. Menu is a PDF that is unreadable on a phone; no opening hours on the homepage.">${value('problems')}</textarea>
          <small>Be specific. This sentence powers the personalized email — never guess.</small>
        </div>
        <div class="field full">
          <label for="lf-improvements">Suggested improvements</label>
          <textarea id="lf-improvements" class="textarea" name="improvements" placeholder="e.g. Replace the PDF with a responsive menu section and add hours + directions above the fold.">${value('improvements')}</textarea>
        </div>
        <div class="field full">
          <label for="lf-opportunity">Service opportunity</label>
          <input id="lf-opportunity" class="input" name="opportunity" value="${value('opportunity')}" placeholder="e.g. Redesign homepage + add a booking section" />
        </div>
        <div class="field full">
          <label for="lf-notes">Private notes</label>
          <textarea id="lf-notes" class="textarea" name="notes" placeholder="Anything useful for the next conversation. Never store passwords or payment details here.">${value('notes')}</textarea>
        </div>

        <div class="form-actions">
          ${lead.id ? `<button type="button" class="btn btn-ghost" data-action="lead-outreach" data-id="${esc(lead.id)}">Draft email</button>` : ''}
          <button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>
          <button type="submit" class="btn btn-primary">${lead.id ? 'Save changes' : 'Add lead'}</button>
        </div>
      </form>`;
  }

  function leadRow(lead) {
    const url = safeUrl(lead.website);
    const st = S.stats();
    return `
      <tr>
        <td data-label="Business">
          <span class="cell-strong">${esc(lead.business)} ${lead.demo ? '<span class="sample-chip">Sample</span>' : ''}</span>
          <span class="cell-sub">${esc(lead.contactName || lead.source || '')}</span>
        </td>
        <td data-label="Country">${esc(lead.country)}</td>
        <td data-label="Category">${esc(lead.category)}</td>
        <td data-label="Website">${url ? `<a class="cell-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(url.replace(/^https?:\/\//, ''))}</a>` : '<span class="cell-muted">No website</span>'}</td>
        <td data-label="Email">${lead.email ? `<a class="cell-link" href="mailto:${esc(lead.email)}">${esc(lead.email)}</a>` : '<span class="cell-muted">—</span>'}</td>
        <td data-label="Status">
          <select class="select status-select ${(D.LEAD_STATUSES.find((s) => s.id === lead.status) || {}).tone || ''}" data-lead-status data-id="${esc(lead.id)}" aria-label="Lead status for ${esc(lead.business)}">
            ${optionsFrom(D.LEAD_STATUSES, lead.status)}
          </select>
        </td>
        <td data-label="Follow-up" class="${isOverdue(lead.followUpAt) && !['won', 'completed', 'lost'].includes(lead.status) ? '' : 'cell-muted'}">
          ${lead.followUpAt ? esc(fmtDate(lead.followUpAt)) : '—'}
        </td>
        <td data-label="Actions">
          <div class="cell-actions">
            <button class="icon-btn" data-action="edit-lead" data-id="${esc(lead.id)}" title="Edit" aria-label="Edit ${esc(lead.business)}">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 13.5-.8 3.3 3.3-.8 8.6-8.6-2.5-2.5-8.6 8.6Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="m12.6 6.4 2.5 2.5" stroke="currentColor" stroke-width="1.4"/></svg>
            </button>
            <button class="icon-btn" data-action="delete-lead" data-id="${esc(lead.id)}" title="Delete" aria-label="Delete ${esc(lead.business)}">
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 6h10M8 6V4.5h4V6M6 6l.6 10h6.8L14 6M8.6 9v4M11.4 9v4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
            </button>
          </div>
        </td>
      </tr>`;
  }

  function filteredLeads() {
    const query = ui.leadQuery.trim().toLowerCase();
    return S.leads.filter((lead) => {
      if (ui.leadCountry && lead.country !== ui.leadCountry) return false;
      if (ui.leadCategory && lead.category !== ui.leadCategory) return false;
      if (ui.leadStatus && lead.status !== ui.leadStatus) return false;
      if (!query) return true;
      return [lead.business, lead.email, lead.website, lead.city, lead.notes, lead.opportunity]
        .some((field) => String(field || '').toLowerCase().includes(query));
    });
  }

  function leadsResultsHtml() {
    const leads = filteredLeads();
    if (S.leads.length === 0) {
      return emptyState('No leads yet', 'Add a business you have researched. Every entry needs a source you can point to.', `
        <button class="btn btn-primary btn-sm" data-action="add-lead">Add your first lead</button>
        <button class="btn btn-ghost btn-sm" data-action="load-demo">Load sample data</button>`,
        '<circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m16 16 4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>');
    }
    if (leads.length === 0) {
      return emptyState('No matches', 'Try a different search term or clear the filters.', `
        <button class="btn btn-ghost btn-sm" data-action="clear-lead-filters">Clear filters</button>`);
    }
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Business</th><th>Country</th><th>Category</th><th>Website</th><th>Email</th><th>Status</th><th>Follow-up</th><th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>${leads.map(leadRow).join('')}</tbody>
        </table>
      </div>
      <p class="small muted" style="margin-top:10px">Showing ${leads.length} of ${S.leads.length} records. Sample records are excluded from dashboard statistics.</p>`;
  }

  const leadsView = {
    title: 'Leads',
    sub: 'Businesses you have researched, with source-backed notes.',
    actions: () => `
      <button class="btn btn-ghost" data-action="export-csv" aria-label="Export leads as CSV" title="Export leads as CSV">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v9M6 8.5l4 4 4-4M4 16h12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>Export CSV</span>
      </button>
      <button class="btn btn-primary" data-action="add-lead" aria-label="Add lead" title="Add lead">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span>Add lead</span>
      </button>`,
    render() {
      return `
        <div class="toolbar">
          <div class="search-wrap">
            <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m13.5 13.5 3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            <input id="lead-search" class="input" type="search" placeholder="Search business, email, website or notes…" value="${esc(ui.leadQuery)}" autocomplete="off" />
          </div>
          <select class="select" id="filter-country" style="width:auto" aria-label="Filter by country">
            ${option('', 'All countries', ui.leadCountry)}
            ${optionsFrom(D.COUNTRIES, ui.leadCountry)}
          </select>
          <select class="select" id="filter-category" style="width:auto" aria-label="Filter by category">
            ${option('', 'All categories', ui.leadCategory)}
            ${optionsFrom(D.CATEGORIES, ui.leadCategory)}
          </select>
          <select class="select" id="filter-status" style="width:auto" aria-label="Filter by status">
            ${option('', 'All statuses', ui.leadStatus)}
            ${optionsFrom(D.LEAD_STATUSES, ui.leadStatus)}
          </select>
        </div>
        <div id="leads-results">${leadsResultsHtml()}</div>`;
    },
    mount() {
      const search = $('#lead-search');
      if (search && ui.leadQuery) {
        search.focus();
        search.setSelectionRange(search.value.length, search.value.length);
      }
    },
  };

  function refreshLeadResults() {
    const container = $('#leads-results');
    if (container) container.innerHTML = leadsResultsHtml();
  }

  /* ------------------------------------------------------------------
     Projects
     ------------------------------------------------------------------ */

  function projectForm(project = {}) {
    const value = (key) => esc(project[key] || '');
    const leadOptions = [option('', 'Not linked to a lead', project.leadId || '')]
      .concat(S.leads.map((lead) => option(lead.id, `${lead.business}${lead.demo ? ' (sample)' : ''}`, project.leadId)))
      .join('');

    const taskRows = (project.tasks || []).map((task) => `
      <div class="edit-row" data-edit-row data-task-row data-id="${esc(task.id)}">
        <input type="checkbox" data-task-done ${task.done ? 'checked' : ''} aria-label="Task done" />
        <input class="input" data-task-label value="${esc(task.label)}" placeholder="Task" />
        <button type="button" class="icon-btn" data-action="remove-row" aria-label="Remove task">×</button>
      </div>`).join('');

    const approvalRows = (project.approvals || []).map((item) => `
      <div class="edit-row" data-edit-row data-approval-row data-id="${esc(item.id)}">
        <input class="input" data-approval-label value="${esc(item.label)}" placeholder="Approval" />
        <select class="select" data-approval-status aria-label="Approval status">
          ${option('pending', 'Pending', item.status)}
          ${option('approved', 'Approved', item.status)}
        </select>
        <button type="button" class="icon-btn" data-action="remove-row" aria-label="Remove approval">×</button>
      </div>`).join('');

    return `
      <form data-form="project" data-id="${esc(project.id || '')}" class="form-grid">
        <div class="field full">
          <label for="pf-name">Project name *</label>
          <input id="pf-name" class="input" name="name" required value="${value('name')}" placeholder="e.g. Café homepage redesign" />
        </div>
        <div class="field">
          <label for="pf-client">Client name</label>
          <input id="pf-client" class="input" name="client" value="${value('client')}" placeholder="Business or contact name" />
        </div>
        <div class="field">
          <label for="pf-lead">Linked lead</label>
          <select id="pf-lead" class="select" name="leadId">${leadOptions}</select>
        </div>
        <div class="field">
          <label for="pf-status">Status</label>
          <select id="pf-status" class="select" name="status">${optionsFrom(D.PROJECT_STATUSES, project.status || 'new-inquiry')}</select>
        </div>
        <div class="field">
          <label for="pf-deadline">Deadline</label>
          <input id="pf-deadline" class="input" name="deadline" type="date" value="${value('deadline')}" />
        </div>
        <div class="field">
          <label for="pf-budget">Agreed budget</label>
          <input id="pf-budget" class="input" name="budget" type="number" min="0" step="1" value="${project.budget || ''}" placeholder="0" />
        </div>
        <div class="field">
          <label for="pf-currency">Currency</label>
          <select id="pf-currency" class="select" name="currency">${optionsFrom(Object.keys(D.PRICING.currencies), project.currency || 'USD')}</select>
        </div>

        <div class="form-section-title">Task checklist</div>
        <div class="field full">
          <div class="stack" id="task-rows">${taskRows || '<p class="small muted">No tasks yet.</p>'}</div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="add-task-row" style="align-self:flex-start">+ Add task</button>
        </div>

        <div class="form-section-title">Approvals</div>
        <div class="field full">
          <div class="stack" id="approval-rows">${approvalRows || '<p class="small muted">No approvals tracked.</p>'}</div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="add-approval-row" style="align-self:flex-start">+ Add approval</button>
        </div>

        <div class="field full">
          <label for="pf-notes">Notes</label>
          <textarea id="pf-notes" class="textarea" name="notes" placeholder="Scope changes, client feedback, delivery notes.">${value('notes')}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>
          <button type="submit" class="btn btn-primary">${project.id ? 'Save project' : 'Create project'}</button>
        </div>
      </form>`;
  }

  function projectCard(project) {
    const total = project.tasks.length;
    const done = project.tasks.filter((task) => task.done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const pendingApprovals = project.approvals.filter((item) => item.status !== 'approved').length;

    return `
      <article class="project-card">
        <div class="project-top">
          <div style="flex:1;min-width:0">
            <h3>${esc(project.name)} ${project.demo ? '<span class="sample-chip">Sample</span>' : ''}</h3>
            <div class="project-client">${esc(project.client || 'No client name')}</div>
          </div>
          <select class="select status-select ${(D.PROJECT_STATUSES.find((s) => s.id === project.status) || {}).tone || ''}"
            data-project-status data-id="${esc(project.id)}" aria-label="Project status">
            ${optionsFrom(D.PROJECT_STATUSES, project.status)}
          </select>
        </div>

        <div class="progress">
          <div class="progress-labels"><span>Development progress</span><span>${done}/${total || 0} tasks</span></div>
          <div class="progress-track"><i style="width:${pct}%"></i></div>
        </div>

        <div class="project-meta">
          <span>Due <strong>${esc(fmtDate(project.deadline))}</strong></span>
          <span>Budget <strong>${project.budget ? fmtMoney(project.budget, project.currency) : '—'}</strong></span>
          <span>Approvals <strong>${pendingApprovals} pending</strong></span>
        </div>

        ${project.tasks.length ? `
          <ul class="task-preview">
            ${project.tasks.slice(0, 4).map((task) => `
              <li class="${task.done ? 'done' : ''}">
                <button type="button" class="task-dot" data-action="toggle-task" data-id="${esc(project.id)}" data-task="${esc(task.id)}" aria-pressed="${task.done}" aria-label="Toggle ${esc(task.label)}">✓</button>
                <span>${esc(task.label)}</span>
              </li>`).join('')}
            ${project.tasks.length > 4 ? `<li class="small muted">+ ${project.tasks.length - 4} more</li>` : ''}
          </ul>` : '<p class="small muted">No tasks yet.</p>'}

        <div class="project-foot">
          ${project.paid ? '<span class="paid-badge">Paid</span>' : '<span class="unpaid-badge">Payment pending</span>'}
          <span style="flex:1"></span>
          <button class="btn btn-ghost btn-sm" data-action="edit-project" data-id="${esc(project.id)}">Edit</button>
          ${project.paid
            ? `<button class="btn btn-ghost btn-sm" data-action="mark-unpaid" data-id="${esc(project.id)}">Mark unpaid</button>`
            : `<button class="btn btn-ghost btn-sm" data-action="mark-paid" data-id="${esc(project.id)}">Mark paid</button>`}
          <button class="btn btn-danger btn-sm" data-action="delete-project" data-id="${esc(project.id)}">Delete</button>
        </div>
      </article>`;
  }

  const projectsView = {
    title: 'Projects',
    sub: 'Delivery status, tasks and payments in one place.',
    actions: () => `<button class="btn btn-primary" data-action="add-project" aria-label="New project" title="New project">
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span>New project</span>
      </button>`,
    render() {
      const filtered = ui.projectFilter
        ? S.projects.filter((project) => project.status === ui.projectFilter)
        : S.projects;

      const st = S.stats();

      return `
        <div class="stat-grid stat-grid-3">
          <div class="stat-card"><div class="stat-label"><span class="stat-dot"></span>Active projects</div><div class="stat-value">${st.activeProjects}</div><div class="stat-hint">Not yet delivered</div></div>
          <div class="stat-card"><div class="stat-label"><span class="stat-dot"></span>Delivered</div><div class="stat-value">${st.deliveredProjects}</div><div class="stat-hint">Delivered or completed</div></div>
          <div class="stat-card"><div class="stat-label"><span class="stat-dot"></span>Unpaid</div><div class="stat-value">${S.projects.filter((p) => !p.demo && !p.paid && p.budget > 0).length}</div><div class="stat-hint">Confirm payments yourself</div></div>
        </div>

        <div class="toolbar">
          <select class="select" id="project-filter" style="width:auto" aria-label="Filter projects by status">
            ${option('', 'All project statuses', ui.projectFilter)}
            ${optionsFrom(D.PROJECT_STATUSES, ui.projectFilter)}
          </select>
          <span class="spacer"></span>
          <span class="small muted">${filtered.length} shown</span>
        </div>

        ${S.projects.length === 0
          ? emptyState('No projects yet', 'Projects appear here once a lead becomes a client. Create one manually at any time.', `
              <button class="btn btn-primary btn-sm" data-action="add-project">Create a project</button>`)
          : filtered.length === 0
            ? emptyState('No projects with that status', 'Choose another status filter.', '')
            : `<div class="project-grid">${filtered.map(projectCard).join('')}</div>`}`;
    },
  };

  /* ------------------------------------------------------------------
     Outreach
     ------------------------------------------------------------------ */

  const outreachView = {
    title: 'Outreach',
    sub: 'Draft personalized emails. Studio never sends anything.',
    actions: () => '',
    render() {
      const leads = S.leads;
      const selected = leads.find((lead) => lead.id === ui.outreach.leadId) || null;
      const template = D.TEMPLATES.find((item) => item.id === ui.outreach.templateId) || D.TEMPLATES[0];

      const leadOptions = leadOptionsFor(ui.outreach.leadId);

      const summary = selected ? `
        <div class="panel" style="padding:14px;background:rgba(255,255,255,.02)">
          <div class="row-between" style="margin-bottom:6px">
            <strong style="font-size:.86rem">${esc(selected.business)}</strong>
            ${pill(D.LEAD_STATUSES, selected.status)}
          </div>
          <p class="small muted">${esc(selected.category)} · ${esc(selected.country)}</p>
          <p class="small" style="margin-top:8px">
            ${selected.website ? `<a class="cell-link" href="${esc(safeUrl(selected.website))}" target="_blank" rel="noopener noreferrer">${esc(selected.website)}</a>` : '<span class="muted">No website on record</span>'}
          </p>
          <p class="small">${selected.email ? `<a class="cell-link" href="mailto:${esc(selected.email)}">${esc(selected.email)}</a>` : '<span class="muted">No email on record — add one before drafting.</span>'}</p>
          ${selected.problems ? `<p class="small" style="margin-top:8px"><strong style="color:var(--text-soft)">Observed:</strong> ${esc(selected.problems)}</p>` : ''}
        </div>` : '';

      const draft = ui.outreach.subject || ui.outreach.body;

      return `
        <div class="tool-grid">
          <div class="stack">
            <section class="panel">
              <div class="panel-head">
                <div><h2>Compose</h2><p>Personalize, review, then send from your own inbox.</p></div>
              </div>
              <form data-form="outreach" class="stack">
                <div class="field">
                  <label for="outreach-lead">Lead</label>
                  <select id="outreach-lead" class="select" name="leadId">
                    ${option('', 'Select a lead…', ui.outreach.leadId)}
                    ${leadOptions}
                  </select>
                </div>
                ${summary}
                <div class="field">
                  <label for="outreach-template">Template</label>
                  <select id="outreach-template" class="select" name="templateId">
                    ${optionsFrom(D.TEMPLATES, ui.outreach.templateId)}
                  </select>
                  <small>${esc(template.when)}</small>
                </div>
                <button type="submit" class="btn btn-primary btn-block" ${selected ? '' : 'disabled'}>Generate draft</button>
              </form>
            </section>

            <section class="panel">
              <div class="panel-head"><div><h2>Send responsibly</h2><p>Rules that keep you out of spam folders.</p></div></div>
              <ol class="stack" style="gap:9px;font-size:.76rem;color:var(--muted);list-style:decimal;padding-left:18px">
                ${D.OUTREACH_RULES.map((rule) => `<li>${esc(rule)}</li>`).join('')}
              </ol>
            </section>
          </div>

          <div class="stack" id="outreach-output">
            ${draft ? `
              <section class="panel email-output">
                <div class="panel-head">
                  <div><h2>Email draft</h2><p>Edit anything before copying or opening it in your mail app.</p></div>
                  ${selected ? pill(D.LEAD_STATUSES, selected.status) : ''}
                </div>

                <div class="warn-note">
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3 2.5 16.5h15L10 3Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M10 8v3.5M10 14v.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                  <span>Drafts only. Nothing is sent from Studio. Replace every [bracketed] prompt with a real observation, then review in your own email client.</span>
                </div>

                <div class="field">
                  <label for="email-subject">Subject</label>
                  <input id="email-subject" class="input" value="${esc(ui.outreach.subject)}" />
                </div>
                <div class="field">
                  <label for="email-body">Body</label>
                  <textarea id="email-body" class="textarea" rows="18">${esc(ui.outreach.body)}</textarea>
                </div>

                <div class="row">
                  <button class="btn btn-ghost btn-sm" data-action="copy-email">Copy draft</button>
                  <button class="btn btn-ghost btn-sm" data-action="open-mail" ${selected && selected.email ? '' : 'disabled'}>Open in email app</button>
                  <button class="btn btn-ghost btn-sm" data-action="log-outreach" ${selected ? '' : 'disabled'}>Log draft &amp; mark contacted</button>
                </div>
                <p class="small muted" style="margin-top:2px">“Open in email app” uses your device's mail client. You still review and press send yourself.</p>
              </section>

              ${selected && selected.outreach.length ? `
                <section class="panel">
                  <div class="panel-head"><div><h2>Draft history</h2><p>${selected.outreach.length} logged for this lead.</p></div></div>
                  <div>
                    ${selected.outreach.map((entry) => `
                      <div class="activity-item">
                        <span class="activity-dot"></span>
                        <div>
                          <p>${esc(entry.subject || '(no subject)')}</p>
                          <small>${esc(new Date(entry.at).toLocaleString())} · ${esc(entry.template || 'template')}</small>
                        </div>
                      </div>`).join('')}
                  </div>
                </section>` : ''}
            ` : emptyState(
              'No draft yet',
              leads.length === 0
                ? 'Add a lead first, then generate a personalized draft from the research notes.'
                : 'Choose a lead and a template, then generate a draft. You will be able to edit every line before sending.',
              leads.length === 0 ? '<button class="btn btn-primary btn-sm" data-action="add-lead">Add a lead</button>' : '',
              '<rect x="3" y="5" width="18" height="14" rx="2.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m4 7.5 8 5.5 8-5.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'
            )}
          </div>
        </div>`;
    },
  };

  function leadOptionsFor(selectedId) {
    return S.leads.map((lead) => option(lead.id, `${lead.business}${lead.demo ? ' (sample)' : ''} — ${lead.country}`, selectedId)).join('');
  }

  function buildEmailDraft() {
    const lead = S.getLead(ui.outreach.leadId);
    const template = D.TEMPLATES.find((item) => item.id === ui.outreach.templateId);
    if (!lead || !template) {
      toast('<strong>Select a lead</strong> before generating a draft.');
      return false;
    }
    ui.outreach.subject = template.subject(lead, S.settings);
    ui.outreach.body = template.body(lead, S.settings);
    ui.outreach.generatedFor = lead.id;
    return true;
  }

  /* ------------------------------------------------------------------
     Proposals
     ------------------------------------------------------------------ */

  function computeProposal(input) {
    const type = D.PROJECT_TYPES.find((item) => item.id === input.typeId) || D.PROJECT_TYPES[1];
    const pages = Math.max(1, Math.min(20, Number(input.pages) || type.pages));
    const extraPages = Math.max(0, pages - type.pages);
    const pageCost = extraPages * D.PRICING.pagePrice;
    const features = D.FEATURES.filter((feature) => input.features.includes(feature.id));
    const featureCost = features.reduce((sum, feature) => sum + feature.price, 0);
    const base = type.base;
    const subtotal = base + pageCost + featureCost;
    const rushFee = input.rush ? Math.round(subtotal * D.PRICING.rushFee) : 0;
    const totalInr = subtotal + rushFee;
    const days = input.rush ? Math.ceil((type.days + extraPages * 2) * 0.7) : type.days + extraPages * 2;
    const milestones = totalInr >= 25000 ? [40, 40, 20] : [50, 50];

    return {
      type,
      pages,
      extraPages,
      pageCost,
      features,
      featureCost,
      base,
      subtotal,
      rushFee,
      totalInr,
      totalUsd: convert(totalInr, 'USD'),
      total: convert(totalInr, input.currency),
      currency: input.currency,
      days,
      milestones,
      rush: input.rush,
      client: input.client.trim() || 'Your client',
      notes: input.notes.trim(),
      date: todayISO(),
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      revisions: D.PRICING.standardRevisions,
    };
  }

  function proposalPaper(result) {
    const c = currency(result.currency);
    const money = (inr) => `${c.symbol}${convert(inr, result.currency).toLocaleString('en-US')}`;
    const owner = S.settings;
    const lineItems = [
      [`${result.type.label} — ${result.pages} page${result.pages > 1 ? 's' : ''}`, result.base],
      ...(result.extraPages ? [[`Additional pages (${result.extraPages})`, result.pageCost]] : []),
      ...result.features.map((feature) => [feature.label, feature.price]),
      ...(result.rush ? [['Priority delivery (25%)', result.rushFee]] : []),
    ];

    const scope = [
      `${result.pages} responsive page${result.pages > 1 ? 's' : ''}, designed for mobile, tablet and desktop`,
      'Semantic HTML, modern CSS and vanilla JavaScript',
      'Working navigation, contact form and interactive states',
      'Basic on-page SEO: titles, meta descriptions, heading structure',
      'Cross-browser checks and testing at real phone, tablet and desktop sizes',
      'Source files and a short handover document',
    ];
    if (result.features.length) {
      scope.push(...result.features.map((feature) => feature.label));
    }

    return `
      <article class="paper" id="proposal-paper">
        <div class="paper-brand">
          <div>
            <h1>Website proposal</h1>
            <small>Prepared for ${esc(result.client)}</small>
          </div>
          <div style="text-align:right">
            <small><strong>${esc(owner.ownerName || 'Your Name')}</strong></small>
            <small>${esc(owner.email || '')}</small>
            ${owner.portfolioUrl ? `<small>${esc(owner.portfolioUrl)}</small>` : ''}
          </div>
        </div>

        <div class="paper-meta">
          <div><span>Date</span><br>${esc(fmtDate(result.date))}</div>
          <div><span>Valid until</span><br>${esc(fmtDate(result.validUntil))}</div>
          <div><span>Project type</span><br>${esc(result.type.label)}</div>
          <div><span>Estimated timeline</span><br>${result.days} calendar days</div>
        </div>

        <h3>Overview</h3>
        <p>${esc(result.client)} needs a ${esc(result.type.label.toLowerCase())} that is clear for visitors, fast on a phone and easy to maintain. This proposal covers design adaptation, responsive development, testing and handover.</p>
        ${result.notes ? `<p>${esc(result.notes).replace(/\n/g, '<br>')}</p>` : ''}

        <h3>Scope of work</h3>
        <ul>${scope.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>

        <h3>Not included</h3>
        <ul>
          <li>Domain registration, hosting fees and third-party paid services</li>
          <li>Paid plugins, fonts, stock photography or booking subscriptions</li>
          <li>Content writing beyond light polishing of supplied copy</li>
          <li>Ongoing maintenance, unless agreed separately</li>
          <li>New brand identity, logo design or photography</li>
          <li>Taxes, bank charges and payment-processing fees</li>
        </ul>

        <h3>Investment <span class="est-badge">Estimate</span></h3>
        <table>
          <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            ${lineItems.map(([label, usd]) => `<tr><td>${esc(label)}</td><td style="text-align:right">${money(usd)}</td></tr>`).join('')}
            <tr class="total-row"><td>Total (${esc(result.currency)})</td><td style="text-align:right">${c.symbol}${result.total.toLocaleString('en-US')}</td></tr>
          </tbody>
        </table>
        <p style="font-size:.8rem;color:#6b6186">Base price in INR: <strong>${fmtMoney(result.totalInr, 'INR')}</strong> · approximate USD: <strong>${fmtMoney(result.totalUsd, 'USD')}</strong> at ₹${D.PRICING.planningRate}/USD. Domain, hosting, paid assets, transaction fees and taxes are extra. USD is indicative; the agreed invoice currency governs payment. This is an estimate confirmed after the discovery call and content review.</p>

        <h3>Payment milestones</h3>
        <table>
          <thead><tr><th>Milestone</th><th style="text-align:right">Share</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            ${result.milestones.map((share, index) => `
              <tr>
                <td>${index === 0 ? 'Deposit — project start' : index === 1 && result.milestones.length === 3 ? 'Design & development milestone' : 'Final delivery'}</td>
                <td style="text-align:right">${share}%</td>
                <td style="text-align:right">${c.symbol}${Math.round((result.total * share) / 100).toLocaleString('en-US')}</td>
              </tr>`).join('')}
          </tbody>
        </table>

        <h3>Timeline</h3>
        <p>Estimated ${result.days} calendar days from the date content and access are provided${result.rush ? ', with priority scheduling' : ''}. Delays in feedback or content will shift the delivery date accordingly.</p>

        <h3>Revisions</h3>
        <p>${result.revisions} rounds of revisions are included during design and build. Additional rounds are ${fmtMoney(convert(D.PRICING.extraRevisionPrice, result.currency), result.currency)} each. Revision requests are collected in one consolidated list per round.</p>

        <h3>Next steps</h3>
        <ol>
          <li>Confirm the scope and answer any open questions.</li>
          <li>Sign off on this estimate and pay the first milestone.</li>
          <li>Share content, brand assets and access details.</li>
          <li>Kick-off call and first design direction.</li>
        </ol>

        <div class="paper-foot">
          Prepared by ${esc(owner.ownerName || 'Your Name')} · ${esc(owner.email || '')}${owner.portfolioUrl ? ' · ' + esc(owner.portfolioUrl) : ''}<br>
          Prices are estimates, not a binding contract until both parties confirm the final scope in writing.
        </div>
      </article>`;
  }

  const proposalsView = {
    title: 'Proposals',
    sub: 'Turn a scope into a clear, printable estimate.',
    actions: () => '',
    render() {
      const p = ui.proposal;
      const result = p.result;

      return `
        <div class="proposal-layout">
          <section class="panel proposal-form-panel">
            <div class="panel-head">
              <div><h2>Proposal builder</h2><p>Beginner prices in INR, shown with an approximate USD figure. Draft only — get Vishal's explicit approval before sending any quote.</p></div>
            </div>
            <form data-form="proposal" class="form-grid">
              <div class="field full">
                <label for="pp-lead">Linked lead (optional)</label>
                <select id="pp-lead" class="select" name="leadId">
                  ${option('', 'No linked lead', p.leadId)}
                  ${leadOptionsFor(p.leadId)}
                </select>
                <small>Selecting a lead fills the client name if it is empty.</small>
              </div>
              <div class="field full">
                <label for="pp-client">Client name *</label>
                <input id="pp-client" class="input" name="client" required value="${esc(p.client)}" placeholder="Business or contact name" />
              </div>
              <div class="field full">
                <label for="pp-type">Project type</label>
                <select id="pp-type" class="select" name="typeId">${optionsFrom(D.PROJECT_TYPES, p.typeId)}</select>
              </div>
              <div class="field">
                <label for="pp-pages">Pages</label>
                <input id="pp-pages" class="input" name="pages" type="number" min="1" max="20" value="${p.pages}" />
              </div>
              <div class="field">
                <label for="pp-currency">Currency</label>
                <select id="pp-currency" class="select" name="currency">${optionsFrom(Object.keys(D.PRICING.currencies), p.currency)}</select>
              </div>

              <div class="field full">
                <label>Add-ons</label>
                <div class="chip-select">
                  ${D.FEATURES.map((feature) => `
                    <label class="chip-choice">
                      <input type="checkbox" name="features" value="${feature.id}" ${p.features.includes(feature.id) ? 'checked' : ''} />
                      <span>${esc(feature.label)} · ${fmtMoney(feature.price, 'INR')} (≈ ${fmtMoney(convert(feature.price, 'USD'), 'USD')})</span>
                    </label>`).join('')}
                </div>
              </div>

              <div class="field full">
                <label class="check-row"><input type="checkbox" name="rush" ${p.rush ? 'checked' : ''} /> Priority delivery (+25%)</label>
              </div>

              <div class="field full">
                <label for="pp-notes">Notes for the client (optional)</label>
                <textarea id="pp-notes" class="textarea" name="notes" placeholder="Anything specific about this project that should appear in the overview.">${esc(p.notes)}</textarea>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Generate proposal</button>
              </div>
            </form>
          </section>

          <div class="stack">
            ${result ? `
              <div class="row-between">
                <span class="small muted">Preview · ${esc(result.client)} · ${esc(result.type.label)}</span>
                <div class="row">
                  <button class="btn btn-ghost btn-sm" data-action="print-proposal">Print / Save as PDF</button>
                  <button class="btn btn-primary btn-sm" data-action="create-project-from-proposal">Create project</button>
                </div>
              </div>
              ${proposalPaper(result)}
              <p class="small muted">Review every line before sending. Confirm the final price and scope with the client in writing — this tool does not send or sign anything.</p>
            ` : emptyState(
              'No proposal generated',
              'Fill the brief on the left and generate a proposal. You will get a printable estimate with scope, timeline and payment milestones.',
              '',
              '<path d="M6 3h8l4 4v14H6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 3v4h4M9 11h6M9 14.5h6M9 18h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'
            )}
          </div>
        </div>`;
    },
  };

  /* ------------------------------------------------------------------
     Site builder
     ------------------------------------------------------------------ */

  const EXAMPLE = {
    presetId: 'cafe',
    businessName: 'Fern & Filter',
    tagline: 'Slow coffee, warm rooms, good mornings.',
    description: 'A neighbourhood café serving single-origin coffee, fresh pastries and simple lunches. We roast in small batches and bake every morning.',
    city: 'Bristol',
    phone: '+44 117 000 0000',
    email: 'hello@example.com',
    address: '18 Example Street, Bristol',
    hours: 'Mon–Fri: 7:30 – 17:00\nSaturday: 8:00 – 17:00\nSunday: 9:00 – 15:00',
    ctaLabel: 'Find us',
    credit: 'Vishal Kumar',
    itemsText: 'Espresso | Single origin, changes weekly | £3.20\nFlat white | Silky, consistent, made properly | £3.80\nMorning bake | Croissant, pain au chocolat, seasonal pastry | £3.50\nLunch plate | Simple, seasonal, made in-house | £8.50',
  };

  const builderView = {
    title: 'Site builder',
    sub: 'Generate a client-ready static site from a short brief.',
    actions: () => '',
    render() {
      const brief = ui.builder.brief || { presetId: 'cafe', pages: '' };
      const result = ui.builder.result;
      const value = (key) => esc(brief[key] || '');

      return `
        <div class="builder-layout">
          <section class="panel">
            <div class="panel-head">
              <div><h2>Client brief</h2><p>Different industries get different layouts and palettes.</p></div>
            </div>
            <form data-form="builder" class="form-grid">
              <div class="field full">
                <label for="sb-preset">Industry preset</label>
                <select id="sb-preset" class="select" name="presetId">
                  ${Object.entries(G.PRESETS).map(([id, preset]) => option(id, preset.label, brief.presetId || 'cafe')).join('')}
                </select>
                <small>Presets change palette, typography and layout — not just colours.</small>
              </div>
              <div class="field full">
                <label for="sb-name">Business name *</label>
                <input id="sb-name" class="input" name="businessName" required value="${value('businessName')}" placeholder="e.g. Fern & Filter" />
              </div>
              <div class="field full">
                <label for="sb-tagline">Headline</label>
                <input id="sb-tagline" class="input" name="tagline" value="${value('tagline')}" placeholder="One clear sentence about the business" />
              </div>
              <div class="field">
                <label for="sb-city">City</label>
                <input id="sb-city" class="input" name="city" value="${value('city')}" placeholder="Bristol" />
              </div>
              <div class="field">
                <label for="sb-cta">Button label</label>
                <input id="sb-cta" class="input" name="ctaLabel" value="${value('ctaLabel')}" placeholder="Get in touch" />
              </div>
              <div class="field">
                <label for="sb-phone">Phone</label>
                <input id="sb-phone" class="input" name="phone" value="${value('phone')}" placeholder="+44 …" />
              </div>
              <div class="field">
                <label for="sb-email">Email</label>
                <input id="sb-email" class="input" name="email" type="email" value="${value('email')}" placeholder="hello@business.com" />
              </div>
              <div class="field full">
                <label for="sb-address">Address</label>
                <input id="sb-address" class="input" name="address" value="${value('address')}" placeholder="Street, city, postcode" />
              </div>
              <div class="field full">
                <label for="sb-hours">Opening hours</label>
                <textarea id="sb-hours" class="textarea" name="hours" rows="3" placeholder="Mon–Fri: 9:00 – 18:00">${value('hours')}</textarea>
                <small>One line per row, exactly as the client confirms them.</small>
              </div>
              <div class="field full">
                <label for="sb-description">About the business</label>
                <textarea id="sb-description" class="textarea" name="description" rows="4" placeholder="What it does, who it serves, what makes it different — in the client's own words.">${value('description')}</textarea>
              </div>
              <div class="field full">
                <label for="sb-items">Services / menu items</label>
                <textarea id="sb-items" class="textarea" name="itemsText" rows="5" placeholder="One per line: Name | description | price">${value('itemsText')}</textarea>
                <small>Format: <span class="mono">Name | Description | Price</span> — description and price are optional.</small>
              </div>
              <div class="field full">
                <label for="sb-credit">Footer credit</label>
                <input id="sb-credit" class="input" name="credit" value="${value('credit')}" placeholder="Your name (leave empty to remove)" />
              </div>

              <div class="form-actions" style="justify-content:flex-start">
                <button type="submit" class="btn btn-primary">Generate site</button>
                <button type="button" class="btn btn-ghost" data-action="builder-example">Load example</button>
                <button type="button" class="btn btn-ghost" data-action="builder-reset">Reset</button>
              </div>
            </form>
          </section>

          <div class="stack">
            <section class="preview-shell">
              <div class="preview-bar">
                <span class="dots"><i></i><i></i><i></i></span>
                <span id="preview-url">${result ? esc(`preview · ${result.name}`) : 'preview'}</span>
                ${result ? '<button class="btn btn-ghost btn-sm" data-action="open-preview">Open full preview</button>' : ''}
              </div>
              ${result
                ? `<iframe class="preview-frame" id="site-preview" title="Generated website preview" sandbox="allow-scripts allow-forms allow-popups"></iframe>`
                : `<div style="padding:48px 24px">${emptyState('Your preview appears here', 'Fill in the brief and press Generate site. The output is plain HTML, CSS and JavaScript that the client can host anywhere.', '<button class="btn btn-primary btn-sm" data-action="builder-example">Load example brief</button>', '<rect x="4" y="5" width="16" height="11" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 20h8M12 16v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>')}</div>`}
            </section>

            ${result ? `
              <section class="panel">
                <div class="panel-head">
                  <div><h2>Delivery files</h2><p>${esc(result.presetLabel)} preset · ${esc(result.title)}</p></div>
                  <button class="btn btn-primary btn-sm" data-action="download-all">Download all</button>
                </div>
                <div class="file-list">
                  ${[['index.html', 'Page structure and content', 'text/html;charset=utf-8'],
                     ['styles.css', 'Theme, layout and responsive rules', 'text/css;charset=utf-8'],
                     ['script.js', 'Menu, reveals and contact form', 'text/javascript;charset=utf-8'],
                     ['README.md', 'Delivery and editing notes', 'text/markdown;charset=utf-8']].map(([file]) => `
                    <div class="file-row">
                      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 2.5h6l4 4v11H5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M11 2.5v4h4" stroke="currentColor" stroke-width="1.4"/></svg>
                      <span>${file}</span>
                      <button class="btn btn-ghost btn-sm" data-action="download-file" data-file="${file}">Download</button>
                    </div>`).join('')}
                </div>
                <p class="small muted" style="margin-top:12px">Before delivery: replace placeholder copy, confirm hours and contact details, test on a real phone, and get the client's written sign-off.</p>
              </section>` : ''}
          </div>
        </div>`;
    },
    mount() {
      const frame = $('#site-preview');
      if (frame && ui.builder.result) frame.srcdoc = ui.builder.result.preview;
    },
  };

  /* ------------------------------------------------------------------
     Settings
     ------------------------------------------------------------------ */

  const settingsView = {
    title: 'Settings',
    sub: 'Your details, your data, your control.',
    actions: () => '',
    render() {
      const settings = S.settings;
      const st = S.stats();
      const bytes = S.storageBytes();

      return `
        <div class="settings-grid">
          <section class="panel">
            <div class="panel-head"><div><h2>Your details</h2><p>Used in proposals and outreach sign-offs.</p></div></div>
            <form data-form="settings" class="form-grid">
              <div class="field full">
                <label for="st-name">Your name</label>
                <input id="st-name" class="input" name="ownerName" value="${esc(settings.ownerName)}" />
              </div>
              <div class="field full">
                <label for="st-email">Contact email</label>
                <input id="st-email" class="input" name="email" type="email" value="${esc(settings.email)}" />
              </div>
              <div class="field full">
                <label for="st-portfolio">Portfolio URL</label>
                <input id="st-portfolio" class="input" name="portfolioUrl" value="${esc(settings.portfolioUrl)}" placeholder="https://your-site.com" />
              </div>
              <div class="field full">
                <label for="st-currency">Default currency</label>
                <select id="st-currency" class="select" name="currency">${optionsFrom(Object.keys(D.PRICING.currencies), settings.currency)}</select>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save details</button>
              </div>
            </form>
          </section>

          <section class="panel">
            <div class="panel-head"><div><h2>Backup &amp; export</h2><p>Your records live in this browser only.</p></div></div>
            <div class="setting-row">
              <div><strong>Full backup (JSON)</strong><p>Leads, notes, outreach drafts, projects and settings. Restore this file on any machine.</p></div>
              <button class="btn btn-ghost btn-sm" data-action="export-json">Export</button>
            </div>
            <div class="setting-row">
              <div><strong>Leads spreadsheet (CSV)</strong><p>Opens in Excel or Google Sheets. Plain columns, no formulas.</p></div>
              <button class="btn btn-ghost btn-sm" data-action="export-csv">Export CSV</button>
            </div>
            <div class="setting-row">
              <div><strong>Restore from backup</strong><p>Replaces everything currently stored after confirmation.</p></div>
              <button class="btn btn-ghost btn-sm" data-action="import-json">Choose file</button>
            </div>
            <input type="file" id="import-file" accept="application/json,.json" class="hidden" />
            <div class="setting-row">
              <div><strong>Sample data</strong><p>${st.demoLeads + st.demoProjects} sample record(s) loaded. Always marked SAMPLE and excluded from statistics.</p></div>
              <div class="row">
                <button class="btn btn-ghost btn-sm" data-action="load-demo">Load</button>
                <button class="btn btn-ghost btn-sm" data-action="remove-demo" ${st.demoLeads + st.demoProjects ? '' : 'disabled'}>Remove</button>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-head"><div><h2>Storage</h2><p>How your data is stored.</p></div></div>
            <div class="kv">
              <div><span>Storage method</span><strong>Browser localStorage</strong></div>
              <div><span>Key</span><strong class="mono">mwp.studio.v1</strong></div>
              <div><span>Current size</span><strong>${(bytes / 1024).toFixed(1)} KB</strong></div>
              <div><span>Typical limit</span><strong>~5 MB per browser</strong></div>
              <div><span>Synced to cloud</span><strong>Never</strong></div>
            </div>
            <p class="small muted" style="margin-top:14px">
              Data stays on this device and browser profile. Clearing site data, using private
              browsing or switching browsers will hide it. Export a JSON backup after each
              working session — it is the only copy that survives.
            </p>
          </section>

          <section class="panel danger-zone">
            <div class="panel-head"><div><h2>Danger zone</h2><p>Irreversible actions. Export first.</p></div></div>
            <div class="setting-row">
              <div><strong>Delete all records</strong><p>Removes every lead, project, draft and note from this browser. Settings are kept.</p></div>
              <button class="btn btn-danger btn-sm" data-action="clear-data">Delete everything</button>
            </div>
          </section>
        </div>`;
    },
  };

  /* ------------------------------------------------------------------
     Views registry & render
     ------------------------------------------------------------------ */

  const VIEWS = {
    overview: overviewView,
    leads: leadsView,
    projects: projectsView,
    outreach: outreachView,
    proposals: proposalsView,
    builder: builderView,
    settings: settingsView,
  };

  function setView(view) {
    if (!VIEWS[view]) return;
    ui.view = view;
    closeModal();
    document.body.classList.remove('nav-open');
    $('.app').classList.remove('menu-open');
    render();
    $('#view').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function render() {
    const view = VIEWS[ui.view];
    $('#view-title').textContent = view.title;
    $('#view-sub').textContent = view.sub;
    $('#topbar-actions').innerHTML = view.actions ? view.actions() : '';
    $('#view').innerHTML = view.render();
    $$('.side-link').forEach((link) => link.classList.toggle('is-active', link.dataset.view === ui.view));
    updateChrome();
    if (view.mount) view.mount();
  }

  /* ------------------------------------------------------------------
     Event handlers
     ------------------------------------------------------------------ */

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-view]');
    if (nav) {
      event.preventDefault();
      setView(nav.dataset.view);
      return;
    }

    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    const action = trigger.dataset.action;
    const id = trigger.dataset.id;

    switch (action) {
      /* global */
      case 'modal-close':
        closeModal();
        break;
      case 'add-lead':
        openModal('Add lead', leadForm());
        break;
      case 'edit-lead': {
        const lead = S.getLead(id);
        if (lead) openModal('Edit lead', leadForm(lead));
        break;
      }
      case 'lead-outreach':
        closeModal();
        ui.outreach.leadId = id;
        ui.outreach.subject = '';
        ui.outreach.body = '';
        setView('outreach');
        break;
      case 'delete-lead': {
        const lead = S.getLead(id);
        if (!lead) break;
        confirmDialog({
          title: 'Delete lead?',
          message: `This permanently deletes <strong>${esc(lead.business)}</strong>, including its notes and logged drafts. This cannot be undone.`,
          confirmLabel: 'Delete lead',
          danger: true,
          onConfirm: () => {
            S.deleteLead(id);
            if (ui.outreach.leadId === id) {
              ui.outreach = { leadId: '', templateId: 'no-website', subject: '', body: '', generatedFor: '' };
            }
            render();
            toast('<strong>Lead deleted.</strong>');
          },
        });
        break;
      }
      case 'clear-lead-filters':
        ui.leadQuery = '';
        ui.leadCountry = '';
        ui.leadCategory = '';
        ui.leadStatus = '';
        render();
        break;
      case 'load-demo': {
        const added = S.loadDemo();
        render();
        toast(added ? '<strong>Sample data loaded.</strong> It is marked as SAMPLE and excluded from your statistics.' : '<strong>Sample data already loaded.</strong>');
        break;
      }
      case 'remove-demo':
        S.removeDemo();
        render();
        toast('<strong>Sample data removed.</strong> Your real records are untouched.');
        break;

      /* projects */
      case 'add-project':
        openModal('New project', projectForm());
        break;
      case 'edit-project': {
        const project = S.getProject(id);
        if (project) openModal('Edit project', projectForm(project));
        break;
      }
      case 'delete-project': {
        const project = S.getProject(id);
        if (!project) break;
        confirmDialog({
          title: 'Delete project?',
          message: `This permanently deletes <strong>${esc(project.name)}</strong> and its task checklist. This cannot be undone.`,
          confirmLabel: 'Delete project',
          danger: true,
          onConfirm: () => {
            S.deleteProject(id);
            render();
            toast('<strong>Project deleted.</strong>');
          },
        });
        break;
      }
      case 'toggle-task': {
        const project = S.getProject(id);
        if (!project) break;
        const tasks = project.tasks.map((task) => task.id === trigger.dataset.task ? { ...task, done: !task.done } : task);
        S.updateProject(id, { tasks });
        render();
        break;
      }
      case 'mark-paid': {
        const project = S.getProject(id);
        if (!project) break;
        confirmDialog({
          title: 'Confirm payment received?',
          message: `Only mark <strong>${esc(project.name)}</strong> as paid after you have received the money and verified it in your own bank or payment account. Studio cannot verify payments.`,
          confirmLabel: 'Yes, payment received',
          onConfirm: () => {
            S.updateProject(id, { paid: true });
            render();
            toast('<strong>Marked as paid.</strong>');
          },
        });
        break;
      }
      case 'mark-unpaid':
        S.updateProject(id, { paid: false });
        render();
        toast('<strong>Payment status reset to pending.</strong>');
        break;
      case 'add-task-row': {
        const rows = $('#task-rows');
        if (!rows) break;
        const empty = rows.querySelector('.muted');
        if (empty) empty.remove();
        rows.insertAdjacentHTML('beforeend', `
          <div class="edit-row" data-edit-row data-task-row>
            <input type="checkbox" data-task-done aria-label="Task done" />
            <input class="input" data-task-label placeholder="Task" />
            <button type="button" class="icon-btn" data-action="remove-row" aria-label="Remove task">×</button>
          </div>`);
        break;
      }
      case 'add-approval-row': {
        const rows = $('#approval-rows');
        if (!rows) break;
        const empty = rows.querySelector('.muted');
        if (empty) empty.remove();
        rows.insertAdjacentHTML('beforeend', `
          <div class="edit-row" data-edit-row data-approval-row>
            <input class="input" data-approval-label placeholder="Approval" />
            <select class="select" data-approval-status aria-label="Approval status">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
            <button type="button" class="icon-btn" data-action="remove-row" aria-label="Remove approval">×</button>
          </div>`);
        break;
      }
      case 'remove-row':
        trigger.closest('[data-edit-row]')?.remove();
        break;

      /* outreach */
      case 'copy-email': {
        const text = `Subject: ${ui.outreach.subject}\n\n${ui.outreach.body}`;
        copyText(text).then((ok) => toast(ok ? '<strong>Draft copied.</strong> Paste it into your email client and review before sending.' : 'Copy failed — select the text manually.'));
        break;
      }
      case 'open-mail': {
        const lead = S.getLead(ui.outreach.leadId);
        if (!lead || !lead.email) {
          toast('<strong>No email address</strong> on this lead. Add one first.');
          break;
        }
        const url = `mailto:${encodeURIComponent(lead.email)}?subject=${encodeURIComponent(ui.outreach.subject)}&body=${encodeURIComponent(ui.outreach.body)}`;
        window.location.href = url;
        toast('<strong>Opening your email app.</strong> Review the message and press send there.');
        break;
      }
      case 'log-outreach': {
        const lead = S.getLead(ui.outreach.leadId);
        if (!lead) break;
        if (!ui.outreach.subject && !ui.outreach.body) {
          toast('<strong>Nothing to log.</strong> Generate a draft first.');
          break;
        }
        S.logOutreach(lead.id, {
          subject: ui.outreach.subject,
          body: ui.outreach.body,
          template: ui.outreach.templateId,
        });
        const patch = {};
        if (lead.status === 'new') patch.status = 'contacted';
        if (!lead.followUpAt) {
          patch.followUpAt = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
        }
        if (Object.keys(patch).length) S.updateLead(lead.id, patch);
        render();
        toast('<strong>Draft logged.</strong> Follow-up scheduled in 5 days if none was set.');
        break;
      }

      /* proposal */
      case 'print-proposal':
        window.print();
        break;
      case 'create-project-from-proposal': {
        const result = ui.proposal.result;
        if (!result) break;
        confirmDialog({
          title: 'Create a project from this proposal?',
          message: `This creates a project for <strong>${esc(result.client)}</strong> with status “Proposal sent”. It does not sign, send or confirm anything.`,
          confirmLabel: 'Create project',
          onConfirm: () => {
            const deadline = new Date(Date.now() + result.days * 86400000).toISOString().slice(0, 10);
            S.addProject({
              name: `${result.client} — ${result.type.label}`,
              client: result.client,
              leadId: ui.proposal.leadId,
              status: 'proposal-sent',
              deadline,
              budget: result.total,
              currency: result.currency,
              paid: false,
              tasks: [
                { id: S.uid('task'), label: 'Discovery call notes', done: false },
                { id: S.uid('task'), label: 'Sitemap & content outline', done: false },
                { id: S.uid('task'), label: 'Design direction', done: false },
                { id: S.uid('task'), label: 'Responsive build', done: false },
                { id: S.uid('task'), label: 'Cross-device testing', done: false },
                { id: S.uid('task'), label: 'Handover & deployment', done: false },
              ],
              approvals: [{ id: S.uid('approval'), label: 'Design sign-off', status: 'pending', at: '' }],
              notes: `Created from proposal estimate. ${result.notes}`.trim(),
            });
            setView('projects');
            toast('<strong>Project created.</strong> Update the status as the conversation progresses.');
          },
        });
        break;
      }

      /* builder */
      case 'builder-example': {
        ui.builder.brief = { ...EXAMPLE };
        ui.builder.result = takeBuilderResult(EXAMPLE);
        render();
        toast('<strong>Example brief loaded.</strong> Edit anything and regenerate.');
        break;
      }
      case 'builder-reset':
        ui.builder = { brief: null, result: null };
        render();
        break;
      case 'open-preview': {
        if (!ui.builder.result) break;
        const blob = new Blob([ui.builder.result.preview], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener');
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
        break;
      }
      case 'download-file': {
        const file = trigger.dataset.file;
        if (!ui.builder.result || !file) break;
        const content = {
          'index.html': ui.builder.result.html,
          'styles.css': ui.builder.result.css,
          'script.js': ui.builder.result.js,
          'README.md': ui.builder.result.readme,
        }[file];
        if (content != null) {
          const type = file.endsWith('.html') ? 'text/html;charset=utf-8'
            : file.endsWith('.css') ? 'text/css;charset=utf-8'
            : file.endsWith('.js') ? 'text/javascript;charset=utf-8'
            : 'text/markdown;charset=utf-8';
          download(file, content, type);
        }
        break;
      }
      case 'download-all': {
        if (!ui.builder.result) break;
        const result = ui.builder.result;
        const files = [
          ['index.html', result.html, 'text/html;charset=utf-8'],
          ['styles.css', result.css, 'text/css;charset=utf-8'],
          ['script.js', result.js, 'text/javascript;charset=utf-8'],
          ['README.md', result.readme, 'text/markdown;charset=utf-8'],
        ];
        files.forEach(([name, content, type], index) => {
          window.setTimeout(() => download(name, content, type), index * 350);
        });
        toast('<strong>Downloading 4 files.</strong> Keep them together in one folder.');
        break;
      }

      /* settings */
      case 'export-json':
        download(`studio-backup-${todayISO()}.json`, S.exportJson(), 'application/json;charset=utf-8');
        toast('<strong>Backup downloaded.</strong> Store it somewhere safe.');
        break;
      case 'export-csv': {
        const csv = `\uFEFF${S.leadsCsv()}`;
        download(`leads-${todayISO()}.csv`, csv, 'text/csv;charset=utf-8');
        toast('<strong>CSV downloaded.</strong> Opens cleanly in Excel and Google Sheets.');
        break;
      }
      case 'import-json':
        $('#import-file')?.click();
        break;
      case 'clear-data': {
        openModal('Delete all records', `
          <div class="confirm-body">
            <p>This removes every lead, project, draft and note from this browser. Your settings are kept. <strong>It cannot be undone.</strong></p>
            <p>Type <span class="mono">DELETE</span> to confirm.</p>
            <input class="input" id="clear-confirm" autocomplete="off" placeholder="DELETE" />
            <div class="form-actions" style="position:static;margin-top:16px;padding:0;border:0;background:none">
              <button type="button" class="btn btn-ghost" data-action="modal-close">Cancel</button>
              <button type="button" class="btn btn-danger" id="clear-confirm-btn" disabled>Delete everything</button>
            </div>
          </div>`, (body) => {
          const input = body.querySelector('#clear-confirm');
          const button = body.querySelector('#clear-confirm-btn');
          input.addEventListener('input', () => { button.disabled = input.value.trim() !== 'DELETE'; });
          button.addEventListener('click', () => {
            S.importJson(JSON.stringify({ leads: [], projects: [], settings: S.settings }));
            ui.outreach = { leadId: '', templateId: 'no-website', subject: '', body: '', generatedFor: '' };
            ui.proposal.result = null;
            closeModal();
            setView('overview');
            toast('<strong>All records deleted.</strong> Your settings were kept.');
          }, { once: true });
        });
        break;
      }
      default:
        break;
    }
  });

  /* Form submissions */
  document.addEventListener('submit', (event) => {
    const form = event.target.closest('form[data-form]');
    if (!form) return;
    event.preventDefault();
    const formName = form.dataset.form;

    if (formName === 'lead') {
      const data = Object.fromEntries(new FormData(form).entries());
      const business = String(data.business || '').trim();
      if (!business) {
        toast('<strong>Business name is required.</strong>');
        return;
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())) {
        toast('<strong>That email address looks invalid.</strong> Check it or leave the field empty.');
        return;
      }
      const lead = {
        ...data,
        business,
        email: String(data.email || '').trim(),
        website: data.website ? (safeUrl(data.website) || String(data.website).trim()) : '',
      };
      const id = form.dataset.id;
      if (id) {
        S.updateLead(id, lead);
        toast('<strong>Lead updated.</strong>');
      } else {
        S.addLead(lead);
        toast('<strong>Lead added.</strong> Research notes will make your outreach specific.');
      }
      closeModal();
      render();
      return;
    }

    if (formName === 'project') {
      const data = Object.fromEntries(new FormData(form).entries());
      if (!String(data.name || '').trim()) {
        toast('<strong>Project name is required.</strong>');
        return;
      }
      const tasks = $$('[data-task-row]', form).map((row) => ({
        id: row.dataset.id || S.uid('task'),
        label: (row.querySelector('[data-task-label]')?.value || '').trim(),
        done: Boolean(row.querySelector('[data-task-done]')?.checked),
      })).filter((task) => task.label);
      const approvals = $$('[data-approval-row]', form).map((row) => ({
        id: row.dataset.id || S.uid('approval'),
        label: (row.querySelector('[data-approval-label]')?.value || '').trim(),
        status: row.querySelector('[data-approval-status]')?.value || 'pending',
        at: '',
      })).filter((item) => item.label);

      const project = {
        name: data.name.trim(),
        client: String(data.client || '').trim(),
        leadId: data.leadId || '',
        status: data.status || 'new-inquiry',
        deadline: data.deadline || '',
        budget: Number(data.budget) || 0,
        currency: data.currency || 'USD',
        notes: String(data.notes || ''),
        tasks,
        approvals,
      };

      const id = form.dataset.id;
      if (id) {
        S.updateProject(id, project);
        toast('<strong>Project updated.</strong>');
      } else {
        S.addProject({ ...project, paid: false });
        toast('<strong>Project created.</strong> Add a deadline and keep tasks current.');
      }
      closeModal();
      render();
      return;
    }

    if (formName === 'outreach') {
      const data = Object.fromEntries(new FormData(form).entries());
      ui.outreach.leadId = data.leadId || '';
      ui.outreach.templateId = data.templateId || 'no-website';
      if (!ui.outreach.leadId) {
        toast('<strong>Choose a lead first.</strong>');
        return;
      }
      if (buildEmailDraft()) {
        render();
        toast('<strong>Draft ready.</strong> Replace any [bracketed] placeholders before sending.');
      }
      return;
    }

    if (formName === 'proposal') {
      const fd = new FormData(form);
      const input = {
        leadId: String(fd.get('leadId') || ''),
        client: String(fd.get('client') || '').trim(),
        typeId: String(fd.get('typeId') || 'business-website'),
        pages: Number(fd.get('pages')) || 3,
        currency: String(fd.get('currency') || 'USD'),
        rush: fd.get('rush') === 'on',
        notes: String(fd.get('notes') || ''),
        features: fd.getAll('features').map(String),
      };
      if (!input.client) {
        toast('<strong>Add a client name</strong> so the proposal is addressed correctly.');
        return;
      }
      ui.proposal = { ...ui.proposal, ...input, result: computeProposal(input) };
      render();
      toast('<strong>Proposal generated.</strong> Review every line before sending.');
      return;
    }

    if (formName === 'builder') {
      const data = Object.fromEntries(new FormData(form).entries());
      ui.builder.brief = { ...data };
      ui.builder.result = takeBuilderResult(data);
      render();
      toast('<strong>Site generated.</strong> Preview, edit the copy, then download the files.');
      return;
    }

    if (formName === 'settings') {
      const data = Object.fromEntries(new FormData(form).entries());
      S.updateSettings(data);
      render();
      toast('<strong>Details saved.</strong> They will appear in proposals and emails.');
    }
  });

  /* Selects & filters */
  document.addEventListener('change', (event) => {
    const leadStatus = event.target.closest('[data-lead-status]');
    if (leadStatus) {
      S.updateLead(leadStatus.dataset.id, { status: leadStatus.value });
      render();
      return;
    }

    const projectStatus = event.target.closest('[data-project-status]');
    if (projectStatus) {
      S.updateProject(projectStatus.dataset.id, { status: projectStatus.value });
      render();
      return;
    }

    if (event.target.id === 'filter-country') {
      ui.leadCountry = event.target.value;
      refreshLeadResults();
      return;
    }
    if (event.target.id === 'filter-category') {
      ui.leadCategory = event.target.value;
      refreshLeadResults();
      return;
    }
    if (event.target.id === 'filter-status') {
      ui.leadStatus = event.target.value;
      refreshLeadResults();
      return;
    }
    if (event.target.id === 'project-filter') {
      ui.projectFilter = event.target.value;
      render();
      return;
    }
    if (event.target.id === 'outreach-lead') {
      ui.outreach.leadId = event.target.value;
      ui.outreach.subject = '';
      ui.outreach.body = '';
      render();
      return;
    }
    if (event.target.id === 'pp-lead') {
      const lead = S.getLead(event.target.value);
      if (lead) {
        ui.proposal.leadId = lead.id;
        const input = $('#pp-client');
        if (input && !input.value.trim()) input.value = lead.business;
      }
      return;
    }
    if (event.target.id === 'import-file') {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        confirmDialog({
          title: 'Restore backup?',
          message: 'This will replace all current leads, projects, drafts and notes in this browser with the contents of the backup file.',
          confirmLabel: 'Replace my data',
          danger: true,
          onConfirm: () => {
            const result = S.importJson(String(reader.result || ''));
            if (!result.ok) {
              toast(`<strong>Import failed.</strong> ${esc(result.error)}`);
              return;
            }
            render();
            toast('<strong>Backup restored.</strong>');
          },
        });
      };
      reader.readAsText(file);
      event.target.value = '';
    }
  });

  /* Text inputs */
  document.addEventListener('input', (event) => {
    if (event.target.id === 'lead-search') {
      ui.leadQuery = event.target.value;
      refreshLeadResults();
      return;
    }
    if (event.target.id === 'email-subject') {
      ui.outreach.subject = event.target.value;
      return;
    }
    if (event.target.id === 'email-body') {
      ui.outreach.body = event.target.value;
    }
  });

  /* Mobile sidebar */
  $('#menu-btn').addEventListener('click', () => {
    const app = $('.app');
    const open = app.classList.toggle('menu-open');
    $('#menu-btn').setAttribute('aria-expanded', String(open));
  });
  $('#scrim').addEventListener('click', () => {
    $('.app').classList.remove('menu-open');
    $('#menu-btn').setAttribute('aria-expanded', 'false');
  });
  $('#modal-close').addEventListener('click', closeModal);

  function takeBuilderResult(data) {
    const items = String(data.itemsText || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, desc = '', price = ''] = line.split('|').map((part) => part.trim());
        return { name, desc, price };
      })
      .filter((item) => item.name);

    return G.build({
      presetId: data.presetId,
      businessName: data.businessName,
      tagline: data.tagline,
      description: data.description,
      city: data.city,
      phone: data.phone,
      email: data.email,
      address: data.address,
      hours: data.hours,
      ctaLabel: data.ctaLabel,
      credit: data.credit,
      items,
    });
  }

  /* Start */
  render();
  if (S.lastError) toast(`<strong>Heads up:</strong> ${esc(S.lastError)}`);
})();
