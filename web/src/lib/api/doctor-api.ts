import type { Schemas, Snapshot } from "./types";

export type RequestOptions = { signal?: AbortSignal };
export type PatientQuery = {
  q?: string;
  filter?: "active" | "with_updates" | "inactive";
  cursor?: string;
};
export type PatientContext = { patientId: string; temporaryAccessId?: string };
export type Timed<T> = { data: T; serverTime: string };
export interface DoctorApi {
  session(o?: RequestOptions): Promise<Timed<Schemas["Session"]>>;
  logout(o?: RequestOptions): Promise<void>;
  patients(
    query: PatientQuery,
    o?: RequestOptions,
  ): Promise<Schemas["PatientList"]>;
  resolve(
    token: string,
    o?: RequestOptions,
  ): Promise<Timed<Schemas["SharingResolution"]>>;
  requestFollowup(
    input: Schemas["FollowupRequestInput"],
    key: string,
    o?: RequestOptions,
  ): Promise<Schemas["FollowupRequest"]>;
  followup(id: string, o?: RequestOptions): Promise<Schemas["FollowupRequest"]>;
  snapshot(ctx: PatientContext, o?: RequestOptions): Promise<Timed<Snapshot>>;
  access(
    ctx: PatientContext,
    known?: { dataRevision: string; accessRevision: string },
    o?: RequestOptions,
  ): Promise<Timed<Schemas["AccessStatus"]>>;
  updates(
    ctx: PatientContext,
    snapshotId: string,
    cursor?: string,
    o?: RequestOptions,
  ): Promise<Schemas["UpdatesPage"]>;
  review(
    ctx: PatientContext,
    input: Schemas["ReviewInput"],
    key: string,
    o?: RequestOptions,
  ): Promise<Schemas["ReviewResult"]>;
  original(ctx: PatientContext, id: string, o?: RequestOptions): Promise<Blob>;
  closeTemporary(id: string, o?: RequestOptions): Promise<void>;
}
