import { CommonModule } from "@angular/common";
import {
  Component,
  DestroyRef,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
} from "@angular/core";
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatNativeDateModule } from "@angular/material/core";
import { MatIconModule } from "@angular/material/icon";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import {
  combineLatest,
  debounceTime,
  EMPTY,
  finalize,
  startWith,
  switchMap,
  tap,
  catchError,
} from "rxjs";
import { BookingService } from "../../shared/booking-service";
import { Availability, RoomType } from "../../shared/types";
import { sanitizePhone, toIsoDate, isPhonePatternLegal } from "../booking-helpers";

const errorMessages = {
  nameRequired: "Please input your name.",
  emailRequired: "Please enter your email address.",
  emailInvalid: "Please enter a valid email address.",
  phoneRequired: "Please enter your phone number.",
  phoneInvalid: "Please enter a valid phone number.",
  checkInRequired: "Please select a check-in date.",
  checkInMinDate: "Check-in must be today or later.",
  checkOutRequired: "Please select a check-out date.",
  dateOrder: "Check-out must be after check-in.",
} as const;

@Component({
  selector: "app-booking-form",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: "./booking-form.html",
  styleUrls: ["./booking-form.scss"],
})
export class BookingFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly bookingService = inject(BookingService);
  private readonly destroyRef = inject(DestroyRef);

  roomType = input.required<RoomType | null>();
  private readonly roomId = computed(() => this.roomType()?.id ?? -1);

  @Output() readonly booked = new EventEmitter<{ roomTypeId: number }>();

  readonly bookingForm = this.fb.group(
    {
      checkInDate: this.fb.control<Date | null>(
        null,
        [Validators.required, BookingFormComponent.minDateValidator]
      ),
      checkOutDate: this.fb.control<Date | null>(null, Validators.required),
      name: this.fb.nonNullable.control("", Validators.required),
      email: this.fb.nonNullable.control("", [Validators.required, Validators.email]),
      phone: this.fb.nonNullable.control(
        "",
        [Validators.required, BookingFormComponent.phoneValidator]
      ),
    },
    { validators: BookingFormComponent.checkOutAfterCheckInValidator }
  );

  availability: Availability | null = null;
  availabilityError = "";
  checking = false;
  submitting = false;
  error = "";

  success = "";
  readonly today = BookingFormComponent.startOfDay(new Date());

  constructor() {
    this.setupAvailabilityWatcher();
  }

  get minCheckOutDate(): Date {
    const checkIn = this.bookingForm.controls.checkInDate.value;
    if (!checkIn) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return BookingFormComponent.startOfDay(tomorrow);
    }
    const parsed = BookingFormComponent.startOfDay(checkIn);
    parsed.setDate(parsed.getDate() + 1);
    return parsed;
  }

  get totalPrice() {
    const room = this.roomType();
    const formValue = this.bookingForm.getRawValue();
    if (!room || !formValue.checkInDate || !formValue.checkOutDate) {
      return { nights: 0, total: 0 };
    }
    const checkIn = BookingFormComponent.startOfDay(formValue.checkInDate);
    const checkOut = BookingFormComponent.startOfDay(formValue.checkOutDate);
    if (checkOut <= checkIn) {
      return { nights: 0, total: 0 };
    }
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights <= 0) return { nights: 0, total: 0 };
    return { nights, total: nights * room.price };
  }

  get isBookingFormFinished(): boolean {
    return this.availability?.available === true && this.bookingForm.valid;
  }

  get bookingButtonDisabled(): boolean {
    const formValue = this.bookingForm.getRawValue();
    return (
      this.submitting ||
      this.checking ||
      !formValue.checkInDate ||
      !formValue.checkOutDate ||
      this.availability?.available === false
    );
  }

  get checkInDateError(): string {
    const control = this.bookingForm.controls.checkInDate;
    if (!control.touched) return "";
    if (control.hasError("required")) return errorMessages.checkInRequired;
    if (control.hasError("minDate")) return errorMessages.checkInMinDate;
    return "";
  }

  get checkOutDateError(): string {
    const control = this.bookingForm.controls.checkOutDate;
    if (!control.touched) return "";
    if (control.hasError("required")) return errorMessages.checkOutRequired;
    return "";
  }

  get dateRangeError(): string {
    const checkInTouched = this.bookingForm.controls.checkInDate.touched;
    const checkOutTouched = this.bookingForm.controls.checkOutDate.touched;
    if (!(checkInTouched || checkOutTouched)) return "";
    return this.bookingForm.hasError("dateOrder")
      ? errorMessages.dateOrder
      : "";
  }

  get nameError(): string {
    const control = this.bookingForm.controls.name;
    if (!control.touched) return "";
    return control.hasError("required") ? errorMessages.nameRequired : "";
  }

  get emailError(): string {
    const control = this.bookingForm.controls.email;
    if (!control.touched) return "";
    if (control.hasError("required")) return errorMessages.emailRequired;
    if (control.hasError("email")) return errorMessages.emailInvalid;
    return "";
  }

  get phoneError(): string {
    const control = this.bookingForm.controls.phone;
    if (!control.touched) return "";
    if (control.hasError("required")) return errorMessages.phoneRequired;
    if (control.hasError("phone")) return errorMessages.phoneInvalid;
    return "";
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.bookingForm.controls.phone.setValue(sanitizePhone(input.value), {
      emitEvent: false,
    });
  }

  handleSubmit(): void {
    this.error = "";
    this.success = "";
    const formValue = this.bookingForm.getRawValue();
    const room = this.roomType();

    if (!room) {
      this.error = "Room type not determined.";
      return;
    }

    if (!this.isBookingFormFinished || !formValue.checkInDate || !formValue.checkOutDate) {
      this.bookingForm.markAllAsTouched();
      this.error = "Please check your booking detail";
      return;
    }


    this.submitting = true;
    this.bookingService
      .createBooking({
        roomTypeId: this.roomId(),
        checkInDate: toIsoDate(formValue.checkInDate),
        checkOutDate: toIsoDate(formValue.checkOutDate),
        name: formValue.name,
        email: formValue.email,
        phone: formValue.phone,
      })
      .pipe(
        tap((result) => {
          const roomNote = result?.roomNumber
            ? ` Room #${result.roomNumber} reserved.`
            : "";
          this.success = `Booking confirmed. We will reach out shortly.${roomNote}`;
          this.booked.emit({ roomTypeId: this.roomId() });
        }),
        catchError((err) => {
          this.error =
            err instanceof Error ? err.message : "Failed to create booking.";
          return EMPTY;
        }),
        finalize(() => {
          this.submitting = false;
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private setupAvailabilityWatcher(): void {
    const roomTypeId$ = toObservable(this.roomId);
    const checkIn$ = this.bookingForm.controls.checkInDate.valueChanges.pipe(
      startWith(null)
    );
    const checkOut$ = this.bookingForm.controls.checkOutDate.valueChanges.pipe(
      startWith(null)
    );

    combineLatest([roomTypeId$, checkIn$, checkOut$])
      .pipe(
        debounceTime(120),
        tap(() => {
          this.availability = null;
          this.availabilityError = "";
        }),
        switchMap(([roomTypeId, checkInDate, checkOutDate]) => {
          if (!roomTypeId || !checkInDate || !checkOutDate) {
            this.checking = false;
            return EMPTY;
          }

          const checkIn = BookingFormComponent.startOfDay(checkInDate);
          const checkOut = BookingFormComponent.startOfDay(checkOutDate);

          if (checkOut <= checkIn) {
            this.checking = false;
            return EMPTY;
          }

          this.checking = true;
          return this.bookingService
            .checkAvailability({
              roomTypeId,
              checkInDate: toIsoDate(checkIn),
              checkOutDate: toIsoDate(checkOut),
            })
            .pipe(
              tap((availability) => {
                this.availability = availability;
                this.availabilityError = "";
              }),
              catchError((err) => {
                this.availability = null;
                this.availabilityError =
                  err instanceof Error
                    ? err.message
                    : "Failed to check availability.";
                return EMPTY;
              }),
              finalize(() => {
                this.checking = false;
              })
            );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  private static minDateValidator(
    control: AbstractControl<Date | null>
  ): ValidationErrors | null {
    const raw = control.value;
    if (!raw) return null;
    const parsed = BookingFormComponent.startOfDay(raw);
    if (Number.isNaN(parsed.getTime())) return { minDate: true };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed < today ? { minDate: true } : null;
  }

  private static phoneValidator(
    control: AbstractControl<string | null>
  ): ValidationErrors | null {
    const raw = control.value?.trim();
    if (!raw) return null;
    return isPhonePatternLegal(raw) ? null : { phone: true };
  }

  private static checkOutAfterCheckInValidator(
    group: AbstractControl
  ): ValidationErrors | null {
    const form = group as FormGroup<{
      checkInDate: AbstractControl<Date | null>;
      checkOutDate: AbstractControl<Date | null>;
    }>;
    const checkInRaw = form.controls.checkInDate.value;
    const checkOutRaw = form.controls.checkOutDate.value;
    if (!checkInRaw || !checkOutRaw) return null;
    const checkIn = BookingFormComponent.startOfDay(checkInRaw);
    const checkOut = BookingFormComponent.startOfDay(checkOutRaw);
    return checkOut > checkIn ? null : { dateOrder: true };
  }

  private static startOfDay(raw: Date): Date {
    const parsed = new Date(raw);
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }
}
