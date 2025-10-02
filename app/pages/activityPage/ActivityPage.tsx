import { useParams } from "react-router";
import { Page } from "../../components/layout/Page";
import { TableComponent } from "./table/Table";
import { useAnswers } from "../../hooks/useAnswers";
import { useComments } from "../../hooks/useComments";
import { useForm } from "../../hooks/useForm";
import { mapTableDataRecords } from "../../utils/mapperUtil";
import { AnswerType } from "../../api/types";
import { ErrorState } from "../../components/ErrorState";
import { useContext } from "../../hooks/useContext";
import { useUser } from "../../hooks/useUser";
import { useState } from "react";
import { SettingsModal } from "./settingsModal/SettingsModal";
import RedirectBackButton from "../../components/buttons/RedirectBackButton";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";

export default function ActivityPage() {
  const params = useParams();
  const contextId = params.contextId;

  const {
    data: context,
    error: contextError,
    isPending: contextIsPending,
  } = useContext(contextId);

  const {
    data: userinfo,
    error: userinfoError,
    isPending: userinfoIsPending,
  } = useUser();

  const {
    data: tableData,
    error: tableError,
    isPending: tableIsPending,
  } = useForm(context?.formId);

  const {
    data: comments,
    error: commentError,
    isPending: commentIsPending,
  } = useComments(contextId);

  const {
    data: answers,
    error: answerError,
    isPending: answerIsPending,
  } = useAnswers(contextId);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const error =
    tableError || commentError || answerError || contextError || userinfoError;

  if (contextError) {
    const statusCode = contextError.response?.status;
    if (statusCode === 403) {
      return (
        <ErrorState message="Du har ikke tilgang til denne skjemautfyllingen" />
      );
    } else if (statusCode === 404) {
      return (
        <ErrorState message="Denne skjemautfyllingen finnes ikke. Kanskje den er slettet?" />
      );
    }
  } else if (error) {
    return <ErrorState message="Noe gikk galt, prøv gjerne igjen" />;
  }

  if (tableData && comments && answers) {
    tableData.records = mapTableDataRecords(tableData, comments, answers);
  }

  const allSingleSelect = tableData?.records.every(
    (record) =>
      record.metadata?.answerMetadata?.type === AnswerType.SELECT_SINGLE,
  );

  const teamName = userinfo?.groups.find(
    (team) => team.id === context?.teamId,
  )?.displayName;

  return (
    <>
      <RedirectBackButton />
      <Page>
        <div className="flex flex-col max-w-full self-center gap-2">
          <div className="flex flex-col gap-2 px-10">
            <SkeletonLoader
              loading={contextIsPending || tableIsPending}
              width="w-full"
              height="h-8"
            >
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <p className="font-semibold text-foreground/80">
                    {tableData?.name}
                  </p>
                  <div className="flex items-center">
                    <h3 className="text-2xl font-bold">{context?.name}</h3>
                    <Button
                      variant="ghost"
                      size="lg"
                      aria-label="Edit context"
                      onClick={() => setSettingsOpen(true)}
                      className="text-primary hover:text-primary"
                    >
                      <Settings className="size-5" />
                    </Button>
                  </div>
                </div>
                <div className="flex-col items-start bg-color-badge-grey text-secondary-foreground">
                  <p className="text-xs">Team - skjemaeier</p>
                  <p className="text-sm font-semibold">{teamName}</p>
                </div>
              </div>
            </SkeletonLoader>
          </div>
          <SkeletonLoader
            loading={
              tableIsPending ||
              userinfoIsPending ||
              contextIsPending ||
              answerIsPending ||
              commentIsPending
            }
            width="w-full"
            height="min-h-[100vh]"
          >
            {!!tableData &&
              !!context &&
              !!userinfo &&
              !!comments &&
              !!answers && (
                <TableComponent
                  columnMetadata={tableData?.columns ?? []}
                  filterByAnswer={allSingleSelect ?? false}
                  contextId={context?.id}
                  data={tableData?.records ?? []}
                  tableData={tableData}
                  user={userinfo.user}
                  isLoading={
                    tableIsPending || answerIsPending || commentIsPending
                  }
                />
              )}
          </SkeletonLoader>
          <SettingsModal setOpen={setSettingsOpen} open={settingsOpen} />
        </div>
      </Page>
    </>
  );
}
