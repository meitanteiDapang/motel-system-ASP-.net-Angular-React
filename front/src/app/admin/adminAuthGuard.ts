import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { AdminAuthService } from './adminAuthService';

export const adminAuthGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);

  return auth.ensureValidToken().pipe(
    tap((valid) => {
      if (!valid) {
        router.navigate(['/adminLogin']);
      }
    }),
    map((valid) => valid),
  );
};
