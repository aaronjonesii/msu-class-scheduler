import { Routes } from '@angular/router';

export const appRoutes = {
  home: '/',
  signIn: '/sign-in',
  error: '/error',
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
    path: 'sign-in',
    loadComponent: () => import('./features/sign-in/sign-in.component')
      .then((c) => c.SignInComponent),
  },
  { path: '**', redirectTo: '' },
];
