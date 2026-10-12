import type { Table as TanstackTable} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { PaginationButtonContainer } from "./pagination/PaginationButtonContainer";
import { TableStateProvider } from "./TableState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Props<TData> {
  table: TanstackTable<TData>;
}

export function DataTable<TData>({ table }: Props<TData>) {
  return (
    <TableStateProvider>
      <div className="px-10">
        <div className="flex justify-center w-full border-1 border-border rounded-xl overflow-hidden">
          <Table className="bg-card">
            <TableHeader className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="text-left">
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-normal align-top text-left"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <PaginationButtonContainer table={table} />
      </div>
    </TableStateProvider>
  );
}
