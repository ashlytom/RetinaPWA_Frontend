import type { Permission } from "@/services/auth";

export const SECTIONS: { href: string; label: string; perm: Permission }[] = [
  { href: "/admin/users", label: "Users", perm: "users:manage" },
  { href: "/admin/devices", label: "Devices", perm: "devices:manage" },
  { href: "/admin/activity", label: "Login activity", perm: "audit:view" },
  { href: "/admin/roles", label: "Roles", perm: "roles:manage" },
];
