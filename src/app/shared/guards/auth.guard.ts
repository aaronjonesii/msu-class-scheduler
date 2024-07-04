import { inject } from '@angular/core';
import {
  CanActivateFn, Router,
} from '@angular/router';
import { catchError, map, of, take } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { appRoutes } from "../../app.routes";
import { LoggerService } from "../services/logger.service";

export const AuthGuard: CanActivateFn = (_, state) => {
  const auth = inject(AuthService);

  const router = inject(Router);

  const logger = inject(LoggerService);

  return auth.authState$().pipe(
    take(1),
    map((user) => {
      const isAuthenticated = !!user;

      if (!isAuthenticated) {
        router.navigate(
          [appRoutes.signIn],
          { queryParams: { redirectURL: state.url } },
        );
      }

      return isAuthenticated;
    }),
    catchError((error: unknown) => {
      logger.error('Error in AuthGuard:', error);

      router.navigate([appRoutes.error]);

      return of(false);
    }),
  );
};
