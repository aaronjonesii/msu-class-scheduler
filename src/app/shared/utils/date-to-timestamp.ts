import { Timestamp } from "@angular/fire/firestore";

export function dateToTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}