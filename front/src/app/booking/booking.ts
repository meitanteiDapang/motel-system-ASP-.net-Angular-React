import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, debounceTime, EMPTY, finalize, startWith, switchMap, tap, catchError } from 'rxjs';
import { BookingService } from '../shared/bookingService';
import { RoomTypesService } from '../shared/roomTypesService';
import { Availability, RoomType } from '../shared/types';

const sanitizePhone = (raw: string): string => {
  if (!raw) return '';
  const cleaned = raw.replace(/[^\d+]/g, '');
  const hasLeadingPlus = cleaned.startsWith('+');
  const digits = cleaned.replace(/\D/g, '');
  return hasLeadingPlus ? `+${digits}` : digits;
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.scss'],
})
export class BookingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly roomTypesService = inject(RoomTypesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly bookingForm = this.fb.group({
    checkInDate: [''],
    checkOutDate: [''],
    name: [''],
    email: [''],
    phone: [''],
  });

  readonly roomTypesState = this.roomTypesService.roomTypesState;
  readonly roomTypeId = signal<number | null>(this.parseRoomTypeId(this.route.snapshot.queryParamMap.get('roomTypeId')));
  readonly selectedRoom = computed<RoomType | null>(() => {
    const id = this.roomTypeId();
    if (id == null) return null;
    return this.roomTypesState().data.find((room) => room.id === id) ?? null;
  });

  availability: Availability | null = null;
  checking = false;
  submitting = false;
  error = '';
  availabilityError = '';
  success = '';
  readonly today = toIsoDate(new Date());

  constructor() {
    this.roomTypesService.ensureLoaded();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.roomTypeId.set(this.parseRoomTypeId(params.get('roomTypeId')));
    });
    this.setupAvailabilityWatcher();
  }

  get minCheckOutDate(): string {
    const checkIn = this.bookingForm.controls.checkInDate.value;
    if (!checkIn) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return toIsoDate(tomorrow);
    }
    const parsed = new Date(checkIn);
    if (Number.isNaN(parsed.getTime())) {
      return this.today;
    }
    parsed.setDate(parsed.getDate() + 1);
    return toIsoDate(parsed);
  }

  get totalPrice() {
    const room = this.selectedRoom();
    const formValue = this.bookingForm.value;
    if (!room || !formValue.checkInDate || !formValue.checkOutDate) {
      return null;
    }
    const checkIn = new Date(formValue.checkInDate);
    const checkOut = new Date(formValue.checkOutDate);
    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return null;
    }
    if (checkOut <= checkIn) {
      return null;
    }
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return null;
    return { nights, total: nights * room.price };
  }

  get bookingButtonDisabled(): boolean {
    const formValue = this.bookingForm.value;
    return (
      this.submitting ||
      this.checking ||
      !formValue.checkInDate ||
      !formValue.checkOutDate ||
      this.availability?.available === false
    );
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bookingForm.controls.phone.setValue(sanitizePhone(input.value), { emitEvent: false });
  }

  handleSubmit(): void {
    this.error = '';
    this.success = '';
    const formValue = this.bookingForm.value;
    const room = this.selectedRoom();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!room) {
      this.error = 'Please select a room type first.';
      return;
    }

    if (!formValue.checkInDate || !formValue.checkOutDate || !formValue.name || !formValue.email || !formValue.phone) {
      this.error = 'Please fill out check-in, check-out, name, email, and phone.';
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formValue.email)) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    const checkInDate = new Date(formValue.checkInDate);
    const checkOutDate = new Date(formValue.checkOutDate);
    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      this.error = 'Please select valid dates.';
      return;
    }

    if (checkInDate < today) {
      this.error = 'Please select a future check-in date.';
      return;
    }

    if (checkOutDate <= checkInDate) {
      this.error = 'Check-out must be after check-in.';
      return;
    }

    if (this.availability && !this.availability.available) {
      this.error = 'This room type is sold out for the selected dates.';
      return;
    }

    this.submitting = true;
    this.bookingService
      .createBooking({
        roomTypeId: room.id,
        checkInDate: formValue.checkInDate,
        checkOutDate: formValue.checkOutDate,
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
      })
      .pipe(
        tap((result) => {
          const roomNote = result?.roomNumber ? ` Room #${result.roomNumber} reserved.` : '';
          this.success = `Booking confirmed. We will reach out shortly.${roomNote}`;
          const selectedId = room?.id;
          const queryParams = selectedId ? { roomTypeId: selectedId } : undefined;
          this.router.navigate(['/booked'], { queryParams });
        }),
        catchError((err) => {
          this.error = err instanceof Error ? err.message : 'Failed to create booking.';
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  private setupAvailabilityWatcher(): void {
    const roomTypeId$ = toObservable(this.roomTypeId);
    const checkIn$ = this.bookingForm.controls.checkInDate.valueChanges.pipe(startWith(''));
    const checkOut$ = this.bookingForm.controls.checkOutDate.valueChanges.pipe(startWith(''));

    combineLatest([roomTypeId$, checkIn$, checkOut$])
      .pipe(
        debounceTime(120),
        tap(() => {
          this.availability = null;
          this.availabilityError = '';
        }),
        switchMap(([roomTypeId, checkInDate, checkOutDate]) => {
          if (!roomTypeId || !checkInDate || !checkOutDate) {
            this.checking = false;
            return EMPTY;
          }

          const checkIn = new Date(checkInDate);
          const checkOut = new Date(checkOutDate);

          if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
            this.availabilityError = 'Please select valid dates.';
            this.checking = false;
            return EMPTY;
          }

          if (checkOut <= checkIn) {
            this.availabilityError = 'Check-out must be after check-in.';
            this.checking = false;
            return EMPTY;
          }

          this.checking = true;
          return this.bookingService.checkAvailability({
            roomTypeId,
            checkInDate,
            checkOutDate,
          }).pipe(
            tap((availability) => {
              this.availability = availability;
              this.availabilityError = '';
            }),
            catchError((err) => {
              this.availability = null;
              this.availabilityError =
                err instanceof Error ? err.message : 'Failed to check availability.';
              return EMPTY;
            }),
            finalize(() => {
              this.checking = false;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  private parseRoomTypeId(raw: string | null): number | null {
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
