import {z} from "zod";

export const partnerApplicationStorageKey="jeep-build-lab:partner-applications:v1";
export const partnerApplicationNotesStorageKey="jeep-build-lab:partner-application-notes:v1";

const trackerKey=z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);
export const partnerApplicationStatusSchema=z.enum(["todo","ready","submitted","approved","paused","blocked"]);
export const partnerApplicationBackupSchema=z.object({
 statuses:z.record(trackerKey,partnerApplicationStatusSchema),
 notes:z.record(trackerKey,z.string().max(240))
}).strict().superRefine((value,ctx)=>{
 if(Object.keys(value.statuses).length>100||Object.keys(value.notes).length>100)ctx.addIssue({code:z.ZodIssueCode.custom,message:"Too many partner application records."});
});

export type PartnerApplicationBackup=z.infer<typeof partnerApplicationBackupSchema>;
