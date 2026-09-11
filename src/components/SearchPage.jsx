import { useState } from "react";
import Post from "../components/Post.jsx";

function SearchPage({ posts, user, likePost, isPostsLoading, postsError }) {
  const [searchWord, setSearchWord] = useState("");
  const [searchTarget, setSearchTarget] = useState("both");
  const [sortType, setSortType] = useState("new");
  const filteredPosts = posts.filter((post) => {
    if(searchWord.trim() === "") {
        return false;
    }
    const keyword = searchWord.trim().toLowerCase();
    const termMatches =
      post.term.toLowerCase().includes(keyword);
    const explanationMatches =
      post.explanation.toLowerCase().includes(keyword);
    if (searchTarget === "term") {
      return termMatches;
    }
    if (searchTarget === "explanation") {
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
      <h2>投稿検索</h2>
      <input
        type="text"
        value={searchWord}
        onChange={(event) =>
          setSearchWord(event.target.value)
        }
        placeholder="検索する言葉を入力"
      />
      <select 
        value={sortType}
        onChange={(event) => setSortType(event.target.value)}
      >
        <option value="new">新着順</option>
        <option value="likes">いいね順</option>
      </select>
      <div>
        <label>
          <input
            type="radio"
            name="searchTarget"
            value="term"
            checked={searchTarget === "term"}
            onChange={(event) =>
              setSearchTarget(event.target.value)
            }
          />
          用語
        </label>
        <label>
          <input
            type="radio"
            name="searchTarget"
            value="explanation"
            checked={searchTarget === "explanation"}
            onChange={(event) =>
              setSearchTarget(event.target.value)
            }
          />
          説明
        </label>
        <label>
          <input
            type="radio"
            name="searchTarget"
            value="both"
            checked={searchTarget === "both"}
            onChange={(event) =>
              setSearchTarget(event.target.value)
            }
          />
          用語または説明
        </label>
      </div>
      <div>
        {isPostsLoading ? (
            <p role="status">読み込み中...</p>
        ) : postsError ? (
            <p className="error" role="alert">{postsError}</p>
        ) : searchWord.trim() !== "" && filteredPosts.length === 0 ? (
            <p>該当する投稿がありません</p>
        ) : (
          sortedPosts.map((post) => (
            <Post
              key={post.id}
              id={post.id}
              userId={post.user_id}
              username={post.profiles?.username}
              term={post.term}
              explanation={post.explanation}
              likes={post.likes?.length ?? 0}
              createdAt={post.created_at}
              likePost={likePost}
              isLiked={
                user
                  ? post.likes?.some(
                      (like) => like.user_id === user.id
                    )
                  : false
              }
            />
          ))
        )}
      </div>
    </div>
  )
}
export default SearchPage;
