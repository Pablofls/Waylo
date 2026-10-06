export function Card({ className = "", children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-card border border-line bg-white p-4 ${className}`} {...rest}>
      {children}
    </div>
  );
}
