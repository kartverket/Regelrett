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
import { SkeletonLoader } from "@/components/SkeletonLoader";
import { ErrorState } from "@/components/ErrorState";
import { useParams } from "react-router";
import { isAxiosError } from "axios";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@/hooks/useUser";
import { useShares } from "@/hooks/useShares";
import { useContext } from "@/hooks/useContext";

const shareFormSchema = z.object({
  userId: z.string().min(1, { message: "Du må skrive inn brukerens id." }),
});

type ShareAccessTab = {
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function ShareAccessTab({ setOpen }: ShareAccessTab) {
  const { contextId } = useParams<{ contextId: string }>();
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

  const { shares, shareContext } = useShares(contextId ?? "");
  const shareList = shares.data ?? [];

  const ownerTeamName = userinfo?.groups.find(
    (team) => team.id === context?.teamId,
  )?.displayName;

  const shareForm = useForm<z.infer<typeof shareFormSchema>>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: { userId: "" },
  });

  function onSubmit(value: z.infer<typeof shareFormSchema>) {
    shareContext.mutate({
      contextId: contextId ?? "",
      userId: value.userId,
      accessLevel: "read",
    }, {
      onSuccess: () => {
        setOpen(false);
        toast.success("Endringen er lagret!", {
          description: `Bruker har fått tilgang til skjemaet.`,
          duration: 5000,
          id: "change-context-name-success",
        });
      },
      onError: (error) => {
        if (isAxiosError(error) && error.response?.status === 409) {
          shareForm.setError("userId", {
            type: "manual",
            message: "Brukeren har allerede tilgang til dette skjemaet.",
          });
        } else {
          shareForm.setError("userId", {
            type: "manual",
            message: "Noe gikk galt. Prøv igjen senere.",
          });
        }
      },
    });
  }

  return (
    <Card>
      <Form {...shareForm}>
        <form onSubmit={shareForm.handleSubmit(onSubmit)} className="space-y-8">
          <CardContent className="space-y-2">
            <h4 className="text-sm font-bold">
              Hvem har tilgang til dette skjemaet:
            </h4>
            <SkeletonLoader loading={contextIsPending || userinfoIsPending}>
              {contextError || userinfoError ? (
                <ErrorState message={"Klarte ikke hente teamet"} />
              ) : (
                <>
                  <p className="mb-4">
                    <strong>Eier:</strong> {ownerTeamName}
                  </p>
                  {shareList.length > 0 && (
                    <>
                      <p className="mb-4">Lesetilgang: </p>
                      {shareList.map((share) => (
                        <p key={share.id}>{share.userId}</p>
                      ))}
                    </>
                  )}
                </>
              )}
            </SkeletonLoader>

            <FormField
              control={shareForm.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Skriv bruker-iden til brukeren som skal få lesetilgang til
                    skjemaet:
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Brukerid" {...field} />
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
