import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    const email = localStorage.getItem('crm_email');
    if (token && email) {
      setUser({ email, token });
    }
    setLoading(false);
  }, []);

  async function login(email, password) {
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('crm_token', data.token);
      localStorage.setItem('crm_email', data.email);
      setUser({ email: data.email, token: data.token });
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function logout() {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_email');
    setUser(null);
  }

  async function getToken() {
    return user?.token || null;
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
