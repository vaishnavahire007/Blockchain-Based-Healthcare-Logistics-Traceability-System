import { useState, useEffect } from 'react';

export default function UserDashboard() {
  const [role, setRole] = useState('User');

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if(savedRole) setRole(savedRole.charAt(0).toUpperCase() + savedRole.slice(1));
  }, []);

  return (
    <div className="dashboard-container">
      <div className="status-badge online" style={{marginBottom: '1rem'}}>
        Logged in as: {role}
      </div>
      <h2>User Dashboard</h2>
      <p>Welcome! Here you can view your personal profile and trace the history of your purchased medications ensuring complete transparency.</p>
    </div>
  );
}
