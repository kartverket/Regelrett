import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Separator } from "@/components/ui/separator";
import { useSharedContextsByUser } from "@/hooks/useShares";
import { ContextLink } from "@/pages/frontPage/ContextLink";

type SharedContextsSectionProps = {
  userId: string
};

export default function SharedContextsSection({
  userId
}: SharedContextsSectionProps) {
  const {
    data: sharedContexts,
    isLoading: sharedContextLoading,
  } = useSharedContextsByUser(userId);


  if (
    !sharedContextLoading &&
    (!sharedContexts || sharedContexts.length === 0)
  ) {
    return null;
  }

  return (
    <>
      <Separator className="my-5" />
      <h1 className="text-4xl font-bold">Delt med deg</h1>
      <SkeletonLoader loading={sharedContextLoading}>
        <div className="flex flex-col gap-4 items-start py-4">
          {sharedContexts?.map((sharedContext) => (
            <ContextLink
              key={sharedContext.id}
              contextId={sharedContext.contextId}
              formId=""
            />
          ))}
        </div>
      </SkeletonLoader>
    </>
  );
}


