import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RoomType } from '../../shared/types';

interface RoomTypesState {
  loading: boolean;
  data: RoomType[];
  error: string | null;
}

@Component({
  selector: 'app-home-highlights-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './highlightsSection.html',
  styleUrls: ['../home.scss'],
})
export class HomeHighlightsSectionComponent {
  @Input({ required: true }) roomTypesState!: () => RoomTypesState;
  @Output() book = new EventEmitter<RoomType['id']>();
}
