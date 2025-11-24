import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between space-y-2 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-5", className)}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {children}
      </div>
    </div>
  );
}
