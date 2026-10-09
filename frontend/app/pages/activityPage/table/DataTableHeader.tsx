import type { Column } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, ArrowDownIcon, XIcon, EyeOffIcon } from "lucide-react";
import React from "react";

interface Props<TData, TValue>
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  column: Column<TData, TValue>;
  header: string;
  setColumnVisibility: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  className?: string;
  isNameColumn?: boolean;
}

export function DataTableHeader<TData, TValue>({
  column,
  header,
  setColumnVisibility,
  className,
  isNameColumn = false,
}: Props<TData, TValue>) {
  const hideColumn = (name: string) => {
    column.clearSorting();
    setColumnVisibility((prev) => ({
      ...prev,
      [name]: false,
    }));
  };
  const isSorted = column.getIsSorted() !== false;
  const isAscending = column.getIsSorted() === "asc";
  const isSortedAscending = isSorted && isAscending;
  const isSortedDescending = isSorted && !isAscending;

  return (
    <div className={`p-2 relative bg-muted ${className ?? ""}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="link"
            className={`text-primary text-xs uppercase px-0 py-1 has-[>svg]:px-0 flex items-center gap-1 ${isSorted ? "font-bold" : "font-semibold"}`}
          >
            {header}
            {isSortedAscending && <ArrowUpIcon className="w-4 h-4" />}
            {isSortedDescending && <ArrowDownIcon className="w-4 h-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48 bg-popover text-foreground">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            className={isSortedAscending ? "font-semibold" : ""}
          >
            <ArrowUpIcon className="mr-2 h-4 w-4" />
            Sorter stigende
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            className={isSortedDescending ? "font-semibold" : ""}
          >
            <ArrowDownIcon className="mr-2 h-4 w-4" />
            Sorter synkende
          </DropdownMenuItem>
          {isSorted && (
            <DropdownMenuItem onClick={() => column.clearSorting()}>
              <XIcon className="mr-2 h-4 w-4" />
              Fjern sortering
            </DropdownMenuItem>
          )}

          {!isNameColumn && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => hideColumn(header)}>
                <EyeOffIcon className="mr-2 h-4 w-4" />
                Skjul kolonne
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
