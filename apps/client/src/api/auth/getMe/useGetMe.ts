import { useQuery } from "@tanstack/react-query";
import { authQueryKeys } from "../queryKeys";
import { getMe } from "./getMe";

export function useGetMe() {
  return useQuery({
    queryFn: getMe,
    queryKey: authQueryKeys.me(),
    retry: false,
  });
}
