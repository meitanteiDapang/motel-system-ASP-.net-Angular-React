import type { JSX, MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomTypes } from "../hooks/useRoomTypes";
import { useTestProbe } from "../hooks/useTestProbe";
import type { RoomType } from "../types";
import "./home.css";

const HomePage = () => {
  const navigate = useNavigate();
  const roomTypes = useRoomTypes();
  const testProbe = useTestProbe();

  const heroImage =
    roomTypes.data[2]?.imageUrl || roomTypes.data[0]?.imageUrl || "";

  const handleBook = (roomTypeId: RoomType["id"]) => {
    navigate(`/book?roomTypeId=${roomTypeId}`);
  };

  const handleAdminEntry = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    navigate("/adminLogin");
  };

  const heroMedia = heroImage ? (
    <img
      src={heroImage}
      alt="Featured room"
      className="frame-img"
    />
  ) : (
    <div className="frame-img frame-fallback">Loading room...</div>
  );

  const roomCards = roomTypes.data.slice(0, 4).map((room) => (
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
  ));

  let roomSectionContent: JSX.Element | null = null;
  if (roomTypes.loading) {
    roomSectionContent = <p className="subtext">Loading room types...</p>;
  } else if (roomTypes.error) {
    roomSectionContent = (
      <p className="subtext error-text">
        Failed to load room types: {roomTypes.error.message}
      </p>
    );
  } else {
    roomSectionContent = <div className="grid three">{roomCards}</div>;
  }

  const testProbeResult = (() => {
    if (testProbe.loading) {
      return <span className="pill">Contacting API...</span>;
    }
    if (testProbe.error) {
      return (
        <span className="pill error-pill">
          Failed: {testProbe.error.message ?? "Unknown error"}
        </span>
      );
    }
    if (testProbe.data && !testProbe.error) {
      const timestampNode = testProbe.data.timestamp ? (
        <div className="pill-subtext">
          {new Date(testProbe.data.timestamp).toLocaleString()}
        </div>
      ) : null;
      return (
        <div className="pill success-pill">
          <div>{testProbe.data.message}</div>
          {timestampNode}
        </div>
      );
    }
    return null;
  })();

  return (
    <div className="page bright">
      <div className="glow glow-one" />
      <div className="glow glow-two" />

      <header className="hero hero-bright">
        <div className="nav">
          <div className="logo">Dapang motel</div>
          <div className="nav-actions">
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

        <div className="hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">Boutique cat motel</p>
            <h1>
              A happy hotel created by <span>Dapang</span>,
              resident king of naps and neon.
            </h1>
            <p className="lede">
              Enjoy a warm, comfortable stay with friendly service and cozy
              rooms. Relax, recharge, and feel at home during your visit.
            </p>
            <div className="meta meta-bright">
              <div>
                <strong>9.9</strong> Guest rating
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
            <div className="frame-inner">
              {heroMedia}
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
        </div>
      </header>

      <section className="section highlights">
        <div className="section-header">
          <p className="eyebrow">Dapang manifesto</p>
          <h2>Book your stay now!</h2>
        </div>
        {roomSectionContent}
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
              <p className="value">+64 11 111 1111</p>
            </div>
            <div>
              <p className="label">Email</p>
              <p className="value">dapang@dapangmotel.com</p>
            </div>
          </div>
        </div>
      </section>

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
            {testProbeResult}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
