import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import AdminSalesPage from "./admin-sales";

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || "/" : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#D94A00",
    colorForeground: "#20262D",
    colorMutedForeground: "#59616B",
    colorDanger: "#C22B2B",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#20262D",
    colorNeutral: "#20262D",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.25rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-sm w-[440px] max-w-full overflow-hidden border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground",
    formFieldLabel: "text-foreground",
    footerActionLink: "text-primary",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-foreground",
    alertText: "text-destructive",
    logoBox: "justify-center",
    logoImage: "h-12 w-auto",
    socialButtonsBlockButton: "border border-border bg-white",
    formButtonPrimary: "bg-primary text-white",
    formFieldInput: "bg-white text-foreground border border-border",
    footerAction: "bg-muted/40",
    dividerLine: "bg-border",
    alert: "border border-destructive/30 bg-destructive/5",
    otpCodeFieldInput: "bg-white text-foreground border-border",
    formFieldRow: "gap-2",
    main: "gap-5",
  },
};

function AuthFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-[70vh] px-4 py-12 md:py-20 bg-background">
      <div className="mx-auto max-w-md text-center mb-7">
        <ShieldCheck className="mx-auto mb-3 size-8 text-primary" aria-hidden="true" />
        <p className="font-bold text-primary uppercase tracking-widest text-xs mb-2">Private owner access</p>
        <h1 className="text-3xl font-bold uppercase">Sales administration</h1>
        <p className="text-sm text-muted-foreground mt-3">Manage genuine completed purchases and their public notifications. Only the designated administrator can access sales.</p>
      </div>
      {children}
      <div className="text-center mt-6"><Link href="/" className="text-sm text-primary underline">Back to website</Link></div>
    </section>
  );
}

function SignInPage() {
  return <AuthFrame><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} fallbackRedirectUrl={`${basePath}/admin/sales`} /></AuthFrame>;
}

function SignUpPage() {
  return <AuthFrame><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} fallbackRedirectUrl={`${basePath}/admin/sales`} /></AuthFrame>;
}

function ProtectedSales() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p role="status" className="p-12 text-center">Checking your sign-in…</p>;
  return isSignedIn ? <AdminSalesPage /> : <Redirect to="/sign-in" />;
}

function ClearPrivateCache() {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const previousUser = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }) => {
    const nextUser = user?.id ?? null;
    if (previousUser.current !== undefined && previousUser.current !== nextUser) queryClient.clear();
    previousUser.current = nextUser;
  }), [addListener, queryClient]);
  return null;
}

export default function AdminAuthPortal() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    document.title = "Sales Administration | Built Box Containers";
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow";
    document.head.appendChild(robots);
    return () => robots.remove();
  }, []);
  if (!clerkPubKey) {
    return <AuthFrame><p role="alert" className="mx-auto max-w-md border border-border bg-card p-6">Administrator sign-in is not configured for this deployment. The public website remains available.</p></AuthFrame>;
  }
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Owner sign in", subtitle: "Sign in to manage verified sales" } },
        signUp: { start: { title: "Verify your account", subtitle: "Administrator access is restricted to the designated owner" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <ClearPrivateCache />
      <Switch>
        <Route path="/sign-in/*?" component={SignInPage} />
        <Route path="/sign-up/*?" component={SignUpPage} />
        <Route path="/admin/*?" component={ProtectedSales} />
      </Switch>
    </ClerkProvider>
  );
}
