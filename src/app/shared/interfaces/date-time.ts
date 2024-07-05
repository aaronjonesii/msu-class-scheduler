import { FieldValue, Timestamp } from "@angular/fire/firestore";

export type DateTime = WriteDateTime | ReadDateTime;

export type ReadDateTime = Timestamp;

export type WriteDateTime = FieldValue;
