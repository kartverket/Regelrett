import { useTeamContexts } from "../../hooks/useContext";
import { useForms } from "../../hooks/useForms";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ContextLink } from "@/pages/frontPage/ContextLink";

export default function TeamContexts({ teamId }: { teamId: string }) {
  const { data: contexts = [], isPending: contextsIsPending } =
    useTeamContexts(teamId);

  const { data: forms, isPending: formsPending } = useForms();

  if (!contextsIsPending && contexts.length === 0)
    return <p>Dette teamet har ingen skjemautfyllinger</p>;

  const uniqueFormIds = Array.from(
    new Set(contexts?.map((context) => context.formId)),
  );

  const contextForms = forms?.filter((table) =>
    uniqueFormIds.includes(table.id),
  );

  return (
    <SkeletonLoader
      loading={contextsIsPending || formsPending}
      height="min-h-[98px]"
    >
      <div className="flex flex-col lg:flex-row gap-6 flex-wrap">
        {contextForms?.map((form) => {
          const contextsForForm = contexts.filter(
            (context) => context.formId === form.id,
          );

          return (
            <div key={form.id} className="flex flex-col gap-4 items-start">
              <h2 className="text-xl font-bold">{form.name}</h2>
              <div className="flex flex-col gap-4 items-start">
                {contextsForForm.map((context) => (
                  <ContextLink
                    key={context.id}
                    contextId={context.id}
                    formId={form.id}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SkeletonLoader>
  );
}
