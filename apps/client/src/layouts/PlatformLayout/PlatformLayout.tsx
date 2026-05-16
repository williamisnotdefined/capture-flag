import { useGetMe, useLogout } from "@api/auth";
import { Shell } from "@components/Shell";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SidebarFrame, SidebarInset } from "./SidebarShell";
import { TopHeader } from "./TopHeader";
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
        <TopHeader onToggleSidebar={sidebar.toggleSidebar} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarFrame>
  );
}
