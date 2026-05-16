import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useGetMe, useLogout } from "../../api/auth";
import { Shell } from "../../components";
import { AppSidebar } from "./AppSidebar";
import { ContextSelectors } from "./ContextSelectors";
import { SidebarFrame, SidebarInset, SidebarTrigger } from "./SidebarShell";
import { useSidebarState } from "./useSidebarState";

export function PlatformLayout() {
  const navigate = useNavigate();
  const sidebar = useSidebarState();
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
    <SidebarFrame panelState={sidebar.panelState}>
      <AppSidebar
        desktopOpen={sidebar.desktopOpen}
        isLogoutPending={logoutMutation.isPending}
        mobileOpen={sidebar.mobileOpen}
        onLogout={() => logoutMutation.mutate()}
        onMobileOpenChange={sidebar.setMobileOpen}
        onToggleSidebar={sidebar.toggleSidebar}
        user={me.user}
      />
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:px-6">
          <div className="mx-auto flex max-w-7xl items-start gap-3">
            <SidebarTrigger className="mt-5" onToggle={sidebar.toggleSidebar} />
            <div className="mt-6 h-6 w-px shrink-0 bg-border" />
            <div className="min-w-0 flex-1">
              <ContextSelectors />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarFrame>
  );
}
