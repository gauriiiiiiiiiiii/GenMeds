// FIX: Changed React import to a default import to resolve JSX intrinsic element type errors.
import React from 'react';
import { Header } from './components/Header';
import { PrescriptionUploader } from './components/PrescriptionUploader';
import { MedicineSearch } from './components/MedicineSearch';
import { StoreLocator } from './components/StoreLocator';
import { InteractionChecker } from './components/InteractionChecker';
import { PillIdentifier } from './components/PillIdentifier';
import { SymptomChecker } from './components/SymptomChecker';
import { PillIcon, DocumentTextIcon, MapPinIcon, ShieldCheckIcon, CameraIcon, HealthIcon, SparklesIcon, MedicalBagIcon } from './components/Icons';

type MajorTab = 'analysis' | 'tools';
type MinorTab = 'prescription' | 'pill-id' | 'symptoms' | 'search' | 'interactions' | 'locator';

interface TabConfig {
  id: MinorTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: Record<MajorTab, { label: string, icon: React.ReactNode, subTabs: TabConfig[] }> = {
  analysis: {
    label: "AI Analysis",
    icon: <SparklesIcon />,
    subTabs: [
      { id: 'prescription', label: 'Prescription', icon: <DocumentTextIcon /> },
      { id: 'pill-id', label: 'Pill ID', icon: <CameraIcon /> },
      { id: 'symptoms', label: 'Symptoms', icon: <HealthIcon /> },
    ],
  },
  tools: {
    label: "Medicine Tools",
    icon: <MedicalBagIcon />,
    subTabs: [
      { id: 'search', label: 'Search', icon: <PillIcon /> },
      { id: 'interactions', label: 'Interactions', icon: <ShieldCheckIcon /> },
      { id: 'locator', label: 'Locator', icon: <MapPinIcon /> },
    ],
  },
};

const App: React.FC = () => {
  const [activeMajorTab, setActiveMajorTab] = React.useState<MajorTab>('analysis');
  const [activeMinorTab, setActiveMinorTab] = React.useState<MinorTab>('prescription');

  // State for cross-component navigation
  const [initialSearchQuery, setInitialSearchQuery] = React.useState<string>('');
  const [initialInteractionMeds, setInitialInteractionMeds] = React.useState<string[]>([]);

  const handleMajorTabClick = (tabId: MajorTab) => {
    setActiveMajorTab(tabId);
    setActiveMinorTab(tabs[tabId].subTabs[0].id);
  };

  const navigateToSearch = React.useCallback((query: string) => {
    setActiveMajorTab('tools');
    setActiveMinorTab('search');
    setInitialSearchQuery(query);
  }, []);

  const navigateToInteractionChecker = React.useCallback((medicine: string) => {
    setActiveMajorTab('tools');
    setActiveMinorTab('interactions');
    setInitialInteractionMeds([medicine]);
  }, []);

  const renderActiveComponent = () => {
    switch (activeMinorTab) {
      case 'prescription': return <PrescriptionUploader navigateToSearch={navigateToSearch} navigateToInteractionChecker={navigateToInteractionChecker} />;
      case 'pill-id': return <PillIdentifier />;
      case 'symptoms': return <SymptomChecker />;
      case 'search': return <MedicineSearch initialQuery={initialSearchQuery} clearInitialQuery={() => setInitialSearchQuery('')} />;
      case 'interactions': return <InteractionChecker initialMedicines={initialInteractionMeds} clearInitialMedicines={() => setInitialInteractionMeds([])} />;
      case 'locator': return <StoreLocator />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Header />
      <main className="container mx-auto max-w-7xl p-4 md:p-8 flex-grow">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 bg-slate-50/50">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Intelligent Health Decisions, Made Simple.</h1>
            <p className="text-slate-500 mt-1">GenMeds is your decision-support tool for finding safe and affordable generic medicines in India. We provide transparent information, not prescriptions or products.</p>
          </div>
          
          <div className="flex border-b border-slate-200">
            {Object.entries(tabs).map(([tabId, tabData]) => (
              <MajorTabButton
                key={tabId}
                label={tabData.label}
                icon={tabData.icon}
                isActive={activeMajorTab === tabId}
                onClick={() => handleMajorTabClick(tabId as MajorTab)}
              />
            ))}
          </div>
          
          <div className="flex border-b border-slate-200 bg-slate-50">
             {tabs[activeMajorTab].subTabs.map(subTab => (
                 <SubTabButton
                    key={subTab.id}
                    label={subTab.label}
                    isActive={activeMinorTab === subTab.id}
                    onClick={() => setActiveMinorTab(subTab.id)}
                 />
             ))}
          </div>
          
          <div className="p-4 md:p-8 min-h-[500px]">
            {renderActiveComponent()}
          </div>
        </div>
      </main>
      <footer className="text-center text-slate-400 py-8 px-4 text-sm">
        <p>&copy; {new Date().getFullYear()} GenMeds. All rights reserved.</p>
        <p className="mt-1">Disclaimer: GenMeds is an informational decision-support tool and not a pharmacy. Always consult a healthcare professional before making any medical decisions.</p>
      </footer>
    </div>
  );
};

interface MajorTabButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const MajorTabButton: React.FC<MajorTabButtonProps> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'bg-white text-cyan-600';
  const inactiveClasses = 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-700';
  
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 p-4 font-semibold text-lg transition-colors duration-200 ${isActive ? activeClasses : inactiveClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

interface SubTabButtonProps {
    label: string;
    isActive: boolean;
    onClick: () => void;
}
  
const SubTabButton: React.FC<SubTabButtonProps> = ({ label, isActive, onClick }) => {
    const activeClasses = 'bg-white text-cyan-600';
    const inactiveClasses = 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-700';
    
    return (
      <button
        onClick={onClick}
        className={`flex-1 py-3 text-sm font-semibold transition-colors duration-200 text-center border-r border-slate-200 last:border-r-0 ${isActive ? activeClasses : inactiveClasses}`}
        aria-current={isActive ? 'page' : undefined}
      >
        {label}
      </button>
    );
};

export default App;