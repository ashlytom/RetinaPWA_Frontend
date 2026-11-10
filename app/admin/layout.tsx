"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconAperture, IconCamera, IconLogOut } from "@/components/common/Icons";
import ThemeToggle from "@/components/common/ThemeToggle";
import { SECTIONS } from "@/components/admin/sections";
import { can, getUser, hasSession, logout, type SessionUser } from "@/services/auth";
import { refreshMe } from "@/services/me";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    if (!hasSession()) return router.replace("/login");
    const cached = getUser();
    if (cached && !cached.can_admin) return router.replace("/");
    setUser(cached);
    // Pick up any role changes made since sign-in.
    refreshMe()
      .then((u) => {
        if (!u) return;
        if (!u.can_admin) router.replace("/");
        else setUser(u);
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  async function signOut() {
    await logout();
    router.replace("/login");
  }

  if (!user?.can_admin) return null;
  const items = SECTIONS.filter((s) => can(user, s.perm));
  const link = (active: boolean) =>
    `flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-sm font-medium transition ${
      active ? "bg-subtle text-primary-ink" : "text-muted hover:bg-subtle hover:text-ink"
    }`;

  return (
    <div className="md:flex md:min-h-screen">
      <aside className="border-b border-line bg-card md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r md:pb-10">
        <div className="flex items-center gap-3 px-4 py-3 md:py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-on">
            <IconAperture className="h-5 w-5" />
          </span>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">Retina DR</p>
            <p className="text-[11px] uppercase tracking-wider text-muted">Admin console</p>
          </div>
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-3 pb-2 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
          {items.map((s) => (
            <Link key={s.href} href={s.href} aria-current={pathname === s.href ? "page" : undefined} className={link(pathname === s.href)}>
              {s.label}
            </Link>
          ))}
          {can(user, "screening:use") && (
            <>
              <span className="mx-2 my-1 hidden border-t border-line md:block" aria-hidden />
              <Link href="/" className={link(false)}>
                <IconCamera className="h-4 w-4" />
                Fundus screening
              </Link>
            </>
          )}
        </nav>

        <div className="hidden border-t border-line p-3 md:block">
          <p className="truncate px-1 font-mono text-xs text-muted">{user.username}</p>
          <p className="truncate px-1 pb-2 text-[11px] text-muted">{user.roles.join(", ")}</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button onClick={signOut} className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded border border-line-strong bg-card px-3 text-sm font-medium hover:bg-subtle">
              <IconLogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-line px-4 py-2 md:hidden">
          <span className="truncate font-mono text-xs text-muted">{user.username}</span>
          <button onClick={signOut} className="text-sm font-medium underline">Sign out</button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-5 px-4 py-6 md:px-8">
        <div className="mx-auto w-full max-w-4xl space-y-5">{children}</div>
      </main>
    </div>
  );
}
