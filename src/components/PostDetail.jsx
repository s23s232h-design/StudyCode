import { useParams } from "react-router-dom";

function PostDetail({ posts }) {
  const { postId } = useParams();

  const post = posts.find(
    (post) => String(post.id) === postId
  );

  if (!post) {
    return <p>投稿が見つかりません。</p>;
  }

  return (
    <div>
      <h2>{post.term}</h2>
      <p>{post.explanation}</p>
    </div>
  );
}

export default PostDetail;