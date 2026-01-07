import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoomTypesService } from '../shared/room-types.service';
import { TestProbeService } from '../shared/test-probe.service';
import { RoomType } from '../shared/types';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
})
export class HomePageComponent {
  private readonly router = inject(Router);
  private readonly roomTypesService = inject(RoomTypesService);
  private readonly testProbeService = inject(TestProbeService);

  readonly roomTypesState = this.roomTypesService.roomTypesState;
  readonly testProbeState = this.testProbeService.probeState;

  constructor() {
    this.roomTypesService.ensureLoaded();
    this.testProbeService.run();
  }

  readonly heroImage = computed(() => {
    const rooms = this.roomTypesState().data;
    return rooms[2]?.imageUrl || rooms[0]?.imageUrl || '';
  });

  handleBook(roomTypeId: RoomType['id']): void {
    this.router.navigate(['/book'], { queryParams: { roomTypeId } });
  }

  handleAdminEntry(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/adminLogin']);
  }
}
