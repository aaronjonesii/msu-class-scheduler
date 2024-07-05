import { Routes } from '@angular/router';
import { AuthGuard } from "./shared/guards/auth.guard";
import {
  RedirectLoggedInGuard
} from "./shared/guards/redirect-logged-in.guard";

export const appRoutes = {
  error: '/error',
  home: '/',
  scheduleDetail: (id: string) => `/schedule/${id}`,
  schedules: '/schedules',
  signIn: '/sign-in',
};

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Home page',
    loadComponent: () => import('./features/home/home.component')
      .then((c) => c.HomeComponent),
  },
  {
    path: 'error',
    title: 'Error page',
    loadComponent: () => import('./features/error/error.component')
      .then((c) => c.ErrorComponent),
  },
  {
    path: 'schedule/:id',
    title: 'Schedule details',
    loadComponent: () => import('./features/schedule-detail/schedule-detail.component')
      .then((c) => c.ScheduleDetailComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'schedules',
    title: 'Schedules',
    loadComponent: () => import('./features/schedules/schedules.component')
      .then((c) => c.SchedulesComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'sign-in',
    title: 'Sign in page',
    loadComponent: () => import('./features/sign-in/sign-in.component')
      .then((c) => c.SignInComponent),
    canActivate: [RedirectLoggedInGuard],
  },
  { path: '**', redirectTo: '' },
];
