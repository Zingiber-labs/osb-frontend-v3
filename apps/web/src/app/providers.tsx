"use client";

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { SESSION_QUERY_KEY } from "@/hooks/useSession";
import type { User } from "@/lib/auth/schemas";

type ProvidersProps = {
  children: ReactNode;
  initialSession?: User | null;
};

function makeQueryClient(initial: User | null | undefined) {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
  if (initial !== undefined) {
    client.setQueryData(SESSION_QUERY_KEY, initial);
  }
  return client;
}

export function Providers({ children, initialSession }: ProvidersProps) {
  const [client] = useState(() => makeQueryClient(initialSession));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export function SessionHydrator({ session }: { session: User | null }) {
  const qc = useQueryClient();
  useState(() => {
    qc.setQueryData(SESSION_QUERY_KEY, session);
    return null;
  });
  return null;
}
