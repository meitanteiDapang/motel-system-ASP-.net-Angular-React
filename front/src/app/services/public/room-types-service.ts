import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, EMPTY, tap } from 'rxjs';
import { ApiClientService } from './api-client-service';
import { RoomType } from '../../shared/types';

interface RoomTypesState {
  loading: boolean;
  data: RoomType[];
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class RoomTypesService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly state = signal<RoomTypesState>({ loading: true, data: [], error: null });
  private loaded = false;

  readonly roomTypesState = computed(() => this.state());

  ensureLoaded(): void {
    if (this.loaded) {
      return;
    }
    this.loaded = true;
    this.fetchRoomTypes();
  }

  refresh(): void {
    this.fetchRoomTypes();
  }

  private fetchRoomTypes(): void {
    this.state.set({ loading: true, data: [], error: null });
    this.http
      .get<RoomType[]>(this.api.url('/room-types'))
      .pipe(
        tap((data) => this.state.set({ loading: false, data, error: null })),
        catchError((err) => {
          const message = err instanceof Error ? err.message : 'Failed to load room types.';
          this.state.set({ loading: false, data: [], error: message });
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
