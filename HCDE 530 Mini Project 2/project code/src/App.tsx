import { SessionProvider, useSession } from './context/SessionContext';
import { EntryScreen } from './screens/EntryScreen';
import { IntakeFlowScreen } from './screens/IntakeFlowScreen';
import { HMWGenerationScreen } from './screens/HMWGenerationScreen';
import { HMWEditorScreen } from './screens/HMWEditorScreen';
import { DirectHMWScreen } from './screens/DirectHMWScreen';
import { PreSessionScreen } from './screens/PreSessionScreen';
import { CrazyEightsScreen } from './screens/CrazyEightsScreen';
import { SummaryScreen } from './screens/SummaryScreen';

function Router() {
  const { screen } = useSession();

  switch (screen) {
    case 'entry':        return <EntryScreen />;
    case 'intake':       return <IntakeFlowScreen />;
    case 'hmwGeneration': return <HMWGenerationScreen />;
    case 'hmwEditor':    return <HMWEditorScreen />;
    case 'directHMW':   return <DirectHMWScreen />;
    case 'preSession':   return <PreSessionScreen />;
    case 'crazyEights':  return <CrazyEightsScreen />;
    case 'summary':      return <SummaryScreen />;
    default:             return <EntryScreen />;
  }
}

function App() {
  return (
    <SessionProvider>
      <Router />
    </SessionProvider>
  );
}

export default App;
