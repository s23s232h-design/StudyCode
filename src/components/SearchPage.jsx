import { useState } from "react";
import Post from "../components/Post.jsx";
import { handleFormArrowNavigation } from "../utils/formKeyboardNavigation.js";

function SearchPage({ posts, user, likePost, repostPost, openQuoteModal, isPostsLoading, postsError }) {
  const [searchWord, setSearchWord] = useState("");
  const [searchTarget, setSearchTarget] = useState("both");
  const [sortType, setSortType] = useState("new");
  const filteredPosts = posts.filter((post) => {
    if(post.deleted_at || searchWord.trim() === "") {
        return false;
    }
    const keyword = searchWord.trim().toLowerCase();
    const termText = post.term ?? "";
    const explanationText = post.explanation ?? "";
    const quoteCommentText = post.quote_comment ?? "";
    const termMatches =
      termText.toLowerCase().includes(keyword);
    const explanationMatches =
      explanationText.toLowerCase().includes(keyword);
    const quoteCommentMatches =
      quoteCommentText.toLowerCase().includes(keyword);
    if (searchTarget === "term") {
      return termMatches;
    }
    if (searchTarget === "explanation") {
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
    <div className="search-controls" onKeyDown={handleFormArrowNavigation}>
      <h2>投稿検索</h2>
      <input
        className="form-input"
        type="text"
        value={searchWord}
        onChange={(event) =>
          setSearchWord(event.target.value)
        }
        placeholder="🔍検索"
      />
      <select 
        className="form-select"
        value={sortType}
        onChange={(event) => setSortType(event.target.value)}
      >
        <option value="new">新着順</option>
        <option value="likes">いいね順</option>
      </select>
      <div className="radio-group">
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
          用語・説明・コメント
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
