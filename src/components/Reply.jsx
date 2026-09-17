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
        <Link className="post-author post-username" to={`/users/${userId}`}>
          <Avatar avatarUrl={avatarUrl} username={username} size="small" />
          <span>{username}</span>
        </Link>
        <span className="post-time">
          <RelativeTime createdAt={createdAt} />
        </span>
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
