import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  width?: string;
  height?: string;
  className?: string;
}

export function SkeletonLoader({
  loading,
  children,
  width = "w-[450px] lg:w-[900px]",
  height = "h-40",
  className = "",
}: SkeletonLoaderProps) {
  if (loading) {
    return <Skeleton className={`${width} ${height} ${className}`} />;
  }
  return <>{children}</>;
}
