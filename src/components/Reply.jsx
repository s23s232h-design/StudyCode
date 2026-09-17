import RelativeTime from "./RelativeTime.jsx";
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";

function Reply({
  userId,
  username,
  avatarUrl,
  content,
  createdAt,
  canDelete,
  onDelete,
  deleteReplyError
}) {
  return (
    <div className="reply-card">
      <div className="reply-header">
        <Link className="post-author" to={`/users/${userId}`}>
          <Avatar avatarUrl={avatarUrl} username={username} size="small" />
        </Link>
        <div className="post-author-info">
          <Link className="post-username" to={`/users/${userId}`}>{username}</Link>
          <span className="post-time">
            <RelativeTime createdAt={createdAt} />
          </span>
        </div>
      </div>
      <p className="reply-content">{content}</p>
      {canDelete && (
        <button className="danger-button small-button" onClick={onDelete}>
          削除
        </button>
      )}
      {deleteReplyError && (
        <p className="error">{deleteReplyError}</p>
      )}
    </div>
  );
}

export default Reply;
