import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { firstValueFrom, from, of, switchMap } from 'rxjs';
import { AdminBooking } from '../../../shared/types';
import { AdminAuthService } from '../../../services/admin/admin-auth-service';
import { AdminBookingsService, BookingsPage } from '../../../services/admin/admin-bookings-service';

const TIMELINE_PAGE_SIZE = 500;

const LETTER_COLOR_MAP: Record<string, [string, string]> = {
  A: ['#f3b0c3', '#5a1032'],
  B: ['#f7c7a6', '#512400'],
  C: ['#bde3ff', '#0c2d55'],
  D: ['#c9d1ff', '#1f1f5b'],
  E: ['#c7f2d8', '#114527'],
  F: ['#ffe0b5', '#5f3200'],
  G: ['#ffd1dc', '#5a1b2c'],
  H: ['#d8f0ff', '#0b2f4e'],
  I: ['#f3e2ff', '#3a0f5a'],
  J: ['#d4f7ed', '#064633'],
  K: ['#ffe7c8', '#5a3100'],
  L: ['#e4d5ff', '#2a1457'],
  M: ['#fbe0e3', '#5a1d26'],
  N: ['#d8f8d6', '#0f4a1c'],
  O: ['#e7f0ff', '#0c2e63'],
  P: ['#f7e3c7', '#4f2c00'],
  Q: ['#f2d9ff', '#40155a'],
  R: ['#d6fff1', '#0d4636'],
  S: ['#ffe7d1', '#5c2c00'],
  T: ['#e1d8ff', '#24155d'],
  U: ['#ffdfea', '#5a1f38'],
  V: ['#d4f4ff', '#0f3f5a'],
  W: ['#f3ffe0', '#394f08'],
  X: ['#ffe0f3', '#5a1f4a'],
  Y: ['#e0ecff', '#0f2f5a'],
  Z: ['#dfffe7', '#0f4a2b'],
};

const toDateKey = (date: Date) => date.toISOString().slice(0, 10);

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

const getNzYesterdayUtcDate = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Pacific/Auckland',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  });
  const parts = formatter.formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? '0');
  const nzNow = Date.UTC(
    pick('year'),
    pick('month') - 1,
    pick('day'),
    pick('hour'),
    pick('minute'),
    pick('second'),
  );
  const yesterday = new Date(nzNow);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return new Date(Date.UTC(yesterday.getUTCFullYear(), yesterday.getUTCMonth(), yesterday.getUTCDate()));
};

const parseUtcDate = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate()));
};

@Component({
  selector: 'app-bookings-timeline',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline.html',
  styleUrls: ['../../admin-shared.scss', './timeline.scss'],
})
export class BookingsTimelineComponent implements AfterViewInit {
  private readonly auth = inject(AdminAuthService);
  private readonly bookingsService = inject(AdminBookingsService);

  @ViewChild('scrollContainer') scrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChildren('yesterdayHeader') yesterdayHeaders?: QueryList<ElementRef<HTMLTableCellElement>>;

  bookings: AdminBooking[] = [];
  rooms: string[] = [];
  days: Date[] = [];
  grid = new Map<string, AdminBooking>();
  loadError: string | null = null;
  readonly yesterdayKey = toDateKey(getNzYesterdayUtcDate());

  constructor() {
    toObservable(this.auth.token)
      .pipe(
        switchMap((token) => {
          if (!token) {
            this.resetTimeline();
            return of(null);
          }
          return from(this.loadAllBookings());
        }),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.buildTimeline();
        setTimeout(() => this.scrollToYesterday());
      });
  }

  ngAfterViewInit(): void {
    this.scrollToYesterday();
  }

  get token(): string | null {
    return this.auth.token();
  }

  toDateKey(date: Date): string {
    return toDateKey(date);
  }

  getBooking(room: string, day: Date): AdminBooking | undefined {
    return this.grid.get(`${room}|${toDateKey(day)}`);
  }

  getCellStyle(booking?: AdminBooking) {
    const guestInitial =
      booking?.guestName && booking.guestName.trim().length > 0
        ? booking.guestName.trim()[0]!.toUpperCase()
        : null;
    const colors = guestInitial ? LETTER_COLOR_MAP[guestInitial] : undefined;
    return colors
      ? {
          backgroundColor: colors[0],
          color: colors[1],
          fontWeight: 700,
        }
      : {};
  }

  formatRoomLabel(roomTypeId?: number, roomNumber?: number): string {
    return formatRoomLabel(roomTypeId, roomNumber);
  }

  private async loadAllBookings(): Promise<void> {
    try {
      const all: AdminBooking[] = [];
      const fromDate = '1970-01-01';
      const page: BookingsPage = await firstValueFrom(
        this.bookingsService.loadBookings(fromDate, TIMELINE_PAGE_SIZE),
      );
      const bookings: AdminBooking[] = page.bookings;
      all.push(...bookings);

      this.bookings = all;
      this.loadError = null;
    } catch (err) {
      this.bookings = [];
      this.loadError = err instanceof Error ? err.message : 'Failed to load bookings.';
    }
  }

  private buildTimeline(): void {
    const roomSet = new Set<string>();
    let minDate: Date = getNzYesterdayUtcDate();
    let maxDate: Date | null = null;
    const occupancy = new Map<string, AdminBooking>();

    this.bookings.forEach((booking) => {
      const roomLabel = formatRoomLabel(booking.roomTypeId, booking.roomNumber);
      const start = parseUtcDate(booking.checkInDate);
      const end = parseUtcDate(booking.checkOutDate);
      if (!start || !end) return;

      roomSet.add(roomLabel);
      if (start && minDate && start < minDate) {
        minDate = start;
      }
      if (!maxDate || end > maxDate) {
        maxDate = end;
      }

      let cursor = start;
      while (cursor <= end) {
        const key = `${roomLabel}|${toDateKey(cursor)}`;
        occupancy.set(key, booking);
        cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
      }
    });

    if (!maxDate) {
      this.rooms = [];
      this.days = [];
      this.grid = new Map<string, AdminBooking>();
      return;
    }

    const daysList: Date[] = [];
    const endDate = maxDate;
    const startDate = minDate;
    const endTime = (endDate as Date).getTime();

    for (let time = startDate.getTime(); time <= endTime; time += 24 * 60 * 60 * 1000) {
      daysList.push(new Date(time));
    }

    this.rooms = Array.from(roomSet.values()).sort();
    this.days = daysList;
    this.grid = occupancy;
  }

  private resetTimeline(): void {
    this.bookings = [];
    this.rooms = [];
    this.days = [];
    this.grid = new Map<string, AdminBooking>();
    this.loadError = null;
  }

  private scrollToYesterday(): void {
    if (!this.scrollContainer?.nativeElement) {
      return;
    }
    const header =
      this.yesterdayHeaders?.toArray().find((el) => el.nativeElement.dataset['yesterday'] === 'true')
        ?.nativeElement;
    if (header) {
      this.scrollContainer.nativeElement.scrollLeft = header.offsetLeft;
    }
  }
}
