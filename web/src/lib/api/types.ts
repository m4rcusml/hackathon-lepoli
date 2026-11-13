import type { components } from "./generated";

export type Schemas = components["schemas"];
export type Snapshot = Schemas["Snapshot"];
export type EvidenceRef = Schemas["EvidenceRef"];
export type Evidence = Schemas["Evidence"];
export type Session = Schemas["Session"];
export type Scope = Schemas["Scope"];
export type AccessContext = Schemas["AccessContext"];
export type Mode = "real" | "demo";
export type OpenEvidence = (ref: EvidenceRef) => void;
