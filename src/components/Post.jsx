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
      <p>
        <Link
          to={`/users/${userId}`}
          onClick={(event) => event.stopPropagation()}
        >
          {username}
        </Link>
      </p>
      <RelativeTime createdAt={createdAt} />
      <h2>「{term}」</h2>
      <p>{explanation}</p>

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