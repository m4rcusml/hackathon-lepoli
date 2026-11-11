"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { createHttpApi } from "@/lib/api/http";
import type { DoctorApi, Timed } from "@/lib/api/doctor-api";
import type { AccessContext, Mode, Schemas, Session } from "@/lib/api/types";
import { scenarioNames, type DemoScenario } from "@/lib/demo/scenarios";
import type { createDemoApi } from "@/lib/demo/api";

type Demo = ReturnType<typeof createDemoApi>;
type Context = {
  mode: Mode;
  api: DoctorApi;
  session: Session | undefined;
  sessionReady: boolean;
  sessionError: Error | null;
  refreshSession: () => void;
  clear: () => void;
  base: string;
  temporary: AccessContext | null;
  setTemporary: (v: AccessContext | null) => void;
  invitation: Schemas["SharingResolution"] | null;
  setInvitation: (v: Schemas["SharingResolution"] | null) => void;
  demo?: Demo["controls"];
  scenario: DemoScenario;
  changeScenario: (value: DemoScenario) => void;
};
const Runtime = createContext<Context | null>(null);
export const useDoctor = () => {
  const value = useContext(Runtime);
  if (!value) throw new Error("Missing runtime");
  return value;
};
export type Received<T> = Timed<T> & { receivedAt: number };
export const receive = <T,>(r: Timed<T>): Received<T> => ({
  ...r,
  receivedAt: performance.now(),
});
export function useExpired(
  expiresAt: string | null | undefined,
  response: { serverTime: string; receivedAt: number } | undefined,
) {
  const deadline =
    expiresAt && response
      ? new Date(expiresAt).getTime() -
        new Date(response.serverTime).getTime() +
        response.receivedAt
      : Infinity;
  const subscribe = useCallback(
    (notify: () => void) => {
      if (!Number.isFinite(deadline)) return () => {};
      let timer: ReturnType<typeof setTimeout>;
      const schedule = () => {
        timer = setTimeout(
          () => {
            notify();
            if (performance.now() < deadline) schedule();
          },
          Math.max(0, Math.min(deadline - performance.now() + 1, 2147483647)),
        );
      };
      schedule();
      return () => clearTimeout(timer);
    },
    [deadline],
  );
  const getSnapshot = useCallback(
    () => performance.now() >= deadline,
    [deadline],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
export function DoctorProvider({
  mode,
  children,
}: {
  mode: Mode;
  children: ReactNode;
}) {
  const [scenario, setScenario] = useState<DemoScenario>("active-initial");
  const [generation, setGeneration] = useState(0);
  return (
    <RuntimeInstance
      key={`${mode}:${scenario}:${generation}`}
      mode={mode}
      scenario={scenario}
      changeScenario={setScenario}
      reset={() => setGeneration((x) => x + 1)}
    >
      {children}
    </RuntimeInstance>
  );
}
function RuntimeInstance({
  mode,
  scenario,
  changeScenario,
  reset,
  children,
}: {
  mode: Mode;
  scenario: DemoScenario;
  changeScenario: (v: DemoScenario) => void;
  reset: () => void;
  children: ReactNode;
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, gcTime: 0, refetchOnReconnect: true },
          mutations: { retry: false },
        },
      }),
  );
  const [demo, setDemo] = useState<Demo>();
  const [http] = useState(() => createHttpApi());
  useEffect(() => {
    if (mode === "demo") {
      let active = true;
      void import("@/lib/demo/api").then(({ createDemoApi }) => {
        if (active) setDemo(createDemoApi(scenario));
      });
      return () => {
        active = false;
      };
    }
  }, [mode, scenario]);
  useEffect(
    () => () => {
      void client.cancelQueries();
      client.clear();
    },
    [client],
  );
  if (mode === "demo" && !demo)
    return (
      <main id="main" className="loading-page" role="status">
        Preparando seu espaço…
      </main>
    );
  return (
    <QueryClientProvider client={client}>
      <SessionRuntime
        mode={mode}
        api={demo?.api ?? http}
        demo={demo?.controls}
        scenario={scenario}
        changeScenario={changeScenario}
        clear={() => {
          void client.cancelQueries();
          client.clear();
          reset();
        }}
      >
        {children}
      </SessionRuntime>
    </QueryClientProvider>
  );
}
function SessionRuntime({
  children,
  ...props
}: Omit<
  Context,
  | "session"
  | "sessionReady"
  | "sessionError"
  | "refreshSession"
  | "temporary"
  | "setTemporary"
  | "invitation"
  | "setInvitation"
  | "base"
> & { children: ReactNode }) {
  const { mode, api } = props;
  const [temporary, setTemporary] = useState<AccessContext | null>(null);
  const [invitation, setInvitation] = useState<
    Schemas["SharingResolution"] | null
  >(null);
  const query = useQuery({
    queryKey: [mode, "session"],
    queryFn: async ({ signal }) => receive(await api.session({ signal })),
    staleTime: 0,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  const expired = useExpired(query.data?.data.expiresAt, query.data);
  const identity = query.data?.data.doctor?.id ?? "anonymous";
  const previousIdentity = useRef(identity);
  useEffect(() => {
    if (previousIdentity.current !== identity) {
      previousIdentity.current = identity;
      setTemporary(null);
      setInvitation(null);
    }
  }, [identity]);
  const validSession = !query.error && !expired ? query.data?.data : undefined;
  const clear = props.clear;
  useEffect(() => {
    if (expired) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Expiry is an external authorization event; discard access metadata.
      setTemporary(null);
      setInvitation(null);
    }
  }, [expired]);
  return (
    <Runtime.Provider
      value={{
        ...props,
        clear,
        session: validSession,
        sessionReady: !query.isPending,
        sessionError: query.error,
        refreshSession: () => {
          void query.refetch();
        },
        base: mode === "demo" ? "/demo/doctor" : "/doctor",
        temporary,
        setTemporary,
        invitation,
        setInvitation,
      }}
    >
      {children}
    </Runtime.Provider>
  );
}
export { scenarioNames };
