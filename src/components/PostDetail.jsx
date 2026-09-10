import { Link, useParams } from "react-router-dom";

function PostDetail({ posts }) {
  const { postId } = useParams();

  const post = posts.find(
    (post) => String(post.id) === postId
  );

  if (!post) {
    return <p>投稿が見つかりません。</p>;
  }
  function formatDateTime(createdAt) {
    const date = new Date(createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes} ${year}/${month}/${day}`;
  }

  return (
    <div>
      <p>
        <Link to={`/users/${post.user_id}`}>
          {post.profiles?.username}
        </Link>
      </p>
      <p>{formatDateTime(post.created_at)}</p>
      <h2>「{post.term}」</h2>
      <p>{post.explanation}</p>
      <p>♡ {post.likes?.length ?? 0}</p>
    </div>
  );
}

export default PostDetail;