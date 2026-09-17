import { useState } from "react";
import Post from "./Post.jsx";
import PostForm from "./PostForm";
import DeleteModal from "./DeleteModal.jsx";
import EditPostModal from "./EditPostModal.jsx";
import { supabase } from "../lib/supabaseClient.js";
import { handleFormArrowNavigation } from "../utils/formKeyboardNavigation.js";

function PostPage({ posts, setPosts, likePost, repostPost, openQuoteModal, user, isPostsLoading, postsError }){
  const [term, setTerm] = useState("");
  const [explanation, setExplanation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortType, setSortType] = useState("new");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [postToEdit, setPostToEdit] = useState(null);
  const [searchTarget, setSearchTarget] = useState("both");

  async function addPost(event) {
    event.preventDefault();
    if(term.trim() === "" || explanation.trim() === "") {
      return;
    }
    const { data: { user }, } = await supabase.auth.getUser();
    if(!user) {
      return;
    }
    setIsPosting(true);
    const { data, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        term: term,
        explanation: explanation
      })
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
      .single();
      if(error) {
        setMessage("投稿に失敗しました。もう一度お試しください。")
        setMessageType("error");
        setIsPosting(false);
        setTimeout(() => {
        setMessage("");
      }, 3000);
        return;
      }
      const newPost = {
        ...data,
        quoted_post: null
      };
      setPosts((currentPosts) => [newPost, ...currentPosts]);
      setTerm("");
      setExplanation("");
      setMessage("投稿しました");
      setMessageType("success");
      setIsPosting(false);
      setTimeout(() => {
        setMessage("");
      }, 3000);
  }

  async function handleDeletePost(id) {
    setIsDeleting(true);
    const deletedAt = new Date().toISOString();
    const { error } = await supabase
      .from("posts")
      .update({
        term: null,
        explanation: null,
        quote_comment: null,
        deleted_at: deletedAt
      })
      .eq("id", id);
    if(error) {
      setIsDeleting(false);
      setMessage("投稿の削除に失敗しました");
      setMessageType("error");
      setTimeout(() => {
        setMessage("");
      }, 3000);
      return;
    }
    setPosts((currentPosts) => currentPosts.map((post) => {
      let updatedPost = post;
      if (post.id === id) {
        updatedPost = {
          ...updatedPost,
          term: null,
          explanation: null,
          quote_comment: null,
          deleted_at: deletedAt
        };
      }
      if (post.quoted_post?.id === id) {
        updatedPost = {
          ...updatedPost,
          quoted_post: {
            ...post.quoted_post,
            term: null,
            explanation: null,
            quote_comment: null,
            deleted_at: deletedAt
          }
        };
      }
      return updatedPost;
    }));
    setPostToDelete(null);
    setIsDeleting(false);
    setMessage("投稿を削除しました");
    setMessageType("success");
    setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  if(!user) {
    return (
      <div>
        <h3>投稿</h3>
        <p>投稿するにはログインしてください</p>
      </div>
    );
  }
  const myPosts = posts.filter(
    (post) => post.user_id === user.id && !post.deleted_at
  );
  const filteredPosts = myPosts.filter((post) => {
    if(searchTerm.trim() === "") {
      return true;
    }
    const keyword = searchTerm.trim().toLowerCase();
    const termText = post.term ?? "";
    const explanationText = post.explanation ?? "";
    const quoteCommentText = post.quote_comment ?? "";
    const termMatches = termText.toLowerCase().includes(keyword);
    const explanationMatches = explanationText.toLowerCase().includes(keyword);
    const quoteCommentMatches = quoteCommentText.toLowerCase().includes(keyword);
    if(searchTarget === "term") {
      return termMatches;
    }
    if(searchTarget === "explanation") {
      return explanationMatches;
    }
    return termMatches || explanationMatches || quoteCommentMatches;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if(sortType === "likes") {
      return b.likes.length - a.likes.length;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div>
        <section className="page-section">
          <div className="page-header">
            <h2 className="page-title">投稿を作成</h2>
            <p className="page-description">今日学んだことを、自分の言葉で残しましょう。</p>
          </div>
          <div className="section-card">
        <PostForm
          term={term}
          setTerm={setTerm}
          explanation={explanation}
          setExplanation={setExplanation}
          addPost={addPost}
          message={message}
          messageType={messageType}
          isPosting={isPosting}
        />
          </div>
        </section>
        <section className="page-section">
          <div className="page-header">
            <h2 className="page-title">自分の投稿</h2>
            <p className="page-description">これまでの学びを振り返りましょう。</p>
          </div>
        <div className="search-controls" onKeyDown={handleFormArrowNavigation}>
          <label className="form-label search-input-label" htmlFor="my-post-keyword">キーワード</label>
          <input
            id="my-post-keyword"
            className="form-input"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="検索する言葉を入力"
          />
          <div className="search-filter">
            <span className="form-label">検索対象</span>
            <div className="radio-group" role="group" aria-label="検索対象">
              <label>
                <input
                  type="radio"
                  name="searchTarget"
                  value="term"
                  checked={searchTarget === "term"}
                  onChange={(event) => setSearchTarget(event.target.value)}
                />
                用語
              </label>
              <label>
                <input
                  type="radio"
                  name="searchTarget"
                  value="explanation"
                  checked={searchTarget === "explanation"}
                  onChange={(event) => setSearchTarget(event.target.value)}
                />
                説明
              </label>
              <label>
                <input
                  type="radio"
                  name="searchTarget"
                  value="both"
                  checked={searchTarget === "both"}
                  onChange={(event) => setSearchTarget(event.target.value)}
                />
                用語・説明・コメント
              </label>
            </div>
          </div>
          <div className="search-filter">
            <label className="form-label" htmlFor="my-post-sort">並び順</label>
            <select
              id="my-post-sort"
              className="form-select"
              value={sortType}
              onChange={(event) => setSortType(event.target.value)}
            >
              <option value="new">新着順</option>
              <option value="likes">いいね順</option>
            </select>
          </div>
        </div>

        {!isPostsLoading && !postsError && searchTerm.trim() === "" && sortedPosts.length === 0 && (
          <p className="empty-state">まだ投稿がありません</p>
        )}
        {isPostsLoading ? (
          <p role="status">読み込み中...</p>
        ) : postsError ? (
          <p className="error" role="alert">{postsError}</p>
        ) : searchTerm.trim() !== "" && sortedPosts.length === 0 ? (
          <p className="empty-state">該当する投稿がありません</p>
        ) : (
          sortedPosts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              userId={post.user_id}
              username={post.profiles?.username || "ユーザー"}
              avatarUrl={post.profiles?.avatar_url}
              term={post.term}
              explanation={post.explanation}
              likes={post.likes?.length ?? 0}
              reposts={post.reposts?.length ?? 0}
              createdAt={post.created_at}
              editedAt={post.edited_at}
              quotedPost={post.quoted_post}
              quotedPostId={post.quoted_post_id}
              quoteComment={post.quote_comment}
              onQuote={openQuoteModal}
              likePost={likePost}
              repostPost={repostPost}
              isReposted={
                user
                  ? post.reposts?.some(
                      (repost) => repost.user_id === user.id
                    ) ?? false
                  : false
              }
              deletePost={
                user && post.user_id === user.id
                  ? handleDeletePost
                  : undefined
              }
              canEdit={user && post.user_id === user.id && post.quoted_post_id == null}
              isLiked={
                user
                ? post.likes?.some((like) => like.user_id === user.id) ?? false
                : false
              }
              setPostToDelete={setPostToDelete}
              setPostToEdit={setPostToEdit}
            />
          ))
        )}
        </section>
        {postToDelete !== null && (
          <DeleteModal
            postToDelete={postToDelete}
            isDeleting={isDeleting}
            onConfirm={() => handleDeletePost(postToDelete.id)}
            onClose={() => setPostToDelete(null)}
          />
        )}
        {postToEdit !== null && (
          <EditPostModal
            postToEdit={postToEdit}
            setPostToEdit={setPostToEdit}
            setPosts={setPosts} />
        )}
    </div>
  );
}

export default PostPage;
