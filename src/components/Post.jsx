import { Link } from "react-router-dom";
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
  return (
    <div>
      <p>
        <Link to={`/users/${userId}`}>
          {username}
        </Link>
      </p>
      <RelativeTime createdAt={createdAt} />
      <h2>「{term}」</h2>
      <p>{explanation}</p>

      <button onClick={() => likePost(id)}>
        {isLiked ? "♥" : "♡"} {likes}
      </button>
      {deletePost && (
        <button
          onClick={() =>
            setPostToDelete({
              id: id,
              term: term
            })
          }
        >
          削除
        </button>
      )}
      {canEdit && (
        <button
          onClick={() => 
            setPostToEdit({
              id,
              term,
              explanation
            })
          }
        >
          編集
        </button>
      )}
    </div>
  );
}

export default Post;