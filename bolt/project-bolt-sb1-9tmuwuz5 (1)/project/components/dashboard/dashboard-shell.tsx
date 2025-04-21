import { cn } from "@/lib/utils";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className="container px-4 py-16 mx-auto space-y-6">
      <div className={cn("grid gap-8", className)} {...props}>
        {children}
      </div>
    </div>
  );
}