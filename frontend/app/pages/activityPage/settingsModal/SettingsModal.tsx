import type { Dispatch, SetStateAction } from "react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangeTeamTab } from "@/pages/activityPage/settingsModal/ChangeTeamTab";
import { CopyContextTab } from "@/pages/activityPage/settingsModal/CopyContextTab";
import { ChangeContextNameTab } from "@/pages/activityPage/settingsModal/ChangeContextNameTab";
import { GrantReadAccessTab } from "@/pages/activityPage/settingsModal/GrantReadAccessTab";

type SettingsModalProps = {
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: boolean;
};

export function SettingsModal({ open, setOpen }: SettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={(open) => !open && setOpen(false)}>
      <DialogContent className="sm:max-w-112.5" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-xl">Rediger skjemautfylling</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="team" className="w-100">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="team" className="data-[state=active]:bg-card">
              Endre team
            </TabsTrigger>
            <TabsTrigger value="copy" className="data-[state=active]:bg-card">
              Kopier svar
            </TabsTrigger>
            <TabsTrigger value="name" className="data-[state=active]:bg-card">
              Endre navn
            </TabsTrigger>
            <TabsTrigger value="access" className="data-[state=active]:bg-card">
              Tilganger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="min-h-70">
            <ChangeTeamTab setOpen={setOpen} />
          </TabsContent>

          <TabsContent value="copy" className="min-h-70">
            <CopyContextTab setOpen={setOpen} />
          </TabsContent>

          <TabsContent value="name" className="min-h-70">
            <ChangeContextNameTab setOpen={setOpen} />
          </TabsContent>

          <TabsContent value="access" className="min-h-60">
            <GrantReadAccessTab setOpen={setOpen} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
