import { User } from "lucide-react";

function Avatar({ avatarUrl, username, size = "medium" }) {
  const label = `${username || "ユーザー"}のプロフィール画像`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        className={`avatar avatar-${size}`}
      />
    );
  }

  return (
    <div
      className={`avatar avatar-${size} avatar-placeholder`}
      role="img"
      aria-label={label}
    >
      <User aria-hidden="true" />
    </div>
  );
}

export default Avatar;
