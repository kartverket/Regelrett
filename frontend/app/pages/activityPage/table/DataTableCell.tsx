import type { Cell } from "@tanstack/react-table";
import type { HTMLAttributes } from "react";

interface Props<TData, TValue> extends HTMLAttributes<HTMLTableCellElement> {
  cell: Cell<TData, TValue>;
}

export function DataTableCell<TData, TValue>({
  cell,
  children,
  className,
  ...rest
}: Props<TData, TValue>) {
  return (
    <div
      key={cell.id}
      className={`py-4 px-2 whitespace-normal ${className ?? ""}`}
      {...rest}
    >
      {children}
    </div>
  );
}
