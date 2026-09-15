import { Link, useNavigate } from "react-router-dom";
import RelativeTime from "../components/RelativeTime.jsx";

function Post({
  id, 
  userId,
  username,
  term,
  explanation, 
  likes, 
  createdAt,
  editedAt,
  likePost,
  deletePost,
  canEdit,
  isLiked,
  setPostToDelete,
  setPostToEdit
}) {
  const navigate = useNavigate();
  return (
    <div 
      className="post-card"
      onClick={() => navigate(`/posts/${id}`)}
    >
      <div className="post-header">
        <Link
          className="post-username"
          to={`/users/${userId}`}
          onClick={(event) => event.stopPropagation()}
        >
          {username}
        </Link>
        <div className="post-time">
          <RelativeTime createdAt={createdAt} />
          {editedAt && (
            <span className="edited-label">
              ・ 編集済み
            </span>
          )}
        </div>
      </div>
      
      <h2 className="post-term">「{term}」</h2>
      <p className="post-explanation">{explanation}</p>
      <div className="post-actions">
        <button
          className={isLiked ? "like-button liked" : "like-button"}
          onClick={(event) => {
            event.stopPropagation();
            likePost(id);
          }}
        >
          {isLiked ? "♥" : "♡"} {likes}
        </button>
        {deletePost && (
          <button
            className="delete-button"
            onClick={(event) => {
              event.stopPropagation();
              setPostToDelete({
                id: id,
                term: term
              });
            }}
          >
            削除
          </button>
        )}
        {canEdit && (
          <button
            className="edit-button"
            onClick={(event) => {
              event.stopPropagation();
              setPostToEdit({
                id,
                term,
                explanation
              })
            }}
          >
            編集
          </button>
        )}
      </div>
    </div>
  );
}

export default Post;
