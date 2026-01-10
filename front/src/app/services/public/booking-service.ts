import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, map, throwError } from 'rxjs';
import { ApiClientService } from './api-client-service';
import { Availability, BookingResult } from '../../shared/types';

interface AvailabilityParams {
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
}

interface CreateBookingPayload {
  roomTypeId: number;
  checkInDate: string;
  checkOutDate: string;
  name: string;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);

  checkAvailability(params: AvailabilityParams) {
    const query = new HttpParams().set('checkInDate', params.checkInDate).set('checkOutDate', params.checkOutDate);
    return this.http
      .get<Availability>(this.api.url(`/room-types/${params.roomTypeId}/availability`), { params: query })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          throwError(() => new Error(error.message || `Failed to check availability (HTTP ${error.status})`)),
        ),
      );
  }

  createBooking(payload: CreateBookingPayload) {
    const body = {
      roomTypeId: payload.roomTypeId,
      checkInDate: payload.checkInDate,
      checkOutDate: payload.checkOutDate,
      guestName: payload.name,
      guestEmail: payload.email,
      guestPhone: payload.phone,
    };
    return this.http.post<BookingResult>(this.api.url('/bookings'), body, { observe: 'response' }).pipe(
      map((res) => res.body ?? {}),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 400 && error.error && typeof error.error === 'object') {
          const message = (error.error as { message?: string }).message;
          return throwError(() => new Error(message || 'Unknown error!'));
        }
        const errorText = (error.error as { message?: string }).message || `Failed to create booking (HTTP ${error.status})`;
        return throwError(() => new Error(errorText));
      }),
    );
  }
}
