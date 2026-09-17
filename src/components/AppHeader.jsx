import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";

function AppHeader({ user, username, avatarUrl, usernameError, signOut }) {
  const displayName = username || user?.email;

  return (
    <header className="app-header">
      <Link className="app-header-brand" to="/">StudyCode</Link>
      <div className="account-area">
        {user ? (
          <>
            <div className="account-user" title={displayName}>
              <Avatar avatarUrl={avatarUrl} username={displayName} size="small" />
              <span className="account-name">{displayName}</span>
            </div>
            <button className="secondary-button" type="button" onClick={signOut}>
              ログアウト
            </button>
            {usernameError && (
              <p className="error" role="alert">{usernameError}</p>
            )}
          </>
        ) : (
          <Link className="secondary-button" to="/login">ログイン</Link>
        )}
      </div>
    </header>
  );
}

export default AppHeader;
