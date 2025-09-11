import { useSearchParams } from "react-router";
import type { Column } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table as TanstackTable } from "@tanstack/react-table";

type TableFilters<TData> = {
  filterName: string;
  filterOptions: { name: string; value: string }[];
  column: Column<TData, unknown>;
  formId: string;
  table: TanstackTable<TData>;
};

export const TableFilter = <TData,>({
  filterName,
  filterOptions,
  column,
  formId,
  table,
}: TableFilters<TData>) => {
  const placeholder = "Alle";
  const [_, setSearchParams] = useSearchParams();

  const selectedValues = (column.getFilterValue() ?? []) as string[];

  const handleFilterChange = (toggledValue: string): void => {
    const isSelected = selectedValues.includes(toggledValue);
    const updatedSelection = isSelected
      ? selectedValues.filter((val) => val !== toggledValue)
      : [...selectedValues, toggledValue];

    column.setFilterValue(
      updatedSelection.length ? updatedSelection : undefined,
    );

    const updatedLocalStorageFilters = JSON.parse(
      localStorage.getItem(`filters_${formId}`) || "[]",
    ).filter(
      (filter: { id: string; value: string }) => filter.id !== column.id,
    );

    setSearchParams(
      (current) => {
        current.delete("page");
        current.getAll("filter").forEach((value) => {
          if (value.startsWith(column.id)) {
            current.delete("filter", value);
          }
        });
        updatedSelection.forEach((val) => {
          current.append("filter", `${column.id}_${val}`);
        });
        return current;
      },
      { replace: true },
    );

    localStorage.setItem(
      `filters_${formId}`,
      JSON.stringify(
        !updatedSelection.length
          ? updatedLocalStorageFilters
          : [
              ...updatedLocalStorageFilters,
              ...updatedSelection.map((val) => ({
                id: column.id,
                value: val,
              })),
            ],
      ),
    );

    table.setPageIndex(0);
  };

  const selectedNames = filterOptions
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.name)
    .join(", ");

  return (
    <div className="flex flex-col gap-1 uppercase text-xs">
      <p className="font-semibold text-foreground/80">{filterName}</p>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <div
            role="button"
            className="flex items-center justify-between w-[210px] rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span
              className={cn(
                "truncate text-left",
                selectedNames === "" && "text-muted-foreground",
              )}
            >
              {selectedNames !== "" ? selectedNames : placeholder}
            </span>
            <ChevronDown className="ml-2 size-4 text-muted-foreground" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[210px] max-w-[210px]">
          {filterOptions.map((option) => {
            const checked = selectedValues.includes(option.value);
            return (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={checked}
                onCheckedChange={() => handleFilterChange(option.value)}
                className="cursor-pointer"
              >
                {option.name}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
