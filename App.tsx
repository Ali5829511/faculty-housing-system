import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import VehiclesDatabase from "./pages/VehiclesDatabase";
import ViolationsDatabase from "./pages/ViolationsDatabase";
import PlateRecognition from "./pages/PlateRecognition";
import Reports from "./pages/Reports";
import DataCenter from "./pages/DataCenter";
import Settings from "./pages/Settings";
import AdvancedManagement from "./pages/AdvancedManagement";
import IntegrationTest from "@/pages/IntegrationTest";
import BatchProcessing from "@/pages/BatchProcessing";
import FrequencyReport from "./pages/FrequencyReport";
import VisitsLog from "./pages/VisitsLog";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Layout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
      <Route path={"/vehicles"} component={VehiclesDatabase} />
      <Route path={"/violations"} component={ViolationsDatabase} />
      <Route path={"/plate-recognition"} component={PlateRecognition} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/data-center"} component={DataCenter} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/advanced"} component={AdvancedManagement} />
        <Route path="/integration-test" component={IntegrationTest} />
        <Route path="/batch-processing" component={BatchProcessing} />
      <Route path={"/frequency-report"} component={FrequencyReport} />
      <Route path={"/visits-log"} component={VisitsLog} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
