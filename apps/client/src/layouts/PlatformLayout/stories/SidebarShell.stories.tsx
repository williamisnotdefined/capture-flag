import {
  DesktopSidebar,
  MobileSidebarSheet,
  SidebarFrame,
  SidebarInset,
  SidebarTooltip,
  SidebarTrigger,
} from "@layouts/PlatformLayout/SidebarShell";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

const meta = {
  argTypes: {
    children: { control: false },
    panelState: {
      control: "radio",
      options: ["expanded", "collapsed"],
    },
  },
  args: {
    children: null,
    panelState: "expanded",
  },
  component: SidebarFrame,
  parameters: { layout: "fullscreen" },
  title: "Layouts/PlatformLayout/SidebarShell",
} satisfies Meta<typeof SidebarFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleSidebarContent = (
  <div className="flex h-full flex-col gap-2 p-3 text-sm">
    <strong>Capture Flag</strong>
    <span className="rounded-md bg-sidebar-accent p-2">Workspace</span>
    <span className="rounded-md p-2 text-sidebar-foreground/70">Project</span>
  </div>
);

export const Frame: Story = {
  args: {
    children: (
      <>
        <DesktopSidebar onToggle={fn()} open>
          {sampleSidebarContent}
        </DesktopSidebar>
        <SidebarInset className="p-6">Conteudo principal</SidebarInset>
      </>
    ),
  },
};

export const Desktop: StoryObj<typeof DesktopSidebar> = {
  argTypes: {
    children: { control: false },
    onToggle: { action: "toggled" },
    open: { control: "boolean" },
  },
  args: {
    children: sampleSidebarContent,
    onToggle: fn(),
    open: true,
  },
  render: (args) => (
    <SidebarFrame panelState={args.open ? "expanded" : "collapsed"}>
      <DesktopSidebar {...args} />
      <SidebarInset className="p-6">Conteudo principal</SidebarInset>
    </SidebarFrame>
  ),
};

export const MobileSheet: StoryObj<typeof MobileSidebarSheet> = {
  argTypes: {
    children: { control: false },
    onOpenChange: { action: "open changed" },
    open: { control: "boolean" },
  },
  args: {
    children: sampleSidebarContent,
    onOpenChange: fn(),
    open: true,
  },
  render: (args) => (
    <SidebarFrame panelState="expanded">
      <MobileSidebarSheet {...args} />
      <SidebarInset className="p-6">Conteudo principal</SidebarInset>
    </SidebarFrame>
  ),
};

export const Trigger: StoryObj<typeof SidebarTrigger> = {
  argTypes: {
    onToggle: { action: "toggled" },
  },
  args: {
    onToggle: fn(),
  },
  render: (args) => <SidebarTrigger {...args} />,
};

export const Tooltip: StoryObj<typeof SidebarTooltip> = {
  argTypes: {
    children: { control: false },
    enabled: { control: "boolean" },
    label: { control: "text" },
  },
  args: {
    children: (
      <button className="rounded-md border border-border px-3 py-2" type="button">
        Hover
      </button>
    ),
    enabled: true,
    label: "Tooltip da sidebar",
  },
  render: (args) => (
    <SidebarFrame panelState="collapsed">
      <div className="p-8">
        <SidebarTooltip {...args} />
      </div>
    </SidebarFrame>
  ),
};
