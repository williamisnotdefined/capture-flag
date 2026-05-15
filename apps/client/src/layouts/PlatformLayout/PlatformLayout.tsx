import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useGetMe, useLogout } from "../../api/auth";
import { Button, Eyebrow, Shell } from "../../components";
import { AppSidebar } from "./AppSidebar";
import { ContextSelectors } from "./ContextSelectors";

export function PlatformLayout() {
  const navigate = useNavigate();
  const meQuery = useGetMe();
  const logoutMutation = useLogout({
    onSuccess: () => {
      navigate("/login");
    },
  });

  if (meQuery.isLoading) {
    return <Shell title="Capture Flag">Carregando sessao...</Shell>;
  }

  if (meQuery.isError) {
    return <Navigate to="/login" replace />;
  }

  const me = meQuery.data;
  if (!me) {
    return <Shell title="Capture Flag">Sessao indisponivel.</Shell>;
  }

  return (
    <div className="min-h-screen bg-[#f4f0e8] lg:flex">
      <AppSidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-[#e3d8c7] bg-[#f4f0e8]/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-[1360px] flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Eyebrow>Workspace</Eyebrow>
                <strong className="text-slate-900">Capture Flag</strong>
              </div>
              <Button
                className="px-3 py-2 xl:hidden"
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
                variant="secondary"
              >
                Sair
              </Button>
            </div>
            <ContextSelectors />
            <div className="hidden items-center gap-3 xl:flex">
              <div className="text-right text-sm">
                <span className="block font-bold text-slate-900">{me.user.name}</span>
                {me.user.email ? (
                  <span className="block text-xs text-stone-600">{me.user.email}</span>
                ) : null}
              </div>
              <Button
                disabled={logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                type="button"
                variant="secondary"
              >
                Sair
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1360px] px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
