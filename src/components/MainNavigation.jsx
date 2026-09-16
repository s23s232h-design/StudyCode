import { NavLink } from "react-router-dom";
import { House, Search, SquarePlus, Timer, User } from "lucide-react";

const navigationItems = [
  { to: "/", label: "ホーム", Icon: House },
  { to: "/search", label: "検索", Icon: Search },
  { to: "/postpage", label: "投稿", Icon: SquarePlus, requiresUser: true },
  { to: "/timer", label: "タイマー", Icon: Timer, requiresUser: true },
  { to: "/profile", label: "プロフィール", Icon: User, requiresUser: true }
];

function MainNavigation({ user }) {
  return (
    <nav className="main-navigation" aria-label="メインナビゲーション">
      {navigationItems
        .filter((item) => !item.requiresUser || user)
        .map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              isActive ? "main-nav-item active" : "main-nav-item"
            }
          >
            <Icon className="main-nav-icon" aria-hidden="true" />
            <span className="main-nav-label">{label}</span>
          </NavLink>
        ))}
    </nav>
  );
}

export default MainNavigation;
