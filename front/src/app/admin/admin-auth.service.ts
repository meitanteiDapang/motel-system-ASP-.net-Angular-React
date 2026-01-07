import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, map, of, tap } from 'rxjs';
import { ApiClientService } from '../shared/api-client.service';

export interface AdminLoginResult {
  success: boolean;
  token?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly api = inject(ApiClientService);
  private readonly tokenSignal = signal<string | null>(this.restoreToken());
  private validatedToken: string | null = null;

  readonly token = computed(() => this.tokenSignal());

  login(username: string, password: string) {
    const params = new HttpParams().set('username', username).set('password', password);
    return this.http
      .post<{ token?: string; message?: string }>(this.api.url('/adminLogin'), null, { params })
      .pipe(
        map((res) => {
          if (!res || typeof res !== 'object' || !res.token) {
            return { success: false, message: 'Unknown error, please try again!' } satisfies AdminLoginResult;
          }
          this.setToken(res.token);
          return { success: true, token: res.token } satisfies AdminLoginResult;
        }),
        catchError((error: HttpErrorResponse) => {
          const message =
            (error.error as { message?: string } | null)?.message ||
            error.message ||
            'Admin login failed, please try again.';
          return of({ success: false, message } satisfies AdminLoginResult);
        }),
      );
  }

  logout(): void {
    this.tokenSignal.set(null);
    this.validatedToken = null;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('adminToken');
    }
  }

  ensureValidToken() {
    const token = this.tokenSignal();
    if (!token) {
      return of(false);
    }
    if (this.validatedToken === token) {
      return of(true);
    }
    return this.checkToken(token).pipe(
      tap((valid) => {
        if (valid) {
          this.validatedToken = token;
        } else {
          this.logout();
        }
      }),
      catchError(() => {
        this.logout();
        return of(false);
      }),
    );
  }

  authHeaders(): HttpHeaders | null {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  private checkToken(token: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http
      .get(this.api.url('/admin/checkAdminToken'), { headers, observe: 'response' })
      .pipe(map(() => true));
  }

  private setToken(token: string) {
    this.tokenSignal.set(token);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('adminToken', token);
    }
  }

  private restoreToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const stored = window.localStorage.getItem('adminToken');
    return stored || null;
  }
}
