import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminAuthService } from '../admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['../admin-shared.scss'],
})
export class AdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AdminAuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly form = this.fb.group({
    username: ['admin'],
    password: ['ps^word'],
  });
  errorText = '';
  submitting = false;

  constructor() {
    this.auth
      .ensureValidToken()
      .pipe(takeUntilDestroyed())
      .subscribe((valid) => {
        if (valid) {
          this.router.navigate(['/admin']);
        }
      });
  }

  handleSubmit(): void {
    this.errorText = '';
    const { username, password } = this.form.value;
    if (!username || !password) {
      this.errorText = 'Please enter your credentials.';
      return;
    }

    this.submitting = true;
    this.auth
      .login(username, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        this.submitting = false;
        if (res.success && res.token) {
          this.router.navigate(['/admin'], { replaceUrl: true });
        } else {
          this.errorText = res.message ?? 'Unknown error';
        }
      });
  }

  handleBack(): void {
    this.router.navigate(['/']);
  }
}
