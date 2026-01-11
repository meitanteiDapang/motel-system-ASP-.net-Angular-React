import { useCallback, useEffect, useRef, useState, JSX } from "react";
import { useGlobalContext } from "../../../context/globalContext";
import { apiUrl } from "../../../apiClient";
import type { AdminBooking } from "../AdminPage";
import AdminActionMenu from "./AdminActionMenu";
import NoticeToast from "../NoticeToast";
import "./bookingsTable.css";

// Present room identity even when one of the pieces is missing.
const formatRoomLabel = (roomTypeId?: number, roomNumber?: number) => {
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
};

const BookingsTable = () => {
  const { state } = useGlobalContext();
  const token = state.adminToken;
  const PAGE_SIZE = 20;
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showFutureOnly, setShowFutureOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const fromDateRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pageResetQueuedRef = useRef(false);
  const allSinceDate = "1970-01-01";

  const getNzToday = useCallback(() => {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Pacific/Auckland",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const pick = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    return `${pick("year")}-${pick("month")}-${pick("day")}`;
  }, []);

  const requestPageReset = useCallback(() => {
    if (page === 1 || pageResetQueuedRef.current) return false;
    pageResetQueuedRef.current = true;
    const defer =
      typeof queueMicrotask === "function"
        ? queueMicrotask
        : (cb: () => void) => Promise.resolve().then(cb);
    defer(() => {
      pageResetQueuedRef.current = false;
      setPage(1);
    });
    return true;
  }, [page]);

  const getFromDate = useCallback(
    () => (showFutureOnly ? getNzToday() : allSinceDate),
    [getNzToday, showFutureOnly, allSinceDate]
  );

  const normalizeBookingsPayload = (data: unknown) => {
    const payload = data as { bookings?: unknown; total?: unknown } | unknown[];
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray((payload as { bookings?: unknown }).bookings)
      ? (payload as { bookings: unknown[] }).bookings
      : [];
    const totalCount =
      !Array.isArray(payload) &&
      typeof (payload as { total?: unknown }).total === "number"
        ? Math.max(0, Math.floor((payload as { total: number }).total))
        : null;
    return { bookings: items as AdminBooking[], total: totalCount };
  };

  const fetchBookings = useCallback(
    async (
      tokenValue: string,
      fromDate: string,
      pageValue: number,
      signal: AbortSignal
    ) => {
      const params = new URLSearchParams({
        fromCheckOutDate: fromDate,
        page: pageValue.toString(),
        pageSize: PAGE_SIZE.toString(),
      });
      const res = await fetch(apiUrl(`/bookings?${params.toString()}`), {
        headers: {
          Authorization: `Bearer ${tokenValue}`,
        },
        signal,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const errorMessage =
          (data as { message?: string } | null)?.message ??
          `HTTP ${res.status}`;
        return {
          error: errorMessage,
          bookings: [] as AdminBooking[],
          total: null,
        };
      }
      const normalized = normalizeBookingsPayload(data);
      return { error: null as string | null, ...normalized };
    },
    [PAGE_SIZE]
  );

  // Load bookings when token, filter, or page changes.

  useEffect(() => {
    if (!token) {
      fromDateRef.current = null;
      tokenRef.current = null;
      requestPageReset();
      return;
    }

    let resetPage = false;
    if (tokenRef.current !== token) {
      tokenRef.current = token;
      resetPage = true;
    }

    const fromDate = getFromDate();
    if (fromDateRef.current !== fromDate) {
      fromDateRef.current = fromDate;
      resetPage = true;
    }

    if (resetPage && requestPageReset()) {
      return;
    }

    const controller = new AbortController();
    const load = async () => {
      try {
        const result = await fetchBookings(
          token,
          fromDate,
          page,
          controller.signal
        );
        if (controller.signal.aborted) return;
        if (result.error) {
          setLoadError(result.error);
          setBookings([]);
          return;
        }
        setBookings(result.bookings);
        setTotal(result.total);
        setLoadError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof Error && err.name === "AbortError") return;
        if (err instanceof Error) {
          setLoadError(err.message);
          setBookings([]);
          setTotal(null);
          return;
        }
        setLoadError("Unknown error");
        setBookings([]);
        setTotal(null);
      }
    };

    load();
    return () => {
      controller.abort();
    };
  }, [
    token,
    showFutureOnly,
    page,
    refreshCount,
    getFromDate,
    requestPageReset,
    fetchBookings,
  ]);

  if (!token) {
    return null;
  }

  const toggleLabel = showFutureOnly
    ? "Show all (check-out)"
    : "Show future (check-out)";
  const pageCount =
    total != null ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : null;
  const isNextDisabled =
    total != null ? page * PAGE_SIZE >= total : bookings.length < PAGE_SIZE;
  const bookingRows = bookings.map((booking, index) => (
    <tr key={booking.id ?? `${booking.guestEmail ?? "booking"}-${index}`}>
      <td>{booking.id ?? "-"}</td>
      <td>{formatRoomLabel(booking.roomTypeId, booking.roomNumber)}</td>
      <td>{booking.checkInDate ?? "-"}</td>
      <td>{booking.checkOutDate ?? "-"}</td>
      <td>{booking.guestName ?? "-"}</td>
      <td>{booking.guestEmail ?? "-"}</td>
      <td>{booking.guestPhone ?? "-"}</td>
      <td className="admin-action-cell">
        <AdminActionMenu
          booking={booking}
          token={token}
          onDeleted={() => {
            if (bookings.length === 1 && page > 1) {
              setPage((prev) => Math.max(1, prev - 1));
              return;
            }
            setRefreshCount((prev) => prev + 1);
          }}
          onNotify={(message) => setNotice(message)}
        />
      </td>
    </tr>
  ));

  let bookingsContent: JSX.Element | null;
  if (loadError) {
    bookingsContent = <p className="subtext">{loadError}</p>;
  } else if (bookings.length === 0) {
    bookingsContent = <p className="subtext">No bookings yet.</p>;
  } else {
    bookingsContent = (
      <table className="admin-bookings">
        <thead>
          <tr>
            <th>ID</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Check-out</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>{bookingRows}</tbody>
      </table>
    );
  }

  return (
    <>
      {notice ? <NoticeToast key={notice} message={notice} /> : null}
      <div className="admin-secondary-row">
        <button
          className="book-btn admin-flat-btn admin-toggle-btn"
          type="button"
          onClick={() => {
            setPage(1);
            setShowFutureOnly((prev) => !prev);
          }}
        >
          {toggleLabel}
        </button>
      </div>
      <div>{bookingsContent}</div>
      <div className="admin-pagination">
        <button
          className="book-btn admin-flat-btn"
          type="button"
          disabled={page === 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          Previous
        </button>
        <span className="admin-page-info">
          Page {page}
          {pageCount != null ? ` / ${pageCount}` : ""}
        </span>
        <button
          className="book-btn admin-flat-btn"
          type="button"
          disabled={isNextDisabled}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
};

export default BookingsTable;
