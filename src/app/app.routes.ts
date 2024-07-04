import { Routes } from '@angular/router';
import { AuthGuard } from "./shared/guards/auth.guard";
import {
  RedirectLoggedInGuard
} from "./shared/guards/redirect-logged-in.guard";

export const appRoutes = {
  error: '/error',
  home: '/',
  schedules: '/schedules',
  signIn: '/sign-in',
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home.component')
      .then((c) => c.HomeComponent),
  },
  {
    path: 'error',
    loadComponent: () => import('./features/error/error.component')
      .then((c) => c.ErrorComponent),
  },
  {
    path: 'schedules',
    loadComponent: () => import('./features/schedules/schedules.component')
      .then((c) => c.SchedulesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'sign-in',
    loadComponent: () => import('./features/sign-in/sign-in.component')
      .then((c) => c.SignInComponent),
    canActivate: [RedirectLoggedInGuard],
  },
  { path: '**', redirectTo: '' },
];
