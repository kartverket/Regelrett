import { SkeletonLoader } from "@/components/SkeletonLoader";
import { useReadGrantsByUser } from "@/hooks/useGrants";
import { ContextLink } from "@/pages/frontPage/ContextLink";
import { Share2 } from "lucide-react";
import React from "react";

type ReadGrantedContextsSectionProps = {
  userId: string
};

export default function ReadGrantedContextsSection({
  userId
}: ReadGrantedContextsSectionProps) {
  const {
    data: readGrants,
    isLoading: readGrantsLoading,
  } = useReadGrantsByUser(userId);


  if (
    !readGrantsLoading &&
    !readGrants
  ) {
    return null;
  }

  if(readGrants?.length === 0) {
    return (
      <div className="text-center py-12">
        <Share2 className="size-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          Ingen skjema har blitt delt med deg
        </h2>
        <p className="text-muted-foreground mt-1">
          Du har ikke fått lesetilgang til noen skjema utenfor ditt team.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Delt med deg</h1>
        <p className="text-muted-foreground">
          Skjemaer du har fått midlertidig lesetilgang til
        </p>
      </div>
      <SkeletonLoader loading={readGrantsLoading}>
        <div className="space-y-3 flex flex-col w-[450px]">
          {readGrants?.map((readGrant) => (
              <ContextLink key={readGrant.id} contextId={readGrant.contextId} />
          ))}
        </div>
      </SkeletonLoader>
    </div>
  );
}


