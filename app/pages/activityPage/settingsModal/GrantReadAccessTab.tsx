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
import { Separator } from "@/components/ui/separator";
import {
  useFetchUsername,
  useSearchUser,
  useUser,
} from "@/hooks/useUser";
import { useGrants } from "@/hooks/useGrants";
import { useContext } from "@/hooks/useContext";
import { formatDate } from "@/utils/formatTime";
import { useDebounce } from "@/hooks/useDebounce";
import { Search } from "lucide-react";


const grantReadAccessFormSchema = z.object({
  userId: z.string().min(1, { message: "Du må velge en bruker." }),
  expiresAt: z
    .string()
    .min(1, { message: "Du må sette en utløpsdato." })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "Utløpsdato må være frem i tid.",
    }),
  justification: z
    .string()
    .min(1, { message: "Du må beskrive hvorfor denne tilgangen gis." }),
});

type GrantReadAccessTabProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export function GrantReadAccessTab({ setOpen }: GrantReadAccessTabProps) {
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

  const { readGrants, grantReadAccess } = useGrants(contextId ?? "");
  const readGrantList = readGrants.data ?? [];

  const ownerTeamName = userinfo?.groups.find(
    (team) => team.id === context?.teamId,
  )?.displayName;

  const GrantReadAccessForm = useForm<z.infer<typeof grantReadAccessFormSchema>>({
    resolver: zodResolver(grantReadAccessFormSchema),
    defaultValues: { userId: "", expiresAt: "", justification: "" },
  });

  const [usernameInput, setUsernameInput] = React.useState("");
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const hasSelectedUser = GrantReadAccessForm.watch("userId");
  const debouncedUsernameInput = useDebounce(usernameInput, 500);
  const isDebouncing = usernameInput !== debouncedUsernameInput;
  const { data: userSuggestions = [], isFetching: isSearching } = useSearchUser(
    hasSelectedUser ? "" : debouncedUsernameInput,
  );

  function onSubmit(value: z.infer<typeof grantReadAccessFormSchema>) {
    if (!userinfo?.user.id) return;

    grantReadAccess.mutate(
      {
        userId: value.userId,
        expiresAt: new Date(`${value.expiresAt}T23:59:59.999`).toISOString(),
        justification: value.justification,
        sharedBy: userinfo.user.id,
      },
      {
        onSuccess: () => {
          GrantReadAccessForm.reset();
          setUsernameInput("");
          setShowSuggestions(false);
        },
        onError: (error) => {
          if (isAxiosError(error) && error.response?.status === 409) {
            GrantReadAccessForm.setError("userId", {
              type: "manual",
              message: "Brukeren har allerede tilgang til dette skjemaet.",
            });
          } else {
            GrantReadAccessForm.setError("userId", {
              type: "manual",
              message: "Noe gikk galt. Prøv igjen senere.",
            });
          }
        },
      },
    );
  }

  const showUserResults =
    showSuggestions && !hasSelectedUser && usernameInput.length >= 1;

  return (
    <Card>
      <Form {...GrantReadAccessForm}>
        <form onSubmit={GrantReadAccessForm.handleSubmit(onSubmit)} className="space-y-4">
          <CardContent className="space-y-4 pt-4">
            <SkeletonLoader
              loading={
                contextIsPending || userinfoIsPending || readGrants.isLoading
              }
              width="w-full"
            >
              {contextError || userinfoError ? (
                <ErrorState message="Klarte ikke hente tilganger" />
              ) : (
                <section aria-label="Nåværende tilganger" className="space-y-2">
                  <h4 className="text-sm font-semibold">Hvem har tilgang</h4>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Eier (skrivetilgang)
                    </span>
                    <span className="font-medium">{ownerTeamName}</span>
                  </div>

                  {readGrantList.length > 0 && (
                    <>
                      <Separator />
                      <p className="text-sm text-muted-foreground">
                        Lesetilgang
                      </p>
                      <ul className="space-y-1">
                        {readGrantList.map((readGrant) => (
                          <li key={readGrant.userId} className="text-sm">
                            <div className="flex flex-col">
                              <UsernameDisplay userId={readGrant.userId} />
                              {readGrant.expiresAt && (
                                <span className="text-xs text-muted-foreground">
                                  Utløper {formatDate(readGrant.expiresAt)}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </section>
              )}
            </SkeletonLoader>

            <Separator />

            <FormField
              control={GrantReadAccessForm.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gi lesetilgang til bruker</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        type={"search"}
                        placeholder="Søk etter bruker"
                        value={usernameInput}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setShowSuggestions(false)}
                        onChange={(event) => {
                          const value = event.target.value;
                          setUsernameInput(value);
                          field.onChange("");
                          setShowSuggestions(true);
                        }}
                        className="pl-10"
                      />

                      {showUserResults && (
                        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-background p-1 shadow-md">
                          {isDebouncing || isSearching ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              Søker...
                            </div>
                          ) : userSuggestions.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              Ingen treff
                            </div>
                          ) : (
                            userSuggestions.map((user) => (
                              <Button
                                key={user.id}
                                type="button"
                                variant="ghost"
                                className="w-full justify-start rounded px-2 py-1 text-left text-sm"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  GrantReadAccessForm.setValue("userId", user.id, {
                                    shouldValidate: true,
                                  });
                                  setUsernameInput(user.displayName);
                                  setShowSuggestions(false);
                                }}
                              >
                                <span className="font-medium">
                                  {user.displayName}
                                </span>
                              </Button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={GrantReadAccessForm.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utløpsdato</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={GrantReadAccessForm.control}
              name="justification"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Begrunnelse</FormLabel>
                  <FormControl>
                    <Input type="text" placeholder="Begrunn hvorfor tilgangen gis" {...field} />
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
            <Button
              type="submit"
              disabled={grantReadAccess.isPending || userinfoIsPending}
            >
              Gi tilgang
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}

function UsernameDisplay({ userId }: { userId: string }) {
  const {
    data: username,
    error: usernameError,
    isPending: usernameIsLoading,
  } = useFetchUsername(userId);

  if (usernameIsLoading) return <span className="text-muted-foreground">Laster...</span>;
  if (usernameError) return <span className="text-destructive">Feil ved henting av bruker</span>;
  return <span>{username}</span>;
}
