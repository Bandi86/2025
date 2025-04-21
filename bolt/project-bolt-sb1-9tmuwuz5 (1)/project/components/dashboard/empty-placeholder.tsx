import * as React from "react";
import { 
  FileQuestion, 
  AlertCircle, 
  FileText, 
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyPlaceholderProps extends React.HTMLAttributes<HTMLDivElement> {}

export function EmptyPlaceholder({
  className,
  children,
  ...props
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50",
        className
      )}
      {...props}
    >
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

interface EmptyPlaceholderIconProps extends React.HTMLAttributes<HTMLDivElement> {
  name: "post" | "category" | "page" | "alert";
}

EmptyPlaceholder.Icon = function EmptyPlaceholderIcon({
  name,
  className,
  ...props
}: EmptyPlaceholderIconProps) {
  const Icon = {
    post: FileText,
    category: BarChart3,
    page: FileQuestion,
    alert: AlertCircle,
  }[name];

  return (
    <div
      className={cn(
        "flex h-20 w-20 items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      <Icon className="h-10 w-10" />
    </div>
  );
};

interface EmptyPlaceholderTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {}

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: EmptyPlaceholderTitleProps) {
  return (
    <h3
      className={cn("mt-6 text-xl font-semibold", className)}
      {...props}
    />
  );
};

interface EmptyPlaceholderDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlaceholderDescriptionProps) {
  return (
    <p
      className={cn(
        "mt-3 mb-8 text-center text-sm font-normal leading-6 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};