import { Input } from "@/components/ui/input";
import type { Dispatch, SetStateAction } from "react";
import React from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useChangeTeamForContext, useContext } from "@/hooks/useContext";
import { useUser } from "@/hooks/useUser";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { useParams } from "react-router";
import { isAxiosError } from "axios";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

const teamFormSchema = z.object({
  newTeamName: z.string().min(1, { message: "Du må skrive inn et teamnavn." }),
});

type CopyContextTabProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function ChangeTeamTab({ setOpen }: CopyContextTabProps) {
  const searchParams = useParams();

  const {
    data: context,
    error: contextError,
    isPending: contextIsPending,
  } = useContext(searchParams.contextId);
  const {
    data: userinfo,
    error: userinfoError,
    isPending: userinfoIsPending,
  } = useUser();

  const currentTeamName = userinfo?.groups.find(
    (team) => team.id === context?.teamId,
  )?.displayName;

  const teamSubmitMutation = useChangeTeamForContext({
    onSuccess: () => setOpen(false),
    contextId: searchParams.contextId,
    currentTeamName: currentTeamName || "",
  });

  const teamForm = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: { newTeamName: "" },
  });

  function onSubmit(value: z.infer<typeof teamFormSchema>) {
    teamSubmitMutation.mutate(value.newTeamName, {
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 400) {
          teamForm.setError("newTeamName", {
            type: "manual",
            message: "Teamet finnes ikke. Sjekk at du har skrevet riktig.",
          });
        } else if (isAxiosError(error) && error.response?.status === 409) {
          teamForm.setError("newTeamName", {
            type: "manual",
            message:
              "Teamet du prøver å overføre til har allerede en skjemautfylling med samme navn for denne skjematypen. Endre navn på en av skjemautfyllingene",
          });
        } else {
          teamForm.setError("newTeamName", {
            type: "manual",
            message: "Noe gikk galt. Prøv igjen senere.",
          });
        }
      },
    });
  }

  return (
    <Card>
      <Form {...teamForm}>
        <form onSubmit={teamForm.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-2">
            <h4 className="text-sm font-bold">Skjemaet tilhører teamet:</h4>
            <SkeletonLoader loading={userinfoIsPending || contextIsPending}>
              {userinfoError || contextError ? (
                <ErrorState message={"Klarte ikke hente teamnavn"} />
              ) : (
                <p className="mb-4">{currentTeamName}</p>
              )}
            </SkeletonLoader>

            <FormField
              control={teamForm.control}
              name="newTeamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Skriv inn teamnavnet skjemaet skal gjelde for:
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Teamnavn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            <Button
              type="reset"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Avbryt
            </Button>
            <Button type="submit">Lagre</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
