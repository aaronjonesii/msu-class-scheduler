import { DocumentReference } from "@angular/fire/firestore";
import { User } from "@angular/fire/auth";

export interface Schedule {
  id?: string,
  userId: string,
  userRef: DocumentReference<User>,
  name: string,
  description: string | null,
}
