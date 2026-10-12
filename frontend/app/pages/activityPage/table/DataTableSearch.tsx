import type { Table } from "@tanstack/react-table";
import type { HTMLAttributes} from "react";
import { useEffect, useState } from "react";
import { useDebounce } from "../../../hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface Props<TData> extends HTMLAttributes<HTMLDivElement> {
  table: Table<TData>;
}

export function DataTableSearch<TData>({ table, ...rest }: Props<TData>) {
  const globalFilter = table.getState().globalFilter;
  const [value, setValue] = useState<string | undefined>(globalFilter);

  const debouncedValue = useDebounce(value, 200);
  useEffect(() => {
    table.setGlobalFilter(debouncedValue);
  }, [debouncedValue, table]);

  return (
    <div className="relative max-w-[26rem]" {...rest}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Søk i tabellen"
        aria-label="Søk i tabell"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="pl-10 text-sm bg-card "
      />
    </div>
  );
}
