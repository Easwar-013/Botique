import React from 'react';
import { Outlet } from 'react-router-dom';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { CartDrawer } from '../components/common/CartDrawer';

const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />

      <CartDrawer />
    </div>
  );
};

export default CustomerLayout;