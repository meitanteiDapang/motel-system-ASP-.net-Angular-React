import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminAuthService } from '../admin-auth.service';
import { BookingsTableComponent } from '../bookings/table/table';
import { BookingsTimelineComponent } from '../bookings/timeline/timeline';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, BookingsTableComponent, BookingsTimelineComponent],
  templateUrl: './page.html',
  styleUrls: ['../admin-shared.scss', './page.scss'],
})
export class AdminPageComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);

  readonly activeTab = signal<'table' | 'timeline'>('table');

  constructor() {
    this.auth
      .ensureValidToken()
      .pipe(takeUntilDestroyed())
      .subscribe((valid) => {
        if (!valid) {
          this.router.navigate(['/adminLogin']);
        }
      });
  }

  get token(): string | null {
    return this.auth.token();
  }

  setActiveTab(tab: 'table' | 'timeline'): void {
    this.activeTab.set(tab);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
