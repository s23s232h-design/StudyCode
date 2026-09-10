import { createRoutesFromElements, Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Reply from "./Reply.jsx";
import ReplyForm from "./ReplyForm.jsx";

function PostDetail({ posts, user }) {
  const { postId } = useParams();
  const [replies, setReplies] = useState([]);
  useEffect(() => {
    async function loadReplies() {
        const { data, error } = await supabase
          .from("replies")
          .select("*, profiles (username)")
          .eq("post_id", Number(postId))
          .order("created_at", { ascending: true });
        if(error) {
            console.log(error.message);
            return;
        }    
        setReplies(data);
    }
    loadReplies();
  }, [postId]);

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
  async function addReply(content) {
    if(!user) {
        alert("返信するにはログインしてください");
        return;
    }
    const { data, error } = await supabase
      .from("replies")
      .insert({
        user_id: user.id,
        post_id: Number(postId),
        content: content
      })
      .select("*, profiles (username)")
      .single();
    if(error) {
        console.log(error.message);
        return;
    }
    setReplies((currentReplies) => [
        ...currentReplies,
        data
    ]);
  }
  async function deleteReply(replyId) {
    const { error } = await supabase
      .from("replies")
      .delete()
      .eq("id", replyId);
    if(error) {
        console.log(error.message);
        return;
    }
    setReplies((currentReplies) =>
      currentReplies.filter(
        (reply) => reply.id !== replyId
      )
    );
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
      <h3>返信</h3>
      {user && (
        <ReplyForm onSubmitReply={addReply} />
      )}
      {replies.length === 0 ? (
        <p>まだ返信はありません</p>
      ) : (
        replies.map((reply) => (
            <Reply
              key={reply.id}
              username={reply.profiles?.username}
              content={reply.content}
              canDelete={user && reply.user_id === user.id}
              onDelete={() => deleteReply(reply.id)}
            />
        ))
      )}
    </div>
  );
}

export default PostDetail;