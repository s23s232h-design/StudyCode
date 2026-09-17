import RelativeTime from "./RelativeTime.jsx";
import Avatar from "./Avatar.jsx";

function QuotedPostCard({ quotedPost }) {
  if (!quotedPost) {
    return null;
  }

  return (
    <div
      className="quoted-post-card"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="quoted-post-header">
        <div className="post-author quoted-post-username">
          <Avatar
            avatarUrl={quotedPost.profiles?.avatar_url}
            username={quotedPost.profiles?.username}
            size="small"
          />
          <span>{quotedPost.profiles?.username || "ユーザー"}</span>
        </div>
        <span className="quoted-post-time">
          <RelativeTime createdAt={quotedPost.created_at} />
        </span>
      </div>
      {quotedPost.deleted_at ? (
        <p className="quoted-post-deleted">この投稿は削除されました</p>
      ) : quotedPost.quoted_post_id != null ? (
        <p className="quote-comment">{quotedPost.quote_comment}</p>
      ) : (
        <>
          <h3 className="quoted-post-term">「{quotedPost.term}」</h3>
          <p className="quoted-post-explanation">{quotedPost.explanation}</p>
        </>
      )}
    </div>
  );
}

export default QuotedPostCard;
