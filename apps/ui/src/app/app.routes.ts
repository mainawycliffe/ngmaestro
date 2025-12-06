import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'shared/:slug',
    loadComponent: () =>
      import('./pages/shared-result.component').then(
        (m) => m.SharedResultComponent,
      ),
  },
];
