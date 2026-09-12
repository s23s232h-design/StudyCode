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
        <RelativeTime createdAt={createdAt} />
      </div>
      
      <h2 className="post-term">「{term}」</h2>
      <p className="post-explanation">{explanation}</p>

      <button
        onClick={(event) => {
          event.stopPropagation();
          likePost(id);
        }}
      >
        {isLiked ? "♥" : "♡"} {likes}
      </button>
      {deletePost && (
        <button
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
  );
}

export default Post;