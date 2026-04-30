import { axiosFetch } from "@/api/Fetch";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/api/types";

const API_URL_BASE = "/api";

type UserGroup = {
  id: string;
  displayName: string;
};

export type UserInfo = {
  groups: UserGroup[];
  user: User;
  superuser: boolean;
  reportinguser: boolean;
};

export const useUser = () => {
  return useQuery({
    queryKey: ["userinfo"],
    queryFn: () =>
      axiosFetch<UserInfo>({ url: `${API_URL_BASE}/userinfo` }).then(
        (response) => response.data,
      ),
  });
};

export function useFetchUsername(userId: string) {
  return useQuery({
    queryKey: ["username", userId],
    queryFn: () =>
      axiosFetch<string>({
        url: `${API_URL_BASE}/userinfo/${userId}/username`,
      }).then((response) => response.data),
    enabled: userId !== undefined,
  });
}
