import type { Table, Updater } from "@tanstack/react-table";
import { PaginationActionButton } from "./PaginationActionButton";
import { PaginationRelativeButtons } from "./PaginationRelativeButtons";
import { useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  NavigationType,
  useNavigationType,
  useSearchParams,
} from "react-router";

interface Props<TData> {
  table: Table<TData>;
}

export function PaginationButtonContainer<TData>({ table }: Props<TData>) {
  const [_, setSearchParams] = useSearchParams();
  const state = table.getState().pagination;
  const index = state.pageIndex;
  const pageSize = state.pageSize;
  const numberOfRows = table.getRowCount();
  const numberOfPages = Math.ceil(numberOfRows / pageSize);
  const ref = useRef<HTMLDivElement>(null);
  const navigation = useNavigationType();

  const setPageRequestParam = (page: number) => {
    setSearchParams((current) => {
      if (page === 1) {
        current.delete("page");
      } else {
        current.set("page", page.toString());
      }
      return current;
    });
  };

  useEffect(() => {
    if (ref.current) {
      if (navigation === NavigationType.Push) {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "auto",
        });
      }
    }
  }, [index, navigation]);

  return (
    <div
      ref={ref}
      className="mt-4 w-full flex gap-1 items-center justify-center"
    >
      <PaginationActionButton
        ariaLabel={"Gå til forrige side"}
        isDisplayed={table.getCanPreviousPage()}
        onClick={() => {
          setPageRequestParam(index);
        }}
      >
        <ChevronLeft className="size-6" />
      </PaginationActionButton>
      <PaginationActionButton
        onClick={() => {
          setPageRequestParam(1);
        }}
        ariaLabel={"Gå til side 1"}
        isCurrent={index === 0}
      >
        1
      </PaginationActionButton>
      <PaginationRelativeButtons
        numberOfPages={numberOfPages}
        currentIndex={index}
        setIndex={(index: Updater<number>) => {
          setPageRequestParam(+index + 1);
        }}
      />

      {numberOfPages > 1 && (
        <PaginationActionButton
          onClick={() => {
            setPageRequestParam(numberOfPages);
          }}
          ariaLabel={"Gå til siste side"}
          isCurrent={index === numberOfPages - 1}
        >
          {numberOfPages}
        </PaginationActionButton>
      )}
      <PaginationActionButton
        onClick={() => {
          setPageRequestParam(index + 2);
        }}
        ariaLabel={"Gå til neste side"}
        isDisplayed={table.getCanNextPage()}
      >
        <ChevronRight className="size-6" />
      </PaginationActionButton>
    </div>
  );
}
