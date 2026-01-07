import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly apiBase = this.resolveBaseUrl();

  url(path: string): string {
    const normalised = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBase}${normalised}`;
  }

  private resolveBaseUrl(): string {
    const defaultBase =
      typeof window !== 'undefined' && window.location.origin.includes('localhost')
        ? 'http://localhost:8080'
        : 'https://api.dapang.live';

    const globalBase = (globalThis as { NG_APP_API_BASE_URL?: string }).NG_APP_API_BASE_URL;
    const rawBase = globalBase && globalBase.trim().length > 0 ? globalBase : defaultBase;
    return rawBase.replace(/\/$/, '');
  }
}
