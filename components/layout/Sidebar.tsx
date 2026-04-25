'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Puzzle,
  CalendarRange,
  ClipboardList,
  CalendarCheck,
  CheckSquare,
  Bell,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  emphasize?: boolean;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: '관리 업무',
    items: [
      { href: '/', label: '대시보드', icon: LayoutDashboard },
      { href: '/facility', label: '시설물 현황', icon: Building2 },
      { href: '/equipment', label: '설비대장', icon: Wrench },
      { href: '/parts', label: '부품 관리', icon: Puzzle, emphasize: true },
      { href: '/parts/timeline', label: '부품 타임라인', icon: CalendarRange },
      { href: '/maintenance', label: '유지보수 이력', icon: ClipboardList },
      { href: '/pm', label: '예방정비', icon: CalendarCheck },
      { href: '/inspection', label: '점검일지', icon: CheckSquare },
      { href: '/alerts', label: '알림 · 리마인더', icon: Bell },
    ],
  },
  {
    title: '분석 · 설정',
    items: [
      { href: '/reports', label: '통계 보고서', icon: BarChart3 },
      { href: '/settings', label: '시스템 설정', icon: Settings },
    ],
  },
];

/**
 * 더 긴 경로(`/parts/timeline`)가 `/parts`와 동시에 active되지 않도록
 * 더 구체적인 매칭이 있는 경우 상위 경로는 정확 일치만 허용한다.
 */
const ALL_HREFS = [
  '/',
  '/facility',
  '/equipment',
  '/parts',
  '/parts/timeline',
  '/maintenance',
  '/pm',
  '/inspection',
  '/alerts',
  '/reports',
  '/settings',
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  if (!pathname.startsWith(href + '/')) return false;
  // 더 구체적인 자식 경로가 등록되어 있으면 부모는 활성화하지 않음
  return !ALL_HREFS.some(
    (h) => h !== href && h.startsWith(href + '/') && pathname.startsWith(h),
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* 모바일 햄버거 (lg 미만에서만 표시) */}
      <button
        type="button"
        className="fixed left-3 top-3 z-50 inline-flex h-10 w-10 items-center justify-center rounded-md bg-sidebar text-white shadow lg:hidden"
        aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((v) => !v)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* 모바일 백드롭 */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-[232px] border-r border-r-accent-light/20 bg-sidebar text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* 브랜드 영역 */}
          <div className="border-b border-white/10 px-5 py-5">
            <p className="text-[15px] font-semibold leading-tight">
              빗물펌프장
              <br />
              시설물 관리 시스템
            </p>
            <p className="mt-1 text-[11px] text-white/50">RPMS v0.1</p>
          </div>

          {/* 네비게이션 */}
          <nav
            className="flex-1 overflow-y-auto px-3 py-4"
            aria-label="주 메뉴"
          >
            {SECTIONS.map((section) => (
              <div key={section.title} className="mb-5">
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = isActive(pathname, item.href);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition',
                            active
                              ? 'bg-white/10 text-white'
                              : 'text-white/70 hover:bg-white/5 hover:text-white',
                            item.emphasize && !active && 'text-sky-300',
                          )}
                          aria-current={active ? 'page' : undefined}
                        >
                          <Icon
                            className={cn(
                              'h-4 w-4 shrink-0',
                              active
                                ? 'text-white'
                                : 'text-white/60 group-hover:text-white',
                              item.emphasize && !active && 'text-sky-300',
                            )}
                          />
                          <span className="flex-1">{item.label}</span>
                          {item.emphasize && (
                            <span className="rounded bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-semibold text-sky-200">
                              ★
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>

          {/* 푸터 */}
          <div className="border-t border-white/10 px-5 py-3 text-[11px] text-white/40">
            대구광역시 달서구
            <br />
            도시관리본부 배수운영과
          </div>
        </div>
      </aside>
    </>
  );
}
