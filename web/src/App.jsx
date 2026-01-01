import { useEffect, useState } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import BookingPage from "./booking/BookingPage.jsx";
import BookingSuccessPage from "./booking/BookingSuccessPage.jsx";
import AdminLogin from "./admin/AdminLogin.jsx";
import AdminPage from "./admin/AdminPage.jsx";
import "./App.css";
import { apiUrl } from "./apiClient.js";

function App() {
  const [roomTypes, setRoomTypes] = useState({
    loading: true,
    data: [],
    error: null,
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [testProbe, setTestProbe] = useState({
    loading: true,
    data: null,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    const fetchRoomTypes = async () => {
      try {
        const res = await fetch(apiUrl("/room-types"), {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setRoomTypes({ loading: false, data, error: null });
      } catch (err) {
        if (err.name === "AbortError") return;
        setRoomTypes({ loading: false, data: [], error: err });
      }
    };

    fetchRoomTypes();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const fetchTest = async () => {
      try {
        const url = new URL(apiUrl("/test"), window.location.origin);
        url.searchParams.set("test_id", 123);

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setTestProbe({ loading: false, data, error: null });
      } catch (err) {
        if (err.name === "AbortError") return;
        setTestProbe({ loading: false, data: null, error: err });
      }
    };

    fetchTest();
    return () => controller.abort();
  }, []);

  const heroImage =
    roomTypes.data[2]?.imageUrl || roomTypes.data[0]?.imageUrl || "";
  const roomTypeId = Number(searchParams.get("roomTypeId"));
  const selectedRoom =
    Number.isFinite(roomTypeId) && roomTypeId
      ? roomTypes.data.find((room) => room.id === roomTypeId)
      : null;

  const handleBook = (roomTypeId) => {
    navigate(`/book?roomTypeId=${roomTypeId}`);
  };

  const handleAdminEntry = (event) => {
    event.preventDefault();
    navigate("/login");
  };

  const handleLoginSubmit = (event) => {
    event.preventDefault();
    navigate("/admin");
  };

  return (
    <Routes>
      <Route
        path="/book"
        element={
          <BookingPage
            roomType={selectedRoom}
            loading={roomTypes.loading}
            error={roomTypes.error}
            onBack={() => {
              navigate("/");
            }}
            onSuccess={() => {
              const selectedId = selectedRoom?.id
                ? `roomTypeId=${selectedRoom.id}`
                : "";
              const suffix = selectedId ? `?${selectedId}` : "";
              navigate(`/booked${suffix}`);
            }}
          />
        }
      />
      <Route
        path="/booked"
        element={
          <BookingSuccessPage
            roomType={selectedRoom}
            onBack={() => {
              navigate("/");
            }}
          />
        }
      />
      <Route
        path="/login"
        element={
          <AdminLogin
            onSubmit={handleLoginSubmit}
            onBack={() => {
              navigate("/");
            }}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <AdminPage
            onBack={() => {
              navigate("/");
            }}
            onSwitch={() => {
              navigate("/login");
            }}
          />
        }
      />
      <Route
        path="/"
        element={
          <div className="page bright">
            <div className="glow glow-one" />
            <div className="glow glow-two" />

            <header className="hero hero-bright">
              <div className="nav">
                <div className="logo">Dapang motel</div>
                <div className="nav-actions">
                  <span className="pill loud">
                    Dapang is a cat. The motel is his.
                  </span>
                  <span className="pill">Check-in 24/7 · Ocean breeze</span>
                  <button
                    className="admin-link"
                    type="button"
                    onClick={handleAdminEntry}
                  >
                    Admin entry
                  </button>
                </div>
              </div>

              <div className="booking-test">
                <div className="test-card">
                  <div>
                    <p className="eyebrow">API probe</p>
                    <h2>Live test ping</h2>
                    <p className="subtext">
                      We call the backend test endpoint and surface its reply.
                    </p>
                  </div>
                  <div className="test-result">
                    {testProbe.loading && (
                      <span className="pill">Contacting API...</span>
                    )}
                    {testProbe.error && (
                      <span className="pill error-pill">
                        Failed: {testProbe.error.message ?? "Unknown error"}
                      </span>
                    )}
                    {testProbe.data && !testProbe.error && (
                      <div className="pill success-pill">
                        <div>{testProbe.data.message}</div>
                        {testProbe.data.timestamp && (
                          <div className="pill-subtext">
                            {new Date(
                              testProbe.data.timestamp
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="hero-grid">
                <div className="hero-copy">
                  <p className="eyebrow">
                    Boutique cat motel · Auckland shoreline
                  </p>
                  <h1>
                    A louder, brighter, cozier stay—curated by{" "}
                    <span>Dapang</span>, resident king of naps and neon.
                  </h1>
                  <p className="lede">
                    Think pastel mornings, citrus sunsets, chrome accents, and a
                    cat who owns the lobby. Rooms glow, vinyl hums, and the
                    concierge knows where Dapang hides the best sunbeams.
                  </p>
                  <div className="meta meta-bright">
                    <div>
                      <strong>4.9</strong> Guest rating
                    </div>
                    <div>
                      <strong>12</strong> Suites blessed by Dapang
                    </div>
                    <div>
                      <strong>08</strong> Steps to sunrise walk
                    </div>
                  </div>
                </div>

                <div className="hero-card hero-card-bright">
                  <div className="card-top">
                    <div className="chip loud">Sunrise candy</div>
                    <div className="chip dark">Dapang-approved</div>
                  </div>
                  <div className="hero-visual hero-visual-bright">
                    <div className="hero-frame bright-frame">
                      <div className="frame-inner">
                        {heroImage ? (
                          <img
                            src={heroImage}
                            alt="Featured room"
                            className="frame-img"
                          />
                        ) : (
                          <div className="frame-img frame-fallback">
                            Loading room...
                          </div>
                        )}
                        <div className="frame-overlay">
                          <div className="frame-text">After-dark patrols</div>
                          <div className="frame-stats">
                            <span>Neon lamps</span>
                            <span>Ocean hush</span>
                            <span>Soft paws</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="hero-caption">
                      Chrome, candy glass, and cat-approved corners.
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <section className="section highlights">
              <div className="section-header">
                <p className="eyebrow">Dapang manifesto</p>
                <h2>Book your stay now!</h2>
              </div>
              {roomTypes.loading && (
                <p className="subtext">Loading room types...</p>
              )}
              {roomTypes.error && (
                <p className="subtext error-text">
                  Failed to load room types: {roomTypes.error.message}
                </p>
              )}
              {!roomTypes.loading && !roomTypes.error && (
                <div className="grid three">
                  {roomTypes.data.slice(0, 4).map((room) => (
                    <div className="highlight-card bright-card" key={room.id}>
                      <div className="img-wrap">
                        <img src={room.imageUrl} alt={room.typeName} />
                      </div>
                      <h3>{room.typeName}</h3>
                      <p>
                        {room.bedNumber} beds · ${room.price}
                      </p>
                      <div className="card-actions">
                        <button
                          className="book-btn"
                          type="button"
                          onClick={() => handleBook(room.id)}
                        >
                          Book
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="section contact contact-bright">
              <div className="contact-card">
                <div>
                  <p className="eyebrow">Location</p>
                  <h2>Dapang motel · 711 Dapang Road, Dapang City</h2>
                </div>
                <div className="contact-meta">
                  <div>
                    <p className="label">Phone</p>
                    <p className="value">+64 20 424 5777</p>
                  </div>
                  <div>
                    <p className="label">Email</p>
                    <p className="value">dapang@dapangmotel.com</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
