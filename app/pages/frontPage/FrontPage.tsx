import { Page } from "@/components/layout/Page";
import { useUser } from "@/hooks/useUser";
import RedirectBackButton from "../../components/buttons/RedirectBackButton";
import TeamContexts from "./TeamContexts";
import {
  handleExportFullCSV,
  handleExportProgressCSV,
} from "@/utils/csvExportUtils";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download } from "lucide-react";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadGrantedContextsSection from "@/pages/frontPage/ReadGrantedContextsSection";
import { useReadGrantsByUser } from "@/hooks/useGrants";

export default function FrontPage() {
  const {
    data: userinfo,
    isPending: isUserinfoLoading,
    isError: isUserinfoError,
  } = useUser();

  const {
    data: readGrants,
    isPending: isReadGrantsLoading,
  } = useReadGrantsByUser(userinfo?.user.id || "");

  if (isUserinfoError) {
    return (
      <>
        <RedirectBackButton />
        <ErrorState message="Noe gikk galt, prøv gjerne igjen" />
      </>
    );
  }

  const teams = userinfo ? userinfo.groups : [];
  const hasTeams = teams.length > 0;
  const hasGrantedReadAccess = readGrants && readGrants.length > 0;

  if (!isUserinfoLoading && !isReadGrantsLoading && !hasTeams && !hasGrantedReadAccess) {
    return (
      <>
        <RedirectBackButton />
        <ErrorState message="Vi fant dessverre ingen grupper som tilhører din bruker, og ingenting er delt med deg." />
      </>
    );
  }

  return (
    <div>
      <RedirectBackButton />
      <Page>
        <div className="flex flex-col mx-auto px-8 items-start ">
          <Tabs defaultValue="teams">
            <TabsList className="grid w-[400px] grid-cols-2">
              <TabsTrigger
                value="teams"
                className="data-[state=active]:bg-card"
              >
                Dine Team
              </TabsTrigger>
              <TabsTrigger
                value="granted"
                className="data-[state=active]:bg-card"
              >
                Delt med deg
              </TabsTrigger>
            </TabsList>
            {hasTeams && (
              <>
            <TabsContent value={"teams"}>

              <h1 className="text-4xl font-bold">Dine team</h1>
              <div className="flex flex-col items-start">
                <div className="flex flex-row gap-8">
                  {userinfo?.superuser && (
                    <Button
                      variant="link"
                      className="w-fit font-bold has-[>svg]:px-0 my-2"
                      onClick={() => handleExportFullCSV()}
                    >
                      Eksporter skjemautfyllinger
                      <Download className="size-5" />
                    </Button>
                  )}
                  {userinfo?.reportinguser && (
                    <Button
                      variant="link"
                      className="w-fit font-bold has-[>svg]:px-0 my-2"
                      onClick={() => handleExportProgressCSV()}
                    >
                      Eksporter utfyllingstilstand
                      <Download className="size-5" />
                    </Button>
                  )}
                </div>
                <Separator className="my-5" />
                <SkeletonLoader loading={isUserinfoLoading}>
                  {teams.map((team) => {
                    return (
                      <div key={team.id}>
                        <h2 className="text-2xl font-bold py-4 w-fit">
                          {team.displayName}
                        </h2>
                        <TeamContexts teamId={team.id} />
                      </div>
                    );
                  })}
                </SkeletonLoader>
              </div>
            </TabsContent>

            </>
          )}
          </Tabs>
          {userinfo?.user.id && (
            <ReadGrantedContextsSection userId={userinfo.user.id} />
          )}
        </div>
      </Page>
    </div>
  );
}
