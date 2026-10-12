import { Spinner } from "@/components/Spinner";

export const LoadingState = () => (
  <div className="flex items-center justify-center h-[100svh]">
    <Spinner sizeClass="size-12" />
  </div>
);
