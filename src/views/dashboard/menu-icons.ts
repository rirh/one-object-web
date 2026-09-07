import {
  ActivityIcon,
  BadgeCheckIcon,
  BellIcon,
  ClipboardListIcon,
  Code2Icon,
  CogIcon,
  CreditCardIcon,
  DatabaseIcon,
  FileTextIcon,
  FileCheck2Icon,
  FingerprintIcon,
  FolderIcon,
  GaugeIcon,
  GlobeIcon,
  HashIcon,
  HomeIcon,
  KeyRoundIcon,
  LayersIcon,
  LayoutDashboardIcon,
  ListTreeIcon,
  LockKeyholeIcon,
  LogInIcon,
  MenuIcon,
  MonitorIcon,
  NetworkIcon,
  PanelLeftIcon,
  PlugIcon,
  ServerCogIcon,
  Settings2Icon,
  SettingsIcon,
  ShieldCheckIcon,
  ShieldIcon,
  ShieldUserIcon,
  SlidersHorizontalIcon,
  ScrollTextIcon,
  UsersIcon,
  UsersRoundIcon,
  WorkflowIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react"

export type MenuIconCategory =
  "common" | "system" | "organization" | "content" | "monitor" | "tools"

export type MenuIconCategoryValue = "all" | MenuIconCategory

export type MenuIconOption = {
  category: MenuIconCategory
  Icon: LucideIcon
  label: { "en-US": string; "zh-CN": string }
  value: string
}

export const menuIconCategories: ReadonlyArray<{
  label: { "en-US": string; "zh-CN": string }
  value: MenuIconCategoryValue
}> = [
  { value: "all", label: { "en-US": "All", "zh-CN": "全部" } },
  { value: "common", label: { "en-US": "Common", "zh-CN": "常用" } },
  { value: "system", label: { "en-US": "System", "zh-CN": "系统" } },
  {
    value: "organization",
    label: { "en-US": "Organization", "zh-CN": "组织" },
  },
  { value: "content", label: { "en-US": "Content", "zh-CN": "内容" } },
  { value: "monitor", label: { "en-US": "Monitor", "zh-CN": "监控" } },
  { value: "tools", label: { "en-US": "Tools", "zh-CN": "工具" } },
]

export const menuIconOptions: ReadonlyArray<MenuIconOption> = [
  icon("#", "默认", "Default", "common", HashIcon),
  icon("home", "主页", "Home", "common", HomeIcon),
  icon("layout-dashboard", "首页", "Dashboard", "common", LayoutDashboardIcon),
  icon("code-2", "开发者", "Developer", "common", Code2Icon),
  icon("menu", "菜单", "Menu", "common", MenuIcon),
  icon("settings", "设置", "Settings", "common", SettingsIcon),
  icon("settings-2", "配置", "Configuration", "common", Settings2Icon),
  icon("cog", "系统配置", "System settings", "common", CogIcon),
  icon("panel-left", "侧栏", "Sidebar", "common", PanelLeftIcon),
  icon("layers", "分层", "Layers", "common", LayersIcon),
  icon("workflow", "流程", "Workflow", "common", WorkflowIcon),
  icon("shield", "角色", "Role", "system", ShieldIcon),
  icon("shield-check", "系统管理", "System", "system", ShieldCheckIcon),
  icon("shield-user", "角色管理", "Roles", "system", ShieldUserIcon),
  icon("key-round", "权限", "Permission", "system", KeyRoundIcon),
  icon("lock-keyhole", "安全", "Security", "system", LockKeyholeIcon),
  icon("fingerprint", "身份认证", "Identity", "system", FingerprintIcon),
  icon("log-in", "登录", "Login", "system", LogInIcon),
  icon("badge-check", "审核", "Review", "system", BadgeCheckIcon),
  icon(
    "file-check",
    "应用审核",
    "Application review",
    "system",
    FileCheck2Icon,
  ),
  icon(
    "sliders-horizontal",
    "参数",
    "Parameters",
    "system",
    SlidersHorizontalIcon,
  ),
  icon("users-round", "成员", "Users", "organization", UsersRoundIcon),
  icon("users", "用户", "Users", "organization", UsersIcon),
  icon("file-text", "文档", "Document", "content", FileTextIcon),
  icon("clipboard-list", "操作日志", "Audit log", "content", ClipboardListIcon),
  icon("scroll-text", "系统日志", "System log", "content", ScrollTextIcon),
  icon("list-tree", "树列表", "Tree", "content", ListTreeIcon),
  icon("folder", "目录", "Folder", "content", FolderIcon),
  icon("database", "数据", "Database", "content", DatabaseIcon),
  icon("monitor", "服务", "Service", "monitor", MonitorIcon),
  icon("server-cog", "服务器", "Server", "monitor", ServerCogIcon),
  icon("activity", "活动", "Activity", "monitor", ActivityIcon),
  icon("gauge", "仪表盘", "Gauge", "monitor", GaugeIcon),
  icon("network", "网络", "Network", "monitor", NetworkIcon),
  icon("bell", "通知", "Notification", "tools", BellIcon),
  icon("globe", "全局", "Global", "tools", GlobeIcon),
  icon("plug", "插件", "Plugin", "tools", PlugIcon),
  icon("wrench", "工具", "Tools", "tools", WrenchIcon),
  icon("credit-card", "支付", "Payment", "tools", CreditCardIcon),
]

export function findMenuIconOption(value: string) {
  return menuIconOptions.find((option) => option.value === value.trim())
}

function icon(
  value: string,
  zhLabel: string,
  enLabel: string,
  category: MenuIconCategory,
  Icon: LucideIcon,
): MenuIconOption {
  return {
    category,
    Icon,
    label: { "en-US": enLabel, "zh-CN": zhLabel },
    value,
  }
}
