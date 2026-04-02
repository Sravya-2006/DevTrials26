const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = {
  post: async (endpoint, data, token) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  get: async (endpoint, token) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) }
    });
    return res.json();
  }
};

export default api;
