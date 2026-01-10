import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { ApiClientService } from '../shared/api-client-service';
import { AdminBooking } from '../shared/types';
import { AdminAuthService } from './admin-auth-service';

export interface BookingsPage {
  bookings: AdminBooking[];
  total: number | null;
}

@Injectable({ providedIn: 'root' })
export class AdminBookingsService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly auth = inject(AdminAuthService);

  loadBookings(scope: 'future' | 'all', page: number, pageSize: number) {
    const headers = this.auth.authHeaders();
    if (!headers) {
      return throwError(() => new Error('Missing admin token.'));
    }

    const params = new HttpParams()
      .set('scope', scope)
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<unknown>(this.api.url('/bookings'), { headers, params })
      .pipe(
        map((payload) => this.normalize(payload)),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error.error as { message?: string } | null)?.message ||
            error.message ||
            `Failed to load bookings (HTTP ${error.status})`;
          return throwError(() => new Error(message));
        }),
      );
  }

  private normalize(payload: unknown): BookingsPage {
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { bookings?: unknown }).bookings)
        ? (payload as { bookings: unknown[] }).bookings
        : [];
    const total =
      !Array.isArray(payload) && typeof (payload as { total?: unknown }).total === 'number'
        ? Math.max(0, Math.floor((payload as { total: number }).total))
        : null;
    return { bookings: items as AdminBooking[], total };
  }
}
