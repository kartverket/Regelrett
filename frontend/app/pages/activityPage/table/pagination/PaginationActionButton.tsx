import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isDisplayed?: boolean;
  isCurrent?: boolean;
  onClick: () => void;
  ariaLabel: string;
}

export function PaginationActionButton({
  isDisplayed = true,
  isCurrent = false,
  children,
  ariaLabel,
  ...rest
}: Props) {
  const isChildrenString = typeof children === "string";

  if (!isDisplayed) {
    return <div className="w-10 h-10" />;
  }

  return (
    <Button
      aria-label={ariaLabel}
      className={cn("w-10 h-10", isCurrent && "bg-blue-100", rest.className)}
      variant="ghost"
      {...rest}
    >
      {isChildrenString ? (
        <span className="text-base">{children}</span>
      ) : (
        children
      )}
    </Button>
  );
}
