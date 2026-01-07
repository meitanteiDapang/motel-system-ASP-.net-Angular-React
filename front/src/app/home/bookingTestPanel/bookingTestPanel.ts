import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TestProbeResponse } from '../../shared/types';

interface TestProbeState {
  loading: boolean;
  data: TestProbeResponse | null;
  error: string | null;
}

@Component({
  selector: 'app-home-booking-test-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bookingTestPanel.html',
  styleUrls: ['../home.scss'],
})
export class HomeBookingTestPanelComponent {
  @Input({ required: true }) testProbeState!: () => TestProbeState;
}
