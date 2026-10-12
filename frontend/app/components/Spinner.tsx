import { Loader2 } from "lucide-react";

export const Spinner = ({
  sizeClass = "size-5",
  className,
}: {
  sizeClass?: string;
  className?: string;
}) => (
  <Loader2
    className={`${sizeClass} animate-spin text-muted-foreground ${className} `}
  />
);
