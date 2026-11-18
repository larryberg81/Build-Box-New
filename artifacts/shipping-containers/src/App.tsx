import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Containers from "@/pages/containers";
import Contact from "@/pages/contact";
import Quote from "@/pages/quote";
import Projects from "@/pages/projects";
import Availability from "@/pages/availability";
import Resources from "@/pages/resources";
import Gensets from "@/pages/gensets";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Seo } from "@/components/seo";
import { MarketProvider } from "@/contexts/market";
import { SalesNotification } from "@/components/sales-notification";

const queryClient = new QueryClient();
const AdminAuthPortal = lazy(() => import("@/pages/admin-auth"));

function AdminRoute() {
  return <Suspense fallback={<p role="status" className="p-12 text-center">Loading secure sign-in…</p>}><AdminAuthPortal /></Suspense>;
}

function Router() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/admin/*?" component={AdminRoute} />
          <Route path="/sign-in/*?" component={AdminRoute} />
          <Route path="/sign-up/*?" component={AdminRoute} />
          <Route path="/" component={Home} />
          <Route path="/containers" component={Containers} />
          <Route path="/contact" component={Contact} />
          <Route path="/quote" component={Quote} />
          <Route path="/projects" component={Projects} />
          <Route path="/availability" component={Availability} />
          <Route path="/resources" component={Resources} />
          <Route path="/gensets" component={Gensets} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MarketProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
            <Seo />
            <Router />
            <SalesNotification />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </MarketProvider>
    </QueryClientProvider>
  );
}

export default App;
