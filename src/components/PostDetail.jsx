import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Reply from "./Reply.jsx";
import ReplyForm from "./ReplyForm.jsx";

function PostDetail({ user }) {
  const { postId } = useParams();
  const [replies, setReplies] = useState([]);
  const [post, setPost] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [postError, setPostError] = useState("");
  const [replyError, setReplyError] = useState("");

  useEffect(() => {
    async function loadReplies() {
        const { data, error } = await supabase
          .from("replies")
          .select("*, profiles (username)")
          .eq("post_id", Number(postId))
          .order("created_at", { ascending: true });
        if(error) {
            console.log(error.message);
            setReplyError("返信の読み込みに失敗しました")
            return;
        }    
        setReplies(data);
    }
    loadReplies();
  }, [postId]);
  
  useEffect(() => {
    async function loadPost() {
        const { data, error } = await supabase
          .from("posts")
          .select("*, profiles (username), likes (user_id)")
          .eq("id", Number(postId))
          .single();
        if(error) {
            console.log(error.message);
            setPostError("投稿の読み込みに失敗しました")
            setIsLoadingPost(false);
            return;
        }
        setPost(data);
        setIsLoadingPost(false);
    }
    loadPost();
  }, [postId]);

  if(isLoadingPost) {
    return <p>読み込み中...</p>;
  }

  if(postError) {
    return <p>{postError}</p>
  }

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
      {replyError && (
        <p>{replyError}</p>
      )}
      {user && (
        <ReplyForm onSubmitReply={addReply} />
      )}
      {replies.length === 0 ? (
        <p>まだ返信はありません</p>
      ) : (
        replies.map((reply) => (
            <Reply
              key={reply.id}
              userId={reply.user_id}
              username={reply.profiles?.username}
              content={reply.content}
              createdAt={reply.created_at}
              canDelete={user && reply.user_id === user.id}
              onDelete={() => deleteReply(reply.id)}
            />
        ))
      )}
    </div>
  );
}

export default PostDetail;