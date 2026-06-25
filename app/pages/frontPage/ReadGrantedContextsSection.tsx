import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Separator } from "@/components/ui/separator";
import { useReadGrantsByUser } from "@/hooks/useGrants";
import { ContextLink } from "@/pages/frontPage/ContextLink";

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
    (!readGrants || readGrants.length === 0)
  ) {
    return null;
  }

  return (
    <>
      <Separator className="my-5" />
      <h1 className="text-4xl font-bold">Delt med deg</h1>
      <SkeletonLoader loading={readGrantsLoading}>
        <div className="flex flex-col gap-4 items-start py-4">
          {readGrants?.map((readGrant) => (
            <ContextLink
              key={readGrant.id}
              contextId={readGrant.contextId}
              formId=""
            />
          ))}
        </div>
      </SkeletonLoader>
    </>
  );
}


