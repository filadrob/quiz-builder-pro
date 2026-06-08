import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "../lib/theme-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1
          className="text-7xl font-bold"
          style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-teal)' }}
        >
          404
        </h1>
        <h2 className="mt-4 text-xl font-semibold" style={{ color: 'var(--mako-ink)' }}>
          Page not found
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--mako-sub)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center clip-mako px-4 py-2 text-sm font-medium tracking-widest uppercase transition-[box-shadow]"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'linear-gradient(160deg, var(--mako-teal), var(--mako-correct))',
              color: '#04120d',
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1
          className="text-xl font-semibold tracking-tight"
          style={{ color: 'var(--mako-wrong)' }}
        >
          This page didn't load
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--mako-sub)' }}>
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="clip-mako px-4 py-2 text-sm font-medium tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'linear-gradient(160deg, var(--mako-teal), var(--mako-correct))',
              color: '#04120d',
            }}
          >
            Try again
          </button>
          <a
            href="/"
            className="clip-mako px-4 py-2 text-sm font-medium tracking-widest uppercase"
            style={{
              fontFamily: 'var(--font-ui)',
              background: 'var(--mako-panel)',
              boxShadow: 'inset 0 0 0 1px var(--mako-line)',
              color: 'var(--mako-ink)',
            }}
          >
            Go home
          </a>
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
      { title: "Quiz Platform" },
      { name: "description", content: "Image-based multiple-choice quizzes with leaderboards." },
      { property: "og:title", content: "Quiz Platform" },
      { property: "og:description", content: "Image-based multiple-choice quizzes with leaderboards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=Share+Tech+Mono&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('mako-theme')||'dark';var d=t==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):t;document.documentElement.classList.toggle('dark',d==='dark')}catch(e){}`,
          }}
        />
      </head>
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
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
