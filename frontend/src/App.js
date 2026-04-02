import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Policy from './pages/Policy';
import Claims from './pages/Claims';
import Trigger from './pages/Trigger';
import AdminDashboard from './pages/AdminDashboard';
import BottomNav from './components/BottomNav';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('ss_token'));
  const [worker, setWorker] = useState(JSON.parse(localStorage.getItem('ss_worker') || 'null'));

  const login = (token, workerData) => {
    localStorage.setItem('ss_token', token);
    localStorage.setItem('ss_worker', JSON.stringify(workerData));
    setToken(token);
    setWorker(workerData);
  };

  const logout = () => {
    localStorage.removeItem('ss_token');
    localStorage.removeItem('ss_worker');
    setToken(null);
    setWorker(null);
  };

  if (!token) {
    return <Onboarding onLogin={login} />;
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Dashboard worker={worker} token={token} />} />
          <Route path="/policy" element={<Policy worker={worker} token={token} />} />
          <Route path="/claims" element={<Claims worker={worker} token={token} />} />
          <Route path="/trigger" element={<Trigger worker={worker} token={token} />} />
          <Route path="/admin" element={<AdminDashboard token={token} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        <BottomNav onLogout={logout} />
      </div>
    </Router>
  );
}

export default App;
