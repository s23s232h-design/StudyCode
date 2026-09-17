import { Link, useNavigate } from "react-router-dom";
import RelativeTime from "../components/RelativeTime.jsx";
import QuotedPostCard from "./QuotedPostCard.jsx";
import Avatar from "./Avatar.jsx";

function Post({
  id, 
  userId,
  username,
  avatarUrl,
  term,
  explanation, 
  likes, 
  reposts,
  createdAt,
  editedAt,
  quotedPost,
  quotedPostId,
  quoteComment,
  onQuote,
  likePost,
  repostPost,
  deletePost,
  canEdit,
  isLiked,
  isReposted,
  setPostToDelete,
  setPostToEdit
}) {
  const navigate = useNavigate();
  const isQuotePost = quotedPostId != null || quotedPost != null;
  return (
    <div 
      className="post-card"
      onClick={() => navigate(`/posts/${id}`)}
    >
      <div className="post-header">
        <Link
          className="post-author post-username"
          to={`/users/${userId}`}
          onClick={(event) => event.stopPropagation()}
        >
          <Avatar avatarUrl={avatarUrl} username={username} size="small" />
          <span>{username}</span>
        </Link>
        <div className="post-time">
          <RelativeTime createdAt={createdAt} />
          {editedAt && (
            <span className="edited-label">
              ・編集済み
            </span>
          )}
        </div>
      </div>
      
      {isQuotePost ? (
        <>
          <p className="quote-comment">{quoteComment}</p>
          <QuotedPostCard quotedPost={quotedPost} />
        </>
      ) : (
        <>
          <h2 className="post-term">「{term}」</h2>
          <p className="post-explanation">{explanation}</p>
        </>
      )}
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
        <button
          className={
            isReposted
              ? "repost-button reposted"
              : "repost-button"
          }
          aria-pressed={isReposted}
          onClick={(event) => {
            event.stopPropagation();
            repostPost(id);
          }}
        >
          {isReposted ? "↻ リポスト済み" : "↻ リポスト"} {reposts}
        </button>
        <button
          className="quote-button"
          onClick={(event) => {
            event.stopPropagation();
            onQuote(id);
          }}
        >
          引用
        </button>
        {deletePost && (
          <button
            className="delete-button"
            onClick={(event) => {
              event.stopPropagation();
              setPostToDelete({
                id: id,
                term: isQuotePost ? quoteComment : term
              });
            }}
          >
            削除
          </button>
        )}
        {canEdit && !isQuotePost && (
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
