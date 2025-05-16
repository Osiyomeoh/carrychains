// src/components/LayoutWithNavbar.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const LayoutWithNavbar = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="bg-white p-6 border-t">
        <div className="container mx-auto text-center text-gray-600">
          <p>CarryChain &copy; {new Date().getFullYear()} - Decentralized Luggage Delivery Platform</p>
        </div>
      </footer>
    </div>
  );
};

export default LayoutWithNavbar;