/** En móvil ocupa toda la pantalla; en escritorio se centra como un teléfono. */
export function PhoneFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-dvh bg-[#DDE1E3] md:flex md:items-center md:justify-center md:py-6">
      <div
        className={`relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white md:h-[min(900px,calc(100dvh-3rem))] md:rounded-[32px] md:border md:border-line md:shadow-sm ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
