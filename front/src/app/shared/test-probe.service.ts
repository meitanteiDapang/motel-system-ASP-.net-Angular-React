import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, EMPTY, tap } from 'rxjs';
import { ApiClientService } from './api-client.service';
import { TestProbeResponse } from './types';

interface TestProbeState {
  loading: boolean;
  data: TestProbeResponse | null;
  error: string | null;
}

@Injectable({ providedIn: 'root' })
export class TestProbeService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly state = signal<TestProbeState>({ loading: true, data: null, error: null });
  private started = false;

  readonly probeState = computed(() => this.state());

  run(): void {
    if (this.started) {
      return;
    }
    this.started = true;
    const params = new HttpParams().set('test_id', '123');
    const payload = { input: 5, timestamp: Date.now() };

    this.http
      .post<TestProbeResponse>(this.api.url('/test'), payload, { params })
      .pipe(
        tap((data) => this.state.set({ loading: false, data, error: null })),
        catchError((err) => {
          const message = err instanceof Error ? err.message : 'Failed to contact test endpoint.';
          this.state.set({ loading: false, data: null, error: message });
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
