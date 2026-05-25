import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground font-mono">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Signal lost</h2>
        <p className="mt-2 text-sm text-muted-foreground">This page is not on the grid.</p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center rounded bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Crash detected</h1>
        <p className="mt-2 text-sm text-muted-foreground">A component failed to render.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded bg-accent px-4 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90">
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EmuCloud — Low-spec cloud gaming for PS2/PS3" },
      { name: "description", content: "Stream PS2 (PCSX2) and PS3 (RPCS3) emulation from a remote GPU. Buy session tickets via Mobile Money." },
      { property: "og:title", content: "EmuCloud — Low-spec cloud gaming for PS2/PS3" },
      { name: "twitter:title", content: "EmuCloud — Low-spec cloud gaming for PS2/PS3" },
      { property: "og:description", content: "Stream PS2 (PCSX2) and PS3 (RPCS3) emulation from a remote GPU. Buy session tickets via Mobile Money." },
      { name: "twitter:description", content: "Stream PS2 (PCSX2) and PS3 (RPCS3) emulation from a remote GPU. Buy session tickets via Mobile Money." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ef523531-7e03-4888-8d5f-d06557f139d1/id-preview-70cf9146--e7bc8934-f174-4996-a3e2-bb08d2ea4cec.lovable.app-1779653778849.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/ef523531-7e03-4888-8d5f-d06557f139d1/id-preview-70cf9146--e7bc8934-f174-4996-a3e2-bb08d2ea4cec.lovable.app-1779653778849.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-right" />
    </QueryClientProvider>
  );
}
