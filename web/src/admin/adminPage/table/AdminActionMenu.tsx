import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminBooking } from "../AdminPage";
import { apiUrl } from "../../../apiClient";

type AdminActionMenuProps = {
  booking: AdminBooking;
  token: string | null;
  onDeleted: () => void;
  onNotify: (message: string) => void;
};

const AdminActionMenu = ({
  booking,
  token,
  onDeleted,
  onNotify,
}: AdminActionMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDisabled = useMemo(()=> isDeleting, [isDeleting]);

  useEffect(() => {
    if (!isOpen) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const toggleMenu = () => {
    if (isDisabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleDelete = () => {
    setIsOpen(false);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    setConfirmOpen(false);
    deleteBooking();
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const deleteBooking = async () => {
    if (!token) {
      onNotify("Missing admin token.");
      return;
    }
    if (!booking.id) {
      onNotify("Missing booking id.");
      return;
    }
    setIsDeleting(true);
    try {
      const params = new URLSearchParams();
      params.append("bookingIds", booking.id.toString());
      const res = await fetch(apiUrl(`/bookings?${params.toString()}`), {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        onNotify("Delete successfully.");
        onDeleted();
      } else {
        const data = await res.json().catch(() => null);
        const message =
          (data as { message?: string } | null)?.message ??
          `HTTP ${res.status}`;
        onNotify(`Delete failed: ${message}`);
      }
    } catch (err) {
      if (err instanceof Error) {
        onNotify(err.message);
      } else {
        onNotify("Unknown error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`admin-action-menu${isOpen ? " is-open" : ""}`}
      ref={containerRef}
    >
      <button
        className="admin-action-trigger"
        type="button"
        onClick={toggleMenu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        disabled={isDisabled}
      >
      </button>
      {isOpen ? (
        <div className="admin-action-dropdown" role="menu">
          <button
            className="admin-action-item"
            type="button"
            onClick={handleDelete}
            disabled={isDisabled || !booking.id}
            role="menuitem"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : null}
      {confirmOpen ? (
        <div className="admin-confirm-overlay" role="presentation">
          <div className="admin-confirm-dialog" role="dialog" aria-modal="true">
            <h3>Delete booking?</h3>
            <p>
              This will remove booking {booking.id ?? "-"} for{" "}
              {booking.guestName ?? "guest"}.
            </p>
            <div className="admin-confirm-actions">
              <button
                className="book-btn admin-flat-btn"
                type="button"
                onClick={handleCancel}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="book-btn admin-flat-btn admin-danger-btn"
                type="button"
                onClick={handleConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminActionMenu;
