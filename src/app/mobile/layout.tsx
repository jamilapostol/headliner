export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto min-h-screen max-w-[480px] bg-canvas">{children}</div>;
}
