import { CanActivateFn, Router } from '@angular/router';
import { inject } from "@angular/core";
import { AuthService } from "../services/auth.service";
import { catchError, map, of, take } from "rxjs";
import { appRoutes } from "../../app.routes";
import { LoggerService } from "../services/logger.service";

export const RedirectLoggedInGuard: CanActivateFn = () => {
  const auth = inject(AuthService);

  const router = inject(Router);

  const logger = inject(LoggerService);

  return auth.authState$().pipe(
    take(1),
    map((user) => {
      const isAuthenticated = !!user;

      if (isAuthenticated) {
        router.navigate([appRoutes.home]);
      }

      return !isAuthenticated;
    }),
    catchError((error: unknown) => {
      logger.error('Error in RedirectSignedInGuard:', error);

      router.navigate([appRoutes.error]);

      return of(false);
    }),
  );
};
