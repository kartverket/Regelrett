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
import { Download, FileText } from "lucide-react";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReadGrantedContextsSection from "@/pages/frontPage/ReadGrantedContextsSection";


export default function FrontPage() {
  const {
    data: userinfo,
    isPending: isUserinfoLoading,
    isError: isUserinfoError,
  } = useUser();

  if (isUserinfoError) {
    return (
      <>
        <RedirectBackButton />
        <ErrorState message="Noe gikk galt, prøv gjerne igjen" />
      </>
    );
  }

  const teams = userinfo ? userinfo.groups : [];



  return (
    <div>
      <RedirectBackButton />
      <Page>
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-8">
          <Tabs defaultValue="teams" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
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

            <TabsContent value={"teams"} className="w-full space-y-6">
              <SkeletonLoader loading={isUserinfoLoading} height={"h-[700px]"}>
                {teams.length > 0 ? (
                  <>
                    <div>
                      <h1 className="text-4xl font-bold mb-2">Dine team</h1>
                      <p className="text-muted-foreground">
                        Administrer og fyll ut skjemaer for dine team
                      </p>
                    </div>

                    <div className="flex flex-row gap-4 flex-wrap">
                      {userinfo?.superuser && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleExportFullCSV()}
                        >
                          <Download className="size-4" />
                          Eksporter skjemautfyllinger
                        </Button>
                      )}
                      {userinfo?.reportinguser && (
                        <Button
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleExportProgressCSV()}
                        >
                          <Download className="size-4" />
                          Eksporter utfyllingstilstand
                        </Button>
                      )}
                    </div>

                    <div className="space-y-6">
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
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="size-12 mx-auto mb-4 text-muted-foreground" />
                    <h2 className="text-lg font-semibold">
                      Vi fant ingen team
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Du har ikke tilgang til noen team ennå
                    </p>
                  </div>
                )}
              </SkeletonLoader>
            </TabsContent>

            <TabsContent value={"granted"} className="w-full">
              {userinfo?.user.id && (
                <ReadGrantedContextsSection userId={userinfo.user.id} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Page>
    </div>
  );
}
