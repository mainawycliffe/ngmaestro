import { Route } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { SharedResultComponent } from './pages/shared-result.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'shared/:slug',
    component: SharedResultComponent,
  },
];
