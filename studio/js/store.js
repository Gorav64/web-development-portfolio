/* StudioStore — localStorage persistence, schema, CRUD and statistics.
   Everything stays in this browser. Nothing is uploaded anywhere. */
window.StudioStore = (() => {
  'use strict';

  const KEY = 'mwp.studio.v1';
  const VERSION = 1;

  const defaults = () => ({
    version: VERSION,
    leads: [],
    projects: [],
    settings: {
      ownerName: 'Vishal Kumar',
      email: 'firwall63@gmail.com',
      portfolioUrl: '',
      currency: 'USD',
    },
    meta: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  });

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const now = () => new Date().toISOString();

  let state = load();
  let lastError = '';

  function load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (!raw) return defaults();
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return defaults();
      return normalize(parsed);
    } catch (error) {
      console.error('Studio: could not read saved data, starting fresh.', error);
      lastError = 'Saved data could not be read. Export a backup before adding new records.';
      return defaults();
    }
  }

  function normalize(data) {
    const base = defaults();
    return {
      version: VERSION,
      leads: Array.isArray(data.leads) ? data.leads.filter(isObject).map(normalizeLead) : [],
      projects: Array.isArray(data.projects) ? data.projects.filter(isObject).map(normalizeProject) : [],
      settings: { ...base.settings, ...(isObject(data.settings) ? data.settings : {}) },
      meta: { ...base.meta, ...(isObject(data.meta) ? data.meta : {}) },
    };
  }

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function normalizeLead(lead) {
    return {
      id: lead.id || uid('lead'),
      business: String(lead.business || 'Untitled business'),
      country: String(lead.country || 'Other'),
      category: String(lead.category || 'Other'),
      website: String(lead.website || ''),
      email: String(lead.email || ''),
      phone: String(lead.phone || ''),
      contactName: String(lead.contactName || ''),
      status: String(lead.status || 'new'),
      followUpAt: String(lead.followUpAt || ''),
      problems: String(lead.problems || ''),
      improvements: String(lead.improvements || ''),
      opportunity: String(lead.opportunity || ''),
      notes: String(lead.notes || ''),
      source: String(lead.source || 'Manual entry'),
      demo: Boolean(lead.demo),
      outreach: Array.isArray(lead.outreach) ? lead.outreach.filter(isObject) : [],
      createdAt: lead.createdAt || now(),
      updatedAt: lead.updatedAt || now(),
    };
  }

  function normalizeProject(project) {
    return {
      id: project.id || uid('project'),
      name: String(project.name || 'Untitled project'),
      client: String(project.client || ''),
      leadId: String(project.leadId || ''),
      status: String(project.status || 'new-inquiry'),
      deadline: String(project.deadline || ''),
      budget: Number(project.budget) || 0,
      currency: String(project.currency || 'USD'),
      paid: Boolean(project.paid),
      tasks: Array.isArray(project.tasks) ? project.tasks.filter(isObject).map((task) => ({
        id: task.id || uid('task'),
        label: String(task.label || 'Task'),
        done: Boolean(task.done),
      })) : [],
      approvals: Array.isArray(project.approvals) ? project.approvals.filter(isObject).map((item) => ({
        id: item.id || uid('approval'),
        label: String(item.label || 'Approval'),
        status: String(item.status || 'pending'),
        at: String(item.at || ''),
      })) : [],
      notes: String(project.notes || ''),
      demo: Boolean(project.demo),
      createdAt: project.createdAt || now(),
      updatedAt: project.updatedAt || now(),
    };
  }

  function save() {
    state.meta.updatedAt = now();
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error('Studio: could not save.', error);
      lastError = 'Storage is full or blocked by the browser. Export a backup and clear old records.';
      return false;
    }
  }

  function uid(prefix = 'id') {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /* Leads */

  function addLead(input) {
    const lead = normalizeLead({ ...input, id: uid('lead'), createdAt: now(), updatedAt: now() });
    state.leads.unshift(lead);
    save();
    return lead;
  }

  function updateLead(id, patch) {
    const lead = state.leads.find((item) => item.id === id);
    if (!lead) return null;
    Object.assign(lead, patch, { updatedAt: now() });
    save();
    return lead;
  }

  function deleteLead(id) {
    state.leads = state.leads.filter((item) => item.id !== id);
    state.projects.forEach((project) => {
      if (project.leadId === id) project.leadId = '';
    });
    save();
  }

  function getLead(id) {
    return state.leads.find((item) => item.id === id) || null;
  }

  function logOutreach(id, entry) {
    const lead = getLead(id);
    if (!lead) return null;
    lead.outreach.unshift({
      id: uid('outreach'),
      at: now(),
      template: String(entry.template || ''),
      subject: String(entry.subject || ''),
      body: String(entry.body || ''),
      channel: 'Email draft logged',
    });
    lead.updatedAt = now();
    save();
    return lead;
  }

  /* Projects */

  function addProject(input) {
    const project = normalizeProject({ ...input, id: uid('project'), createdAt: now(), updatedAt: now() });
    state.projects.unshift(project);
    save();
    return project;
  }

  function updateProject(id, patch) {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return null;
    Object.assign(project, patch, { updatedAt: now() });
    save();
    return project;
  }

  function deleteProject(id) {
    state.projects = state.projects.filter((item) => item.id !== id);
    save();
  }

  function getProject(id) {
    return state.projects.find((item) => item.id === id) || null;
  }

  /* Settings */

  function updateSettings(patch) {
    state.settings = { ...state.settings, ...patch };
    save();
    return state.settings;
  }

  /* Statistics — sample records are excluded on purpose. */

  const realLeads = () => state.leads.filter((lead) => !lead.demo);
  const realProjects = () => state.projects.filter((project) => !project.demo);

  function stats() {
    const leads = realLeads();
    const count = (status) => leads.filter((lead) => lead.status === status).length;
    const projects = realProjects();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = leads.filter((lead) => {
      if (!lead.followUpAt) return false;
      if (['won', 'completed', 'lost'].includes(lead.status)) return false;
      const date = new Date(`${lead.followUpAt}T00:00:00`);
      return !Number.isNaN(date.getTime()) && date <= today;
    });

    return {
      total: leads.length,
      new: count('new'),
      contacted: count('contacted'),
      replied: count('replied'),
      interested: count('interested'),
      proposals: count('proposal'),
      won: count('won'),
      completed: count('completed'),
      lost: count('lost'),
      projects: projects.length,
      activeProjects: projects.filter((project) => !['delivered', 'completed'].includes(project.status)).length,
      deliveredProjects: projects.filter((project) => ['delivered', 'completed'].includes(project.status)).length,
      followUpsDue: due.length,
      demoLeads: state.leads.filter((lead) => lead.demo).length,
      demoProjects: state.projects.filter((project) => project.demo).length,
    };
  }

  function upcomingFollowUps(limit = 6) {
    return realLeads()
      .filter((lead) => lead.followUpAt && !['won', 'completed', 'lost'].includes(lead.status))
      .sort((a, b) => a.followUpAt.localeCompare(b.followUpAt))
      .slice(0, limit);
  }

  /* Demo records */

  function loadDemo() {
    const data = window.StudioData;
    let added = 0;
    data.DEMO_LEADS.forEach((lead) => {
      if (!state.leads.some((item) => item.id === lead.id)) {
        state.leads.push(normalizeLead(lead));
        added += 1;
      }
    });
    data.DEMO_PROJECTS.forEach((project) => {
      if (!state.projects.some((item) => item.id === project.id)) {
        state.projects.push(normalizeProject(project));
        added += 1;
      }
    });
    save();
    return added;
  }

  function removeDemo() {
    state.leads = state.leads.filter((lead) => !lead.demo);
    state.projects = state.projects.filter((project) => !project.demo);
    save();
  }

  /* Export / import */

  function exportJson() {
    return JSON.stringify(state, null, 2);
  }

  function importJson(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, error: 'That file is not valid JSON.' };
    }
    if (!isObject(parsed) || (!Array.isArray(parsed.leads) && !Array.isArray(parsed.projects))) {
      return { ok: false, error: 'Backup must contain a "leads" or "projects" array.' };
    }
    state = normalize(parsed);
    save();
    return { ok: true };
  }

  function leadsCsv() {
    const headers = ['Business', 'Country', 'Category', 'Website', 'Email', 'Phone', 'Status', 'Follow-up', 'Opportunity', 'Notes', 'Sample'];
    const rows = state.leads.map((lead) => [
      lead.business, lead.country, lead.category, lead.website, lead.email, lead.phone,
      lead.status, lead.followUpAt, lead.opportunity, lead.notes, lead.demo ? 'SAMPLE' : '',
    ]);
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  }

  function storageBytes() {
    try {
      return new Blob([window.localStorage.getItem(KEY) || '']).size;
    } catch {
      return 0;
    }
  }

  return {
    get state() { return state; },
    get leads() { return state.leads; },
    get projects() { return state.projects; },
    get settings() { return state.settings; },
    get lastError() { return lastError; },
    addLead,
    updateLead,
    deleteLead,
    getLead,
    logOutreach,
    addProject,
    updateProject,
    deleteProject,
    getProject,
    updateSettings,
    stats,
    upcomingFollowUps,
    loadDemo,
    removeDemo,
    exportJson,
    importJson,
    leadsCsv,
    storageBytes,
    uid,
    save,
  };
})();
