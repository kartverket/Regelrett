import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import React from "react";
import type { Table as TanstackTable } from "@tanstack/react-table";

interface Props<TData> {
  table: TanstackTable<TData>;
  unHideColumn: (name: string) => void;
  unHideColumns: (name: string[]) => void;
  showOnlyFillModeColumns: (name: string[]) => void;
}

export function ColumnActions<TData>({
  table,
  unHideColumn,
  unHideColumns,
  showOnlyFillModeColumns,
}: Props<TData>) {
  const headerNames = table.getAllColumns().map((column) => column.id);

  return (
    <div
      className={`flex items-center w-full ${
        table.getIsAllColumnsVisible() ? "justify-end" : "justify-between"
      }`}
    >
      {!table.getIsAllColumnsVisible() && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-sm">Skjulte kolonner</h3>
          <div className="flex flex-row gap-1 flex-wrap justify-center h-6">
            <Button
              aria-label={"Show all columns"}
              onClick={() => {
                unHideColumns(headerNames);
              }}
              size="sm"
              className="text-xs h-6"
            >
              Vis alle kolonner
            </Button>
            <Separator orientation="vertical" />

            {table.getAllLeafColumns().map(
              (column) =>
                !column.getIsVisible() && (
                  <Badge
                    key={column.id}
                    variant="secondary"
                    className="bg-primary/20 cursor-pointer flex items-center gap-1 h-6"
                    onClick={() => unHideColumn(column.id)}
                  >
                    {column.id}
                    <X
                      className="ml-1"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent badge onClick
                        unHideColumn(column.id);
                      }}
                    />
                  </Badge>
                ),
            )}
          </div>
        </div>
      )}
      <div className="flex flex-row items-center justify-center">
        <p className="font-semibold mr-2 w-fit">Vis alle kolonner</p>
        <Switch
          onCheckedChange={(e) =>
            e
              ? unHideColumns(headerNames)
              : showOnlyFillModeColumns(headerNames)
          }
          checked={table.getIsAllColumnsVisible()}
        />
      </div>
    </div>
  );
}
