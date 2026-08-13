// Admin API client. Extends the same request() pattern as api.js.
async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
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

export const adminApi = {
  // Stats
  stats: () => request('/admin/stats'),

  // Reading passages
  passages: () => request('/admin/reading/passages'),
  createPassage: (body) => request('/admin/reading/passages', { method: 'POST', body }),
  updatePassage: (id, body) => request(`/admin/reading/passages/${id}`, { method: 'PUT', body }),
  deletePassage: (id) => request(`/admin/reading/passages/${id}`, { method: 'DELETE' }),
  passageQuestions: (id) => request(`/admin/reading/passages/${id}/questions`),
  createPassageQuestion: (id, body) => request(`/admin/reading/passages/${id}/questions`, { method: 'POST', body }),
  generateQuestions: (id, body) => request(`/admin/reading/passages/${id}/generate-questions`, { method: 'POST', body }),
  bulkCreateQuestions: (id, body) => request(`/admin/reading/passages/${id}/questions/bulk`, { method: 'POST', body }),

  // Listening tests
  tests: () => request('/admin/listening/tests'),
  createTest: (body) => request('/admin/listening/tests', { method: 'POST', body }),
  updateTest: (id, body) => request(`/admin/listening/tests/${id}`, { method: 'PUT', body }),
  deleteTest: (id) => request(`/admin/listening/tests/${id}`, { method: 'DELETE' }),
  testQuestions: (id) => request(`/admin/listening/tests/${id}/questions`),
  createTestQuestion: (id, body) => request(`/admin/listening/tests/${id}/questions`, { method: 'POST', body }),

  // Questions (shared)
  updateQuestion: (id, body) => request(`/admin/questions/${id}`, { method: 'PUT', body }),
  deleteQuestion: (id) => request(`/admin/questions/${id}`, { method: 'DELETE' }),

  // Vocabulary
  vocabulary: () => request('/admin/vocabulary'),
  createWord: (body) => request('/admin/vocabulary', { method: 'POST', body }),
  updateWord: (id, body) => request(`/admin/vocabulary/${id}`, { method: 'PUT', body }),
  deleteWord: (id) => request(`/admin/vocabulary/${id}`, { method: 'DELETE' }),

  // Writing prompts
  prompts: () => request('/admin/writing/prompts'),
  createPrompt: (body) => request('/admin/writing/prompts', { method: 'POST', body }),
  updatePrompt: (id, body) => request(`/admin/writing/prompts/${id}`, { method: 'PUT', body }),
  deletePrompt: (id) => request(`/admin/writing/prompts/${id}`, { method: 'DELETE' }),

  // Speaking prompts
  speakingPrompts: () => request('/admin/speaking/prompts'),
  createSpeakingPrompt: (body) => request('/admin/speaking/prompts', { method: 'POST', body }),
  updateSpeakingPrompt: (id, body) => request(`/admin/speaking/prompts/${id}`, { method: 'PUT', body }),
  deleteSpeakingPrompt: (id) => request(`/admin/speaking/prompts/${id}`, { method: 'DELETE' }),

  // Students
  students: () => request('/admin/students'),
  updateStudent: (id, body) => request(`/admin/students/${id}`, { method: 'PUT', body }),
  deleteStudent: (id) => request(`/admin/students/${id}`, { method: 'DELETE' }),

  // Reuse user API
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
};
