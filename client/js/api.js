// API client. Every server call in the app goes through request(), so
// error handling, JSON parsing, and credentials work one way everywhere.
// The JWT lives in an HTTP-only cookie - JS never sees or stores tokens.

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    cache: 'no-store',
    credentials: 'same-origin',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    json = { success: false, error: 'The server sent an unexpected response.' };
  }

  if (!json.success) {
    const error = new Error(json.error || 'Something went wrong.');
    error.status = res.status;
    throw error;
  }
  return json.data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  updateGoals: (body) => request('/auth/goals', { method: 'PATCH', body }),

  // Reading
  readingTests: () => request('/reading/tests'),
  readingTest: (id) => request(`/reading/tests/${id}`),
  submitReading: (id, body) => request(`/reading/tests/${id}/submit`, { method: 'POST', body }),
  toggleReadingBookmark: (id) => request(`/reading/tests/${id}/bookmark`, { method: 'POST' }),
  deleteReadingAttempts: (id) => request(`/reading/tests/${id}/attempts`, { method: 'DELETE' }),

  // Listening
  listeningTests: () => request('/listening/tests'),
  listeningTest: (id) => request(`/listening/tests/${id}`),
  submitListening: (id, body) => request(`/listening/tests/${id}/submit`, { method: 'POST', body }),
  deleteListeningAttempts: (id) => request(`/listening/tests/${id}/attempts`, { method: 'DELETE' }),

  // Vocabulary
  vocabulary: ({ category, bookmarked, bandLevel } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (bookmarked) params.set('bookmarked', 'true');
    if (bandLevel) params.set('bandLevel', bandLevel);
    const query = params.toString();
    return request(`/vocabulary${query ? `?${query}` : ''}`);
  },
  vocabCategories: () => request('/vocabulary/categories'),
  setVocabStatus: (id, status) => request(`/vocabulary/${id}/status`, { method: 'PATCH', body: { status } }),
  toggleVocabBookmark: (id) => request(`/vocabulary/${id}/bookmark`, { method: 'POST' }),

  // Writing
  writingPrompts: () => request('/writing/prompts'),
  submitEssay: (body) => request('/writing/submit', { method: 'POST', body }),
  submissions: () => request('/writing/submissions'),
  submission: (id) => request(`/writing/submissions/${id}`),
  deleteWritingSubmission: (id) => request(`/writing/submissions/${id}`, { method: 'DELETE' }),
  writingStats: () => request('/writing/stats'),

  // Speaking
  speakingPrompts: () => request('/speaking/prompts'),
  speakingHistory: () => request('/speaking/history'),
  speakingSubmission: (id) => request(`/speaking/${id}`),
  speakingStats: () => request('/speaking/stats'),
  retrySpeakingEvaluation: (id) => request(`/speaking/${id}/retry`, { method: 'POST' }),
  deleteSpeakingSubmission: (id) => request(`/speaking/${id}`, { method: 'DELETE' }),
  submitSpeaking: async (formData) => {
    const res = await fetch('/api/speaking/submit', {
      method: 'POST',
      body: formData // No Content-Type header so browser sets multipart/form-data boundary
    });
    let json;
    try { json = await res.json(); } catch { json = { success: false, error: 'Unexpected response' }; }
    if (!json.success) throw new Error(json.error || 'Request failed');
    return json.data;
  },

  // Dashboard
  dashboard: () => request('/dashboard'),
};
