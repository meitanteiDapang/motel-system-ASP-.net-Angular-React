import { Routes } from '@angular/router';
import { HomePageComponent } from './home/home';
import { BookingComponent } from './booking/booking';
import { BookingSuccessComponent } from './booking/success/success';
import { AdminLoginComponent } from './admin/login/login';
import { AdminPageComponent } from './admin/page/page';
import { adminAuthGuard } from './admin/adminAuthGuard';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent,
  },
  {
    path: 'book',
    component: BookingComponent,
  },
  {
    path: 'booked',
    component: BookingSuccessComponent,
  },
  {
    path: 'adminLogin',
    component: AdminLoginComponent,
  },
  {
    path: 'admin',
    component: AdminPageComponent,
    canActivate: [adminAuthGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
