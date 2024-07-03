import { inject, Injectable } from '@angular/core';
import { Auth, AuthError, authState, GoogleAuthProvider,
  signInWithPopup, User, UserCredential } from "@angular/fire/auth";
import { Observable } from "rxjs";
import { LoggerService } from "./logger.service";
import { NavigationExtras, Router } from "@angular/router";
import { appRoutes } from "../../app.routes";

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private logger = inject(LoggerService);
  private router = inject(Router);

  /**
   * Creates an Observable of authentication state changes.
   * It emits only on sign-in or sign-out events.
   *
   * @return {User | null}
   */
  get authState$(): Observable<User | null> {
    return authState(this.auth);
  }

  /**
   * Signs the user in with Google authentication using a pop-up.
   *
   * @remarks
   * If succeeds, returns the signed in user along with the provider's
   * credential. If sign in was unsuccessful, returns an error object
   * containing additional information about the error.
   *
   * @return {Promise<UserCredential | AuthError>} A Promise that resolves
   * with UserCredential upon success, or an AuthError on failure.
   */
  async googleLogin(): Promise<UserCredential | AuthError> {
    const provider = new GoogleAuthProvider();

    return await signInWithPopup(this.auth, provider)
      .then((newCredential) => {
        this.router.navigate([appRoutes.home]);

        return newCredential;
      }).catch((error: AuthError) => {
        this.logger.error(
          `Something went wrong signing in with Google`,
          [error, this.auth, provider],
        );

        return error;
      });
  }

  /**
   * Asserts that the current user is signed in.
   * If the user is not authenticated, they are redirected to the sign-in page.
   * This method is intended for use within route guards or other scenarios
   * where authentication is strictly required.
   *
   * @param {User | null} user - The user object to check for authentication
   * status.
   * @param {NavigationExtras} navigationExtras - (Optional) An object
   * containing additional navigation settings to pass to the sign-in
   * redirect. See {@link NavigationExtras}.
   * @throws {Error} If the user is not signed in, triggering a redirection.
   */
  assertUser(
    user: User | null,
    navigationExtras?: NavigationExtras,
  ): asserts user {
    if (!user) {
      this.router.navigate([appRoutes.signIn], navigationExtras);
      throw new Error(`You must be signed in`);
    }
  }
}
