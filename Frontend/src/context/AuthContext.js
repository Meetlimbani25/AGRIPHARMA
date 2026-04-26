import React, { createContext, useState, useContext, useEffect } from 'react';
import { getProfile } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]     = useState(null);
  const [role, setRole]     = useState(null); // 'farmer' | 'shopkeeper'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedRole = localStorage.getItem('role');
    if (token && savedRole === 'farmer') {
      getProfile()
        .then(res => { setUser(res.data.farmer); setRole('farmer'); })
        .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('role'); localStorage.removeItem('user'); })
        .finally(() => setLoading(false));
    } else if (token && savedRole === 'shopkeeper') {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(savedUser); setRole('shopkeeper'); setLoading(false);
    } else if (token && savedRole === 'admin') {
      const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
      setUser(savedUser); setRole('admin'); setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const loginUser = (token, userData, userRole) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', userRole);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setRole(userRole);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, loginUser, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
