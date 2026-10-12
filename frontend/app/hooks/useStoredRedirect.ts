import { useSearchParams } from "react-router";
import { useSessionStorageState } from "./useStorageState";
import { useEffect, useMemo } from "react";

type StoredRedirect = {
  url: string;
  title: string;
};

export function useStoredRedirect() {
  const [searchParams] = useSearchParams();
  const redirectBackUrl = searchParams.get("redirectBackUrl");
  const redirectBackTitle = searchParams.get("redirectBackTitle");

  const redirectBack = useMemo(
    () =>
      redirectBackUrl
        ? {
            url: redirectBackUrl,
            title: redirectBackTitle ?? new URL(redirectBackUrl).hostname,
          }
        : null,
    [redirectBackUrl, redirectBackTitle],
  );

  const [storedRedirect, setStoredRedirect] =
    useSessionStorageState<StoredRedirect | null>("redirectBack", redirectBack);

  useEffect(() => {
    if (redirectBack) {
      setStoredRedirect(redirectBack);
    }
  }, [setStoredRedirect, redirectBack]);

  return storedRedirect;
}
