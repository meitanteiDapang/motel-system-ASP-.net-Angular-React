import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, of, switchMap, tap } from 'rxjs';
import { AdminBooking } from '../../../shared/types';
import { AdminAuthService } from '../../../services/admin/admin-auth-service';
import { AdminBookingsService } from '../../../services/admin/admin-bookings-service';

const formatRoomLabel = (roomTypeId?: number, roomNumber?: number) => {
  if (roomTypeId != null && roomNumber != null) {
    return `t${roomTypeId}-${roomNumber}`;
  }
  if (roomTypeId != null) {
    return `t${roomTypeId}-?`;
  }
  if (roomNumber != null) {
    return `t?-${roomNumber}`;
  }
  return '-';
};

@Component({
  selector: 'app-bookings-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table.html',
  styleUrls: ['../../admin-shared.scss', './table.scss'],
})
export class BookingsTableComponent {
  private readonly auth = inject(AdminAuthService);
  private readonly bookingsService = inject(AdminBookingsService);

  readonly PAGE_SIZE = 20;
  readonly showFutureOnly = signal(true);
  readonly page = signal(1);
  private readonly allSinceDate = '1970-01-01';

  bookings: AdminBooking[] = [];
  loadError: string | null = null;
  total: number | null = null;
  constructor() {
    const token$ = toObservable(this.auth.token);
    const filter$ = toObservable(this.showFutureOnly);
    const page$ = toObservable(this.page);

    combineLatest([token$, filter$, page$])
      .pipe(
        switchMap(([token, showFuture, page]) => {
          if (!token) {
            this.bookings = [];
            this.total = null;
            this.loadError = null;
            return of(null);
          }
          const fromDate = showFuture ? this.getNzToday() : this.allSinceDate;
          return this.bookingsService.loadBookings(fromDate, page, this.PAGE_SIZE).pipe(
            tap(({ bookings, total }) => {
              this.bookings = bookings;
              this.total = total;
              this.loadError = null;
            }),
            catchError((err) => {
              this.bookings = [];
              this.total = null;
              this.loadError = err instanceof Error ? err.message : 'Unknown error';
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  get token(): string | null {
    return this.auth.token();
  }

  get toggleLabel(): string {
    return this.showFutureOnly() ? 'Show all (check-out)' : 'Show future (check-out)';
  }

  get pageCount(): number | null {
    return this.total != null ? Math.max(1, Math.ceil(this.total / this.PAGE_SIZE)) : null;
  }

  get isNextDisabled(): boolean {
    return this.total != null ? this.page() * this.PAGE_SIZE >= this.total : this.bookings.length < this.PAGE_SIZE;
  }

  toggleScope(): void {
    this.page.set(1);
    this.showFutureOnly.set(!this.showFutureOnly());
  }

  previousPage(): void {
    this.page.update((value) => Math.max(1, value - 1));
  }

  nextPage(): void {
    this.page.update((value) => value + 1);
  }

  formatRoomLabel(roomTypeId?: number, roomNumber?: number): string {
    return formatRoomLabel(roomTypeId, roomNumber);
  }

  onDelete(booking: AdminBooking, details: HTMLDetailsElement | null): void {
    // Placeholder for future delete action; keep UI behaviour consistent.
    // eslint-disable-next-line no-console
    console.log('delete booking id:', booking.id ?? '-');
    if (details) {
      details.removeAttribute('open');
    }
  }

  private getNzToday(): string {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Pacific/Auckland',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    return `${pick('year')}-${pick('month')}-${pick('day')}`;
  }
}
