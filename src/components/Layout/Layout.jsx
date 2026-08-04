// components/Layout/Layout.jsx
import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Toast from '../Notificaciones/Toast';

const Layout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default Layout;