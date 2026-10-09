import { cn } from "@/lib/utils";

interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Page({ children, className, ...rest }: PageProps) {
  return (
    <div
      className={cn(
        "w-full flex flex-col py-10 gap-6 md:gap-8 bg-background",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
