"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { SECTIONS } from "@/components/admin/sections";
import { can, getUser } from "@/services/auth";

/** The admin console opens on the first section this person is allowed to use. */
export default function AdminIndex() {
  const router = useRouter();
  useEffect(() => {
    const user = getUser();
    const first = SECTIONS.find((s) => can(user, s.perm));
    router.replace(first ? first.href : "/");
  }, [router]);
  return null;
}
