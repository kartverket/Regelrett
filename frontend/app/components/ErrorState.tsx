import { AlertTriangle } from "lucide-react";

export const ErrorState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center h-[70svh] gap-4">
    <AlertTriangle className="h-16 w-16 text-foreground" />
    <h2 className="text-base font-semibold">{message}</h2>
  </div>
);
