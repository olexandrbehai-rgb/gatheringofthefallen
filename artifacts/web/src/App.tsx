import { useEffect, useState } from "react";
import { ClerkProvider, SignIn, SignUp, useUser } from "@clerk/react";
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
const API_ROOT = `${basePath}/api`;
const PRIVACY_NOTICE_STORAGE_KEY = "gtf-privacy-notice-accepted-v1";

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
  elements: {
    socialButtonsBlockButton: "border-[#542873] bg-[#160d22] text-[#f4e9ff] hover:bg-[#271236]",
    socialButtonsBlockButtonText: "text-[#f4e9ff]",
    dividerText: "text-[#b5a6c6]",
    formFieldLabel: "text-[#f4e9ff]",
    formFieldInput: "bg-[#160d22] text-white",
    formButtonPrimary: "bg-[#ff4500] text-white hover:bg-[#ff5c1a]",
    footerActionText: "text-[#b5a6c6]",
    footerActionLink: "text-[#ffb184]",
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
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    try {
      return window.localStorage.getItem(PRIVACY_NOTICE_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

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
      {privacyAccepted && (
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} appearance={clerkAppearance} />
      )}
      {!privacyAccepted && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-notice-title"
        >
          <section className="flex max-h-[calc(100dvh-1rem)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#00f0ff]/45 bg-[#0b0614] shadow-[0_0_35px_rgba(0,240,255,0.2),0_0_90px_rgba(138,43,226,0.18)] sm:max-h-[calc(100dvh-3rem)]">
            <div className="shrink-0 border-b border-white/10 px-3 py-3 sm:px-7 sm:py-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#ffcf9e]">
                Повідомлення про конфіденційність · Privacy notice
              </p>
              <h1 id="privacy-notice-title" className="mt-1.5 font-creepster text-xl tracking-[0.08em] text-[#00f0ff] sm:mt-2 sm:text-3xl">
                Вхід через Google / Sign in with Google
              </h1>
            </div>

            <div className="min-h-0 overflow-y-auto px-3 py-3 sm:px-7 sm:py-5">
              <div className="space-y-3 font-mono text-[10px] leading-[1.45] text-white/75 sm:space-y-4 sm:text-xs sm:leading-relaxed">
                <div>
                  <p className="mb-1.5 font-bold uppercase tracking-[0.12em] text-[#b9f7ff] sm:mb-2">Українською</p>
                  <p>
                    Для входу на сайт ви можете використати свій Google-акаунт. Авторизація проходить через Google та захищений сервіс Clerk. Ми не отримуємо і не зберігаємо ваш пароль Google. Сайт отримує лише необхідні дані профілю — ім’я, email та, за наявності, фото профілю — для створення й обслуговування вашого акаунта.
                  </p>
                </div>
                <div>
                  <p className="mb-1.5 font-bold uppercase tracking-[0.12em] text-[#b9f7ff] sm:mb-2">English</p>
                  <p>
                    You may use your Google account to sign in to this website. Authentication is handled by Google and the secure Clerk service. We do not receive or store your Google password. The site receives only the profile information needed to create and operate your account — your name, email address and, if available, profile photo.
                  </p>
                </div>
                <div className="grid gap-1.5 rounded-lg border border-[#ffcf9e]/25 bg-[#ffcf9e]/[.06] p-2.5 text-[#ffcf9e] sm:gap-2 sm:p-3">
                  <p>Не вводьте в профілі, чатах або повідомленнях паролі, платіжні реквізити чи інші конфіденційні дані.</p>
                  <p>Do not enter passwords, payment details or other confidential information in profiles, chats or messages.</p>
                </div>
              </div>

              <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-lg border border-white/15 bg-black/25 p-2.5 font-mono text-[11px] leading-[1.4] text-white transition-colors hover:border-[#00f0ff]/60 sm:mt-5 sm:gap-3 sm:p-4 sm:text-xs sm:leading-relaxed">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(event) => setPrivacyChecked(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#00f0ff]"
                />
                <span>
                  Я прочитав(ла) повідомлення та погоджуюся продовжити реєстрацію.
                  <span className="mt-1 block text-white/65">
                    I have read this notice and agree to continue registration.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-5">
              <Link href="/" className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 transition-colors hover:text-white sm:text-left">
                ← Повернутися / Go back
              </Link>
              <button
                type="button"
                disabled={!privacyChecked}
                onClick={() => {
                  try {
                    window.localStorage.setItem(PRIVACY_NOTICE_STORAGE_KEY, "true");
                  } catch {
                    // Continue even when browser storage is unavailable.
                  }
                  setPrivacyAccepted(true);
                }}
                className="w-full rounded border border-[#00f0ff]/70 bg-[#00f0ff]/10 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#b9f7ff] transition-all hover:bg-[#00f0ff]/20 hover:text-white disabled:cursor-not-allowed disabled:border-white/15 disabled:bg-white/[.04] disabled:text-white/35 sm:w-auto sm:py-3"
              >
                Продовжити / Continue
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function AuthorPresence() {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let active = true;

    const reportPresence = () => {
      if (!active) return;
      void fetch(`${API_ROOT}/authors-world/presence`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => {
        // Presence is best effort and must not interrupt the current page.
      });
    };

    reportPresence();
    const interval = window.setInterval(reportPresence, 20_000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") reportPresence();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn]);

  return null;
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
      proxyUrl={clerkProxyUrl}
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
      <AuthorPresence />
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