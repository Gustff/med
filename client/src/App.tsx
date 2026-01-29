import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import CaseSelection from "@/pages/case-selection";
import Simulation from "@/pages/simulation";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const isAuthenticated = localStorage.getItem("usilmedai_authenticated") === "true";
  
  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/cases">
        {() => <ProtectedRoute component={CaseSelection} />}
      </Route>
      <Route path="/simulation/:caseId">
        {(params) => {
          const isAuthenticated = localStorage.getItem("usilmedai_authenticated") === "true";
          if (!isAuthenticated) {
            return <Redirect to="/" />;
          }
          return <Simulation />;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
