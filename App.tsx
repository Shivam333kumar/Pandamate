
import React from 'react';
import { AppProvider } from './state';
import Layout from './components/Layout';
import HomeTab from './components/HomeTab';
import SchedulerTab from './components/SchedulerTab';
import SpacedTab from './components/SpacedTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';
import QuoteTab from './components/QuoteTab';
import { useApp } from './state';
import { Tab } from './types';
import PandaMascot from './components/PandaMascot';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  const renderTab = () => {
    switch (activeTab) {
      case Tab.HOME: return <HomeTab />;
      case Tab.SCHEDULER: return <SchedulerTab />;
      case Tab.SPACED: return <SpacedTab />;
      case Tab.SENSEI: return <QuoteTab />;
      case Tab.ANALYTICS: return <AnalyticsTab />;
      case Tab.SETTINGS: return <SettingsTab />;
      default: return <HomeTab />;
    }
  };

  return (
    <Layout>
      <div className="pb-24 pt-4 px-4 h-full overflow-y-auto no-scrollbar">
        {renderTab()}
      </div>
      {/* Panda Mascot visible on Home, Settings, and Sensei */}
      {(activeTab === Tab.HOME || activeTab === Tab.SETTINGS || activeTab === Tab.SENSEI) && <PandaMascot size="small" />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
