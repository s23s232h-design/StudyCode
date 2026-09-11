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
    <div>
      <p>
        <Link to={`/users/${userId}`}>
          {username}
        </Link>
      </p>
      <RelativeTime createdAt={createdAt} />
      <p>{content}</p>
      {canDelete && (
        <button onClick={onDelete}>
          削除
        </button>
      )}
      {deleteReplyError && (
        <p>{deleteReplyError}</p>
      )}
    </div>
  );
}

export default Reply;