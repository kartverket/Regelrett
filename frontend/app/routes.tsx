import { createBrowserRouter } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

// TODO: Referer til react-router dokumentasjon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convert(m: any) {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader,
    action: clientAction,
    Component,
  };
}

const router = createBrowserRouter([
  {
    lazy: () =>
      import("./components/protectedRoute/ProtectedRoute").then(convert),
    hydrateFallbackElement: <Skeleton />,
    children: [
      {
        path: "/context/:contextId",
        lazy: () => import("./pages/activityPage/ActivityPage").then(convert),
      },
      {
        path: "/context/:contextId/:recordId",
        lazy: () => import("./pages/questionPage/QuestionPage").then(convert),
      },
      {
        path: "/ny",
        lazy: () =>
          import("./pages/createContextPage/CreateContextPage").then(convert),
      },
      {
        path: "/",
        lazy: () => import("./pages/frontPage/FrontPage").then(convert),
      },
    ],
  },
]);

export default router;
