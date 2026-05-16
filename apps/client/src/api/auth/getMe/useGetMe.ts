import { authQueryKeys } from "@api/auth/queryKeys";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "./getMe";

export function useGetMe() {
  return useQuery({
    queryFn: getMe,
    queryKey: authQueryKeys.me(),
    retry: false,
  });
}
