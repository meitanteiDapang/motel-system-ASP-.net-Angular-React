const AdminPage = ({ onBack, onSwitch }) => {
  return (
    <div className="page bright admin-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="auth-shell">
        <div className="auth-card">
          <div>
            <p className="eyebrow">Admin console</p>
            <h2>Welcome, operator</h2>
            <p className="subtext">
              Dashboard wiring goes here. For now, you are signed in.
            </p>
          </div>
          <div className="admin-actions">
            <button className="book-btn" type="button" onClick={onBack}>
              Back to homepage
            </button>
            <button className="ghost-btn" type="button" onClick={onSwitch}>
              Switch account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
