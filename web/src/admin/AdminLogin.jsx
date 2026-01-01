const AdminLogin = ({ onSubmit, onBack }) => {
  return (
    <div className="page bright admin-page">
      <div className="glow glow-one" />
      <div className="glow glow-two" />
      <div className="auth-shell">
        <div className="auth-card">
          <div>
            <p className="eyebrow">Admin access</p>
            <h2>Sign in to manage Dapang motel</h2>
            <p className="subtext">
              Enter your credentials to reach the admin console.
            </p>
          </div>
          <form className="auth-form" onSubmit={onSubmit}>
            <label className="field">
              Username
              <input type="text" name="username" autoComplete="username" />
            </label>
            <label className="field">
              Password
              <input
                type="password"
                name="password"
                autoComplete="current-password"
              />
            </label>
            <button className="book-btn primary" type="submit">
              Enter admin
            </button>
            <button className="ghost-btn" type="button" onClick={onBack}>
              Back to homepage
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
