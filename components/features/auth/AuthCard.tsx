interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-xl2 shadow-soft p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white text-center">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-2">
            {subtitle}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
