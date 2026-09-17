import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Reply from "./Reply.jsx";
import ReplyForm from "./ReplyForm.jsx";
import QuotedPostCard from "./QuotedPostCard.jsx";
import Avatar from "./Avatar.jsx";

function PostDetail({ user, posts, repostPost, openQuoteModal }) {
  const { postId } = useParams();
  const [replies, setReplies] = useState([]);
  const [post, setPost] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [postError, setPostError] = useState("");
  const [replyError, setReplyError] = useState("");
  const [replyActionError, setReplyActionError] = useState(""); 
  const [deleteReplyError, setDeleteReplyError] = useState("");

  useEffect(() => {
    async function loadReplies() {
        const { data, error } = await supabase
          .from("replies")
          .select("*, profiles (username, avatar_url)")
          .eq("post_id", Number(postId))
          .order("created_at", { ascending: true });
        if(error) {
            console.log(error.message);
            setReplyError("返信の読み込みに失敗しました")
            return;
        }
        setReplyError("");    
        setReplies(data);
    }
    loadReplies();
  }, [postId]);
  
  useEffect(() => {
    let ignore = false;
    async function loadPost() {
      setIsLoadingPost(true);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(`
            *,
            profiles (username, avatar_url),
            likes (user_id),
            reposts (
              user_id,
              created_at,
              profiles (username, avatar_url)
            )
          `)
          .eq("id", Number(postId))
          .single();
        if(error) {
          throw error;
        }
        let quotedPost = null;
        if (data.quoted_post_id !== null && data.quoted_post_id !== undefined) {
          const { data: quotedPostData, error: quotedPostError } = await supabase
            .from("posts")
            .select(`
              id,
              user_id,
              term,
              explanation,
              quote_comment,
              quoted_post_id,
              created_at,
              deleted_at,
              profiles (username, avatar_url)
            `)
            .eq("id", data.quoted_post_id)
            .maybeSingle();
          if (quotedPostError) {
            throw quotedPostError;
          }
          quotedPost = quotedPostData ?? null;
        }
        if (!ignore) {
          setPostError("");
          setPost({ ...data, quoted_post: quotedPost });
        }
      } catch (error) {
        if (!ignore) {
          console.log(error.message);
          setPostError("投稿の読み込みに失敗しました");
        }
      } finally {
        if (!ignore) {
          setIsLoadingPost(false);
        }
      }
    }
    loadPost();
    return () => {
      ignore = true;
    };
  }, [postId]);

  useEffect(() => {
    const updatedPost = posts.find(
      (item) => item.id === Number(postId)
    );

    if (!updatedPost || post?.id !== updatedPost.id) {
      return;
    }

    // Mirror reposts and deleted quote sources into the detail record.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPost((currentPost) => {
      if (
        currentPost?.id !== updatedPost.id ||
        (
          currentPost.reposts === updatedPost.reposts &&
          currentPost.quoted_post === updatedPost.quoted_post &&
          currentPost.deleted_at === updatedPost.deleted_at
        )
      ) {
        return currentPost;
      }

      return {
        ...currentPost,
        reposts: updatedPost.reposts ?? [],
        quoted_post: updatedPost.quoted_post ?? null,
        deleted_at: updatedPost.deleted_at,
        ...(updatedPost.deleted_at
          ? { term: null, explanation: null, quote_comment: null }
          : {})
      };
    });
  }, [posts, postId, post?.id]);

  if(isLoadingPost) {
    return <p>読み込み中...</p>;
  }

  if(postError) {
    return <p>{postError}</p>
  }

  if (!post) {
    return <p className="empty-state">投稿が見つかりません。</p>;
  }

  if (post.deleted_at) {
    return <p className="empty-state">この投稿は削除されました</p>;
  }

  const isReposted =
    user
      ? post.reposts?.some(
          (repost) => repost.user_id === user.id
        ) ?? false
      : false;

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
      .select("*, profiles (username, avatar_url)")
      .single();
    if(error) {
        console.log(error.message);
        setReplyActionError("返信の投稿に失敗しました")
        return;
    }
    setReplyActionError("");
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
        setDeleteReplyError("返信の削除に失敗しました")
        return;
    }
    setDeleteReplyError("");
    setReplies((currentReplies) =>
      currentReplies.filter(
        (reply) => reply.id !== replyId
      )
    );
  }

  return (
    <div className="post-detail">
      <div className="post-detail-card">
        <div className="post-detail-header">
          <Link className="post-author" to={`/users/${post.user_id}`}>
            <Avatar
              avatarUrl={post.profiles?.avatar_url}
              username={post.profiles?.username}
              size="small"
            />
          </Link>
          <div className="post-author-info">
            <Link className="post-username" to={`/users/${post.user_id}`}>
              {post.profiles?.username}
            </Link>
          <span className="post-time">
            {formatDateTime(post.created_at)}
            {post.edited_at && (
              <span className="edited-label">
                ・編集済み
              </span>
            )}
          </span>
          </div>
        </div>
        {post.quoted_post_id != null || post.quoted_post != null ? (
          <>
            <p className="quote-comment">{post.quote_comment}</p>
            <QuotedPostCard quotedPost={post.quoted_post} />
          </>
        ) : (
          <>
            <h2 className="post-term">「{post.term}」</h2>
            <p className="post-explanation">{post.explanation}</p>
          </>
        )}
        <div className="post-detail-actions">
          <span>♡ {post.likes?.length ?? 0}</span>
          <button
            className={
              isReposted
                ? "repost-button reposted"
                : "repost-button"
            }
            aria-pressed={isReposted}
            onClick={() => repostPost(post.id)}
          >
            {isReposted ? "↻ リポスト済み" : "↻ リポスト"}
            {" "}
            {post.reposts?.length ?? 0}
          </button>
          <button
            className="quote-button"
            onClick={() => openQuoteModal(post.id)}
          >
            引用
          </button>
        </div>
      </div>
      <section className="reply-section">
        <h3>返信</h3>
        {replyError && (
          <p className="error">{replyError}</p>
        )}
        {user && (
          <ReplyForm onSubmitReply={addReply} />
        )}
        {replyActionError && (
          <p className="error">{replyActionError}</p>
        )}
        <div className="reply-list">
          {replyError ? null : (
            replies.length === 0 ? (
              <p className="empty-state">まだ返信はありません</p>
            ) : (
              replies.map((reply) => (
                <Reply
                  key={reply.id}
                  userId={reply.user_id}
                  username={reply.profiles?.username}
                  avatarUrl={reply.profiles?.avatar_url}
                  content={reply.content}
                  createdAt={reply.created_at}
                  canDelete={user && reply.user_id === user.id}
                  onDelete={() => deleteReply(reply.id)}
                  deleteReplyError={deleteReplyError}
                />
              ))
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default PostDetail;
