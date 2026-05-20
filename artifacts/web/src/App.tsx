import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { CartProvider } from "@/hooks/useCart";
import { CurrencyProvider } from "@/hooks/useCurrency";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Music from "@/pages/Music";
import Merch from "@/pages/Merch";
import Contacts from "@/pages/Contacts";

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/music" component={Music} />
        <Route path="/merch" component={Merch} />
        <Route path="/contacts" component={Contacts} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
       <CurrencyProvider>
        <CartProvider>
         <TooltipProvider>
           <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
             <Router />
           </WouterRouter>
           <Toaster />
         </TooltipProvider>
        </CartProvider>
       </CurrencyProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
