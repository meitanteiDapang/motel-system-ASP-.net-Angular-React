import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoomTypesService } from '../../shared/roomTypesService';
import { RoomType } from '../../shared/types';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success.html',
  styleUrls: ['../booking.scss'],
})
export class BookingSuccessComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly roomTypesService = inject(RoomTypesService);

  readonly roomTypeId = signal<number | null>(this.parseRoomTypeId(this.route.snapshot.queryParamMap.get('roomTypeId')));
  readonly roomTypesState = this.roomTypesService.roomTypesState;
  readonly selectedRoom = computed<RoomType | null>(() => {
    const id = this.roomTypeId();
    if (id == null) return null;
    return this.roomTypesState().data.find((room) => room.id === id) ?? null;
  });

  constructor() {
    this.roomTypesService.ensureLoaded();
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.roomTypeId.set(this.parseRoomTypeId(params.get('roomTypeId')));
    });
  }

  get confirmationCopy(): string {
    const room = this.selectedRoom();
    return room
      ? `${room.typeName} is booked. We will reach out with the final details.`
      : 'We will reach out with the final details.';
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }

  private parseRoomTypeId(raw: string | null): number | null {
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
