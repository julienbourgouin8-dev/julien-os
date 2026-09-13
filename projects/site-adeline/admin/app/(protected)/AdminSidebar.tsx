"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./actions";

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3.5" y="3.5" width="7.5" height="8.5" rx="2" />
      <rect x="13" y="3.5" width="7.5" height="5.5" rx="2" />
      <rect x="13" y="11.5" width="7.5" height="9" rx="2" />
      <rect x="3.5" y="14.5" width="7.5" height="6" rx="2" />
    </svg>
  );
}

function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M3.5 8.5 12 4l8.5 4.5v8L12 21l-8.5-4.5v-8Z" strokeLinejoin="round" />
      <path d="M3.5 8.5 12 12.5l8.5-4" strokeLinejoin="round" />
      <path d="M12 12.5V21" />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M6 8h12l-1 12H7L6 8Z" strokeLinejoin="round" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" />
      <path d="M16 17 21 12 16 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" strokeLinecap="round" />
    </svg>
  );
}

const NAV = [
  { href: "/", label: "Tableau de bord", icon: DashboardIcon },
  { href: "/products", label: "Produits", icon: ProductsIcon },
  { href: "/orders", label: "Commandes", icon: OrdersIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex h-screen w-60 shrink-0 flex-col bg-[#fffdf8] px-4 py-7"
      style={{ boxShadow: "1px 0 0 rgba(36,27,21,0.05), 4px 0 16px rgba(36,27,21,0.03)" }}
    >
      <div className="px-2">
        <p className="font-script text-2xl text-ink">CréA&apos;deline</p>
        <p className="mt-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink/35">Admin</p>
      </div>

      <nav className="mt-8 flex flex-col gap-1 text-sm font-medium">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
              style={{
                color: active ? "var(--color-paper)" : "rgba(36,27,21,0.55)",
                backgroundColor: active ? "var(--color-denim)" : "transparent",
              }}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink/50 transition-colors hover:bg-ink/[0.04] hover:text-ink"
          >
            <LogoutIcon className="h-[18px] w-[18px]" />
            Déconnexion
          </button>
        </form>
      </div>
    </aside>
  );
}
