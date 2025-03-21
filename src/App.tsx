import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PointsContract } from './pages/PointsContract';
import { CollectibleContract } from './pages/CollectibleContract';
import { CollectibleToken } from './pages/CollectibleToken';
import { Layout } from './components/Layout';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/points/:address" element={<PointsContract />} />
          <Route path="/collectibles/:address" element={<CollectibleContract />} />
          <Route path="/collectibles/:address/token/:tokenId" element={<CollectibleToken />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;