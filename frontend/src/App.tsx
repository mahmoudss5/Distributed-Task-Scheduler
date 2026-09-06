import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './shared/components/Sidebar/Sidebar';
import OverviewPage from './features/overview/index';
import SubmitJobPage from './features/submitJob/index';
import { useWebSocket } from './shared/websocket/useWebSocket';

const App: React.FC = () => {
  useWebSocket(); // Connect WS at app level, invalidates queries on events

  return (
    <div className="flex h-screen bg-slate-900 dark:bg-slate-950 text-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/submit" element={<SubmitJobPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
