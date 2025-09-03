import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout'; // Import your new layout component
import WooCommerceAnalytics from './components/WooCommerceAnalytics';
import Expenditures from './components/Expenditures';

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<WooCommerceAnalytics />} />
          <Route path="/expenditures" element={<Expenditures />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}

export default App;