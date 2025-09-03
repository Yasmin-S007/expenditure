import React from 'react';
import { NavLink } from 'react-router-dom';
import { TrendingUp, DollarSign } from 'lucide-react';

const AppLayout = ({ children }) => {
  return (
    <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 min-h-screen bg-gray-800 text-white p-4">
        <h2 className="text-2xl font-bold mb-8">Analytics</h2>
        <nav>
          <ul>
            <li className="mb-4">
              <NavLink to="/" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors" activeClassName="bg-gray-700">
                <TrendingUp size={20} className="mr-3" />
                WooCommerce Analytics
              </NavLink>
            </li>
            <li className="mb-4">
              <NavLink to="/expenditures" className="flex items-center p-2 rounded-lg hover:bg-gray-700 transition-colors" activeClassName="bg-gray-700">
                <DollarSign size={20} className="mr-3" />
                Expenditures
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;