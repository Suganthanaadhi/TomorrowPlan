"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menubar } from "primereact/menubar";
import type { MenuItem } from "primereact/menuitem";
import styles from "./NavBar.module.css";

const LINKS = [
  { label: "Dashboard", icon: "pi pi-home", href: "/" },
  { label: "Add Task", icon: "pi pi-plus", href: "/add-task" },
  { label: "History", icon: "pi pi-calendar", href: "/history" },
  { label: "Profile", icon: "pi pi-user", href: "/profile" },
];

export function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  const items: MenuItem[] = LINKS.map((link) => ({
    label: link.label,
    icon: link.icon,
    template: () => (
      <Link
        href={link.href}
        className={`${styles.link} ${pathname === link.href ? styles.active : ""}`}
      >
        <span className={link.icon} />
        <span>{link.label}</span>
      </Link>
    ),
  }));

  const start = (
    <Link href="/" className={styles.brand}>
      <span className="pi pi-verified" />
      <span>TomorrowPlan</span>
    </Link>
  );

  const end = (
    <button
      type="button"
      className={styles.logout}
      onClick={() => signOut({ redirect: false }).then(() => router.push("/login"))}
    >
      <span className="pi pi-sign-out" />
      <span>Logout</span>
    </button>
  );

  return <Menubar model={items} start={start} end={end} className={styles.menubar} />;
}
