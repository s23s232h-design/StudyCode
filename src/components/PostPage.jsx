import { useState } from "react";
import Post from "./Post.jsx";
import PostForm from "./PostForm";
import DeleteModal from "./DeleteModal.jsx";
import EditPostModal from "./EditPostModal.jsx";
import { supabase } from "../lib/supabaseClient.js";

function PostPage({ posts, setPosts, likePost, user, isPostsLoading, postsError }){
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
      .select("*, profiles (username), likes (user_id)")
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
      setPosts([data, ...posts]);
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
    const { error } = await supabase
      .from("posts")
      .delete()
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
    const newPosts = posts.filter((post) => {
      return post.id !== id;
    });
    setPosts(newPosts);
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
    (post) => post.user_id === user.id
  );
  const filteredPosts = myPosts.filter((post) => {
    if(searchTerm.trim() === "") {
      return true;
    }
    const keyword = searchTerm.trim().toLowerCase();
    const termMatches = post.term.toLowerCase().includes(keyword);
    const explanationMatches = post.explanation.toLowerCase().includes(keyword);
    if(searchTarget === "term") {
      return termMatches;
    }
    if(searchTarget === "explanation") {
      return explanationMatches;
    }
    return termMatches || explanationMatches;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if(sortType === "likes") {
      return b.likes.length - a.likes.length;
    }
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div>
        <h3>学んだことを投稿</h3>
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

        <input 
          type="text"
          placeholder="検索する言葉を入力"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />

        <select 
          value={sortType}
          onChange={(event) => setSortType(event.target.value)}
        >
        <option value="new">新着順</option>
        <option value="likes">いいね順</option>
        </select>
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
          用語または説明
        </label>

        {isPostsLoading ? (
          <p role="status">読み込み中...</p>
        ) : postsError ? (
          <p className="error" role="alert">{postsError}</p>
        ) : searchTerm.trim() !== "" && sortedPosts.length === 0 ? (
          <p>該当する投稿がありません</p>
        ) : (
          sortedPosts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              userId={post.user_id}
              username={post.profiles?.username || "ユーザー"}
              term={post.term}
              explanation={post.explanation}
              likes={post.likes?.length ?? 0}
              createdAt={post.created_at}
              likePost={likePost}
              deletePost={
                user && post.user_id === user.id
                  ? handleDeletePost
                  : undefined
              }
              canEdit={user && post.user_id === user.id}
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
