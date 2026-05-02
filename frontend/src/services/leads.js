const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('crm_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function getLeads({ status, source } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (source) params.set('source', source);

  const res = await fetch(`${API_URL}/api/leads?${params}`, { headers: authHeaders() });
  const data = await handleResponse(res);
  return data.leads.map(l => ({
    ...l,
    createdAt: l.createdAt ? new Date(l.createdAt) : null,
    updatedAt: l.updatedAt ? new Date(l.updatedAt) : null,
  }));
}

export async function getLead(id) {
  const res = await fetch(`${API_URL}/api/leads/${id}`, { headers: authHeaders() });
  const lead = await handleResponse(res);
  return {
    ...lead,
    createdAt: lead.createdAt ? new Date(lead.createdAt) : null,
    updatedAt: lead.updatedAt ? new Date(lead.updatedAt) : null,
    notes: (lead.notes || []).map(n => ({
      ...n,
      createdAt: n.createdAt ? new Date(n.createdAt) : null,
    })),
  };
}

export async function createLead(data) {
  const res = await fetch(`${API_URL}/api/leads`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      message: data.message || '',
      source: data.source || 'manual',
    }),
  });
  const result = await handleResponse(res);
  return result.leadId || result.id;
}

export async function updateLeadStatus(id, status) {
  const res = await fetch(`${API_URL}/api/leads/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return handleResponse(res);
}

export async function addNote(leadId, content) {
  const res = await fetch(`${API_URL}/api/leads/${leadId}/notes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  });
  const note = await handleResponse(res);
  return { ...note, createdAt: note.createdAt ? new Date(note.createdAt) : new Date() };
}

export async function deleteLead(id) {
  const res = await fetch(`${API_URL}/api/leads/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  return handleResponse(res);
}

export async function getAnalytics() {
  const res = await fetch(`${API_URL}/api/leads/analytics/summary`, { headers: authHeaders() });
  const summary = await handleResponse(res);

  // Add recentCount via a separate fetch if needed; backend doesn't track it yet
  return {
    ...summary,
    recentCount: summary.recentCount ?? 0,
  };
}
