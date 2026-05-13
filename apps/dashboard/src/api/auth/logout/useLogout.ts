import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logout } from "./logout";

type UseLogoutOptions = {
  onSuccess?: () => void;
};

export function useLogout({ onSuccess }: UseLogoutOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      onSuccess?.();
    },
  });
}
