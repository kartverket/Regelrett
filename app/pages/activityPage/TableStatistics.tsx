import { Switch } from "@/components/ui/switch";
import type { Question } from "../../api/types";
import { Progress } from "@/components/ui/progress";
import type { Table } from "@tanstack/react-table";
import { useState } from "react";

interface Props {
  filteredData: Question[];
  table: Table<Question>;
}

export const TableStatistics = ({ filteredData, table }: Props) => {
  const hasActiveFilters = table.getState().columnFilters.length > 0;
  const showForActiveFiltersLocalstorage = localStorage.getItem(
    "showForActiveFilters",
  );
  const [showForActiveFilters, setShowForActiveFilters] = useState<boolean>(
    showForActiveFiltersLocalstorage
      ? JSON.parse(showForActiveFiltersLocalstorage)
      : true,
  );
  const rows = showForActiveFilters
    ? table.getFilteredRowModel().rows
    : table.getPreFilteredRowModel().rows;
  const numberOfQuestions = showForActiveFilters
    ? rows.length
    : filteredData.length;
  const numberOfAnswers = filteredData.reduce((count, data) => {
    if (
      rows.some((row) => row.original.recordId === data.recordId) &&
      data.answers?.[0]?.answer &&
      data.answers.at(-1)?.answer !== ""
    ) {
      count++;
    }
    return count;
  }, 0);

  const percentageAnswered = Math.round(
    (numberOfAnswers / numberOfQuestions) * 100,
  );

  const updateShowForActiveFilters = (show: boolean) => {
    setShowForActiveFilters(show);
    localStorage.setItem("showForActiveFilters", JSON.stringify(show));
  };

  return (
    <div className="w-full max-w-[40%]">
      <div className="flex items-center gap-2">
        <Progress
          value={isNaN(percentageAnswered) ? 0 : percentageAnswered}
          className="flex-1"
        />
        <span className="text-sm">
          <span className="font-semibold">{numberOfAnswers}</span> av{" "}
          {numberOfQuestions} spørsmål besvart (
          <span className="font-semibold">{percentageAnswered}</span>%)
        </span>
      </div>
      {hasActiveFilters && (
        <div className="font-semibold flex gap-2">
          Vis for aktivt filter{" "}
          <Switch
            onCheckedChange={(e) => updateShowForActiveFilters(e)}
            checked={showForActiveFilters}
          />
        </div>
      )}
    </div>
  );
};
