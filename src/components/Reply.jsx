import RelativeTime from "./RelativeTime.jsx";
import { Link } from "react-router-dom";

function Reply({
  userId,
  username,
  content,
  createdAt,
  canDelete,
  onDelete,
  deleteReplyError
}) {
  return (
    <div className="reply-card">
      <div className="reply-header">
        <Link className="post-username" to={`/users/${userId}`}>
          {username}
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
