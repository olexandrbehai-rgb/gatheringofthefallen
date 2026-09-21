import { useEffect } from "react";
import { ClerkProvider, SignIn, SignUp } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { CartProvider } from "@/hooks/useCart";
import { CurrencyProvider } from "@/hooks/useCurrency";
import { AmbientMusicProvider } from "@/hooks/useAmbientMusic";
import { trackEvent } from "@/lib/analytics";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Music from "@/pages/Music";
import Merch from "@/pages/Merch";
import Contacts from "@/pages/Contacts";
import Game from "@/pages/Game";
import AuthorsWorld from "@/pages/AuthorsWorld";
import AuthorProfile from "@/pages/AuthorProfile";
import AuthorMemoryPage from "@/pages/AuthorMemoryPage";
import MyPortal from "@/pages/MyPortal";
import AuthorAvatarPreview from "@/pages/AuthorAvatarPreview";
import OwnerAnalytics from "@/pages/OwnerAnalytics";
import AuthorAnalytics from "@/pages/AuthorAnalytics";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: "simple" as const,
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#ff4500",
    colorForeground: "#f4e9ff",
    colorMutedForeground: "#b5a6c6",
    colorDanger: "#ff6b6b",
    colorBackground: "#0b0614",
    colorInput: "#160d22",
    colorInputForeground: "#ffffff",
    colorNeutral: "#542873",
    fontFamily: "'Share Tech Mono', monospace",
    borderRadius: "0.75rem",
  },
};

function SignInPage() {
  return (
    <div className="auth-shell flex min-h-[100dvh] flex-col items-center justify-center bg-[#050208] px-4 py-10">
      <div className="mb-5 flex w-full max-w-md justify-between gap-3">
        <Link href="/" className="neon-control inline-flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">
          ← Повернутися на сайт
        </Link>
        <Link href="/sign-up" className="neon-control inline-flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffcf9e]">
          Реєстрація
        </Link>
      </div>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} appearance={clerkAppearance} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="auth-shell flex min-h-[100dvh] flex-col items-center justify-center bg-[#050208] px-4 py-10">
      <div className="mb-5 flex w-full max-w-md justify-between gap-3">
        <Link href="/" className="neon-control inline-flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#b9f7ff]">
          ← Повернутися на сайт
        </Link>
        <Link href="/sign-in" className="neon-control inline-flex items-center px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#ffcf9e]">
          Уже маю акаунт
        </Link>
      </div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} appearance={clerkAppearance} />
    </div>
  );
}

function OwnerAnalyticsRoute() {
  return <OwnerAnalytics />;
}

function SiteRouter({ authEnabled = true }: { authEnabled?: boolean }) {
  const [location] = useLocation();

  useEffect(() => {
    trackEvent("page_viewed", { path: location });
  }, [location]);

  return (
    <Switch>
      {authEnabled && <Route path="/sign-in/*?" component={SignInPage} />}
      {authEnabled && <Route path="/sign-up/*?" component={SignUpPage} />}
      {authEnabled && <Route path="/owner-analytics" component={OwnerAnalyticsRoute} />}
      {authEnabled && <Route path="/author-analytics" component={AuthorAnalytics} />}
      {!authEnabled && <Route path="/sign-in/*?"><Redirect to="/" /></Route>}
      {!authEnabled && <Route path="/sign-up/*?"><Redirect to="/" /></Route>}
      {!authEnabled && <Route path="/owner-analytics"><Redirect to="/" /></Route>}
      {!authEnabled && <Route path="/author-analytics"><Redirect to="/" /></Route>}
      <Route path="/author-avatar-preview" component={AuthorAvatarPreview} />
      <Route
        path="/game"
        component={() => (
          <Layout authEnabled={authEnabled}>
            <Game />
          </Layout>
        )}
      />
      <Route>
          <Layout authEnabled={authEnabled}>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/music" component={Music} />
            <Route path="/merch" component={Merch} />
            <Route path="/contacts" component={Contacts} />
            <Route path="/authors-world" component={AuthorsWorld} />
            <Route path="/my-portal" component={MyPortal} />
            <Route path="/author/:slug/memory/:memoryId" component={AuthorMemoryPage} />
            <Route path="/author/:slug" component={AuthorProfile} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function AuthenticatedApp() {
  const [, setLocation] = useLocation();

  if (!clerkPubKey) {
    return <SiteRouter authEnabled={false} />;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={import.meta.env.PROD ? clerkProxyUrl : undefined}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(to.replace(basePath, "") || "/")}
      routerReplace={(to) => setLocation(to.replace(basePath, "") || "/")}
      localization={{
        signIn: {
          start: {
            title: "Вхід до приватної панелі",
            subtitle: "Тільки для власника сайту",
          },
        },
        signUp: {
          start: {
            title: "Створення доступу власника",
            subtitle: "Підтвердь свій email для продовження",
          },
        },
      }}
    >
      <SiteRouter />
    </ClerkProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <CurrencyProvider>
          <AmbientMusicProvider>
            <CartProvider>
              <TooltipProvider>
                <WouterRouter base={basePath}>
                  <AuthenticatedApp />
                </WouterRouter>
                <Toaster />
              </TooltipProvider>
            </CartProvider>
          </AmbientMusicProvider>
        </CurrencyProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;