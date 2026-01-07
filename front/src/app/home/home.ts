import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoomTypesService } from '../shared/roomTypesService';
import { TestProbeService } from '../shared/testProbeService';
import { RoomType } from '../shared/types';
import { HomeBookingTestPanelComponent } from './bookingTestPanel/bookingTestPanel';
import { HomeContactSectionComponent } from './contactSection/contactSection';
import { HomeHeroGridComponent } from './heroGrid/heroGrid';
import { HomeHighlightsSectionComponent } from './highlightsSection/highlightsSection';
import { HomeNavBarComponent } from './navBar/navBar';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    HomeNavBarComponent,
    HomeHeroGridComponent,
    HomeHighlightsSectionComponent,
    HomeContactSectionComponent,
    HomeBookingTestPanelComponent,
  ],
  templateUrl: './home.html',
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
