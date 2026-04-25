import { Sidebar } from '@/components/layout/Sidebar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f6f8] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <Sidebar />
      <div className="flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
