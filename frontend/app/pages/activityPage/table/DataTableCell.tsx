import type { Cell } from "@tanstack/react-table";
import type { HTMLAttributes } from "react";
import type { Question } from "@/api/types";
import type { ActivityTableFeatures } from "./tableFeatures";

interface Props<TValue>
  extends HTMLAttributes<HTMLTableCellElement> {
  cell: Cell<ActivityTableFeatures, Question, TValue>;
}

export function DataTableCell<TValue>({
  cell,
  children,
  className,
  ...rest
}: Props<TValue>) {
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
