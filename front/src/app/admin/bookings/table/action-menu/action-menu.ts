import { Component, computed, ElementRef, HostListener, inject, input, output, ViewChild } from "@angular/core";
import { AdminBooking } from "../../../../shared/types";
import { AdminBookingsService } from "../../../../services/admin/admin-bookings-service";
import { NoticeService } from "../../../../shared/notice-service";

@Component({
  selector: "app-admin-action-menu",
  standalone: true,
  imports: [],
  templateUrl: "./action-menu.html",
  styleUrls: ["./action-menu.scss"],
  exportAs: "adminActionMenu",
})
export class AdminActionMenuComponent {
  private readonly bookingsService = inject(AdminBookingsService);
  private readonly noticeService = inject(NoticeService);

  booking = input.required<AdminBooking>();
  deleted = output<void>();
  confirmDeleteOpen = false;
  pendingDeleteId = computed(()=>{
    return this.booking().id;
  })
  private menuEl: HTMLDetailsElement | null = null;
  // ViewChild gives us the template element reference once available; cache the native element for fast access.
  @ViewChild("menu")
  set menuRef(value: ElementRef<HTMLDetailsElement> | undefined) {
    this.menuEl = value?.nativeElement ?? null;
  }
  isMenuOpen = computed(()=>{
    return this.menuEl?.open ?? false;
  })


  toDelete(bookingId: number): void {
    this.bookingsService.deleteBookings([bookingId]).subscribe({
      next: (result) => {
        this.noticeService.show(result.message);
        if (result.ok) {
          this.deleted.emit();
        }
      },
    });
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isMenuOpen) {
      return;
    }
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    if (this.menuEl && path.includes(this.menuEl)) {
      return;
    }
    this.closeMenu();
  }


  onDeleteClicked(): void {
    this.closeMenu()
    this.confirmDeleteOpen = true;
  }

  onConfirmDelete(): void {
    if (this.pendingDeleteId() !== null && this.pendingDeleteId() !== undefined) {
      this.toDelete(this.pendingDeleteId() as number);
    } else {
      this.noticeService.show("Id error: " + String(this.pendingDeleteId()) + "!");
    }
    this.confirmDeleteOpen = false;
  }

  onCancelDelete(): void {
    this.confirmDeleteOpen = false;
  }

  formatRoomLabel(roomTypeId?: number, roomNumber?: number): string {
    if (roomTypeId != null && roomNumber != null) {
      return `t${roomTypeId}-${roomNumber}`;
    }
    if (roomTypeId != null) {
      return `t${roomTypeId}-?`;
    }
    if (roomNumber != null) {
      return `t?-${roomNumber}`;
    }
    return "-";
  }

  private closeMenu(): void {
    if (this.menuEl) {
      this.menuEl.open = false;
    }
  }
}
