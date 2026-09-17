import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient.js";
import StudyTimer from "./components/StudyTimer.jsx";
import Profile from "./components/Profile.jsx";
import PostPage from "./components/PostPage.jsx";
import Home from "./components/Home.jsx";
import Login from "./components/Login.jsx";
import UserProfile from "./components/UserProfile.jsx";
import SearchPage from "./components/SearchPage.jsx";
import PostDetail from "./components/PostDetail.jsx";
import QuotePostModal from "./components/QuotePostModal.jsx";
import AppHeader from "./components/AppHeader.jsx";
import MainNavigation from "./components/MainNavigation.jsx";

function App() {
  const [posts, setPosts] = useState([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [postToQuote, setPostToQuote] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function getUser() {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();
      if(ignore) {
        return;
      }
      if(error) {
        console.log(error.message);
        setAuthError("ログイン情報の読み込みに失敗しました")
        setIsAuthLoading(false);
        return;
      }
      setUser(user);
      setAuthError("");
      setIsAuthLoading(false); 
    }
    getUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setAuthError("");
      setIsAuthLoading(false);
    });
    return () => {
      ignore = true;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let ignore = false;
    async function loadPosts() {
      setIsPostsLoading(true);
      try {
        const { data: postsData, error: postsError } = await supabase
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
          .order("created_at", {ascending: false});
        if(postsError) {
          throw postsError;
        }
        const quotedPostIds = [...new Set(
          (postsData ?? [])
            .map((post) => post.quoted_post_id)
            .filter((id) => id !== null && id !== undefined)
        )];
        let quotedPosts = [];
        if (quotedPostIds.length > 0) {
          const { data: quotedPostsData, error: quotedPostsError } = await supabase
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
            .in("id", quotedPostIds);
          if (quotedPostsError) {
            throw quotedPostsError;
          }
          quotedPosts = quotedPostsData ?? [];
        }
        const quotedPostMap = new Map(
          quotedPosts.map((quotedPost) => [quotedPost.id, quotedPost])
        );
        const postsWithQuotedPosts = (postsData ?? []).map((post) => ({
          ...post,
          quoted_post: quotedPostMap.get(post.quoted_post_id) ?? null
        }));
        if (!ignore) {
          setPosts(postsWithQuotedPosts);
          setPostsError("");
        }
      } catch (error) {
        if (!ignore) {
          console.log(error.message);
          setPostsError("投稿の読み込みに失敗しました");
        }
      } finally {
        if (!ignore) {
          setIsPostsLoading(false);
        }
      }
    }
    loadPosts();
    return () => {
      ignore = true;
    };
  }, []);
  useEffect(() => {
    let ignore = false;
    async function loadUsername() {
      if(!user) {
        setUsername("");
        setAvatarUrl("");
        setUsernameError("");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (ignore) {
        return;
      }
      if(error) {
        console.log(error.message);
        setUsernameError("ユーザー情報の読み込みに失敗しました");
        return;
      }
      setUsernameError("");
      setUsername(data?.username ?? "");
      setAvatarUrl(data?.avatar_url ?? "");
    }
    loadUsername();
    return () => {
      ignore = true;
    };
  }, [user]);
  function updateCurrentUserProfile({ userId, username, avatarUrl }) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => {
        let updatedPost = post;

        if (post.user_id === userId) {
          updatedPost = {
            ...updatedPost,
            profiles: {
              ...(updatedPost.profiles ?? {}),
              username,
              avatar_url: avatarUrl
            }
          };
        }

        if (updatedPost.quoted_post?.user_id === userId) {
          updatedPost = {
            ...updatedPost,
            quoted_post: {
              ...updatedPost.quoted_post,
              profiles: {
                ...(updatedPost.quoted_post.profiles ?? {}),
                username,
                avatar_url: avatarUrl
              }
            }
          };
        }

        if (updatedPost.reposts?.some((repost) => repost.user_id === userId)) {
          updatedPost = {
            ...updatedPost,
            reposts: updatedPost.reposts.map((repost) => {
              if (repost.user_id !== userId) {
                return repost;
              }
              return {
                ...repost,
                profiles: {
                  ...(repost.profiles ?? {}),
                  username,
                  avatar_url: avatarUrl
                }
              };
            })
          };
        }

        return updatedPost;
      })
    );
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    //↑成功したらerrorはnull、失敗したらmessage等の情報をもつerrorが返ってくる
    if(error) {
      console.log(error.message);
    } 
  }
  async function likePost(postId) {
    if(!user) {
      alert("いいねするにはログインしてください");
      return;
    }
    const post = posts.find((post) => {
      return post.id === postId;
    });
    if(!post || post.deleted_at) {
      return;
    }
    const alreadyLiked = post.likes?.some((like) => {
      return like.user_id === user.id;
    });
    if(alreadyLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      if(error) {
        console.log(error.message);
        return;
      }
      setPosts((currentPosts) => currentPosts.map((post) => {
        if(post.id === postId) {
          return {
            ...post,
            likes: post.likes.filter((like) => {
              return like.user_id !== user.id;
            })
          };
        }
        return post;
      }));
    } else {
      const { data, error } = await supabase
        .from("likes")
        .insert({
          user_id: user.id,
          post_id: postId
        })
        .select("user_id")
        .single();
        if(error) {
          console.log(error.message);
          return;
        }
        setPosts((currentPosts) => currentPosts.map((post) => {
          if(post.id === postId) {
            return {
              ...post,
              likes: [
                ...(post.likes ?? []),
                //...[]で、配列の中身だけをとりだしてる
                data
              ]
            };
          }
          return post;
        }));
    }
  }
  async function repostPost(postId) {
    if(!user) {
      alert("リポストするにはログインしてください");
      return;
    }
    const post = posts.find((post) => {
      return post.id === postId;
    });
    if(!post || post.deleted_at) {
      return;
    }
    const alreadyReposted = post.reposts?.some((repost) => {
      return repost.user_id === user.id;
    });
    if(alreadyReposted) {
      const { error } = await supabase
        .from("reposts")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      if(error) {
        console.log(error.message);
        return;
      }
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if(post.id === postId) {
            return {
              ...post,
              reposts: (post.reposts ?? []).filter((repost) => {
                return repost.user_id !== user.id;
              })
            };
          }
          return post;
        })
      );
    } else {
      const { data, error } = await supabase
        .from("reposts")
        .insert({
          user_id: user.id,
          post_id: postId
        })
        .select("user_id, created_at, profiles (username, avatar_url)")
        .single();
      if(error) {
        console.log(error.message);
        return;
      }
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if(post.id === postId) {
            return {
              ...post,
              reposts: [
                ...(post.reposts ?? []),
                data
              ]
            };
          }
          return post;
        })
      );
    }
  }
  function openQuoteModal(postId) {
    if (!user) {
      alert("引用するにはログインしてください");
      return;
    }
    const targetPost = posts.find((post) => post.id === postId);
    if (!targetPost || targetPost.deleted_at) {
      return;
    }
    setPostToQuote(targetPost);
  }

  if(isAuthLoading) {
    return <p role="status">読み込み中...</p>
  }
  
  return (
    <div>
      <AppHeader
        user={user}
        username={username}
        avatarUrl={avatarUrl}
        usernameError={usernameError}
        signOut={signOut}
      />
      {authError && (
        <p className="error" role="alert">
          {authError}
        </p>
      )}
      <MainNavigation user={user} />
      {/*現在のURLがpath=""に変わったら、element={}のコンポーネントを表示*/}
      <Routes>
        <Route
          path="/"
          element={
            <Home
              posts={posts}
              isPostsLoading={isPostsLoading}
              postsError={postsError}
              likePost={likePost}
              repostPost={repostPost}
              openQuoteModal={openQuoteModal}
              user={user}
            />
          }
        />
        <Route
          path="/search"
          element={
            <SearchPage
              posts={posts}
              isPostsLoading={isPostsLoading}
              postsError={postsError}
              user={user}
              likePost={likePost}
              repostPost={repostPost}
              openQuoteModal={openQuoteModal}
            />
          } 
        />
        <Route
          path="/postpage"
          element={
            <PostPage
              posts={posts}
              isPostsLoading={isPostsLoading}
              postsError={postsError}
              setPosts={setPosts}
              likePost={likePost}
              repostPost={repostPost}
              openQuoteModal={openQuoteModal}
              user={user}
            />
          }
        />
        <Route
          path="/timer"
          element={<StudyTimer user={user}/>}
        />
        <Route 
          path="/profile"
          element={
            <Profile 
              user={user}
              setAppUsername={setUsername}
              setAppAvatarUrl={setAvatarUrl}
              updateAppProfile={updateCurrentUserProfile}
            />
          }
        />
        <Route 
          path="/login"
          element={<Login />}
        />
        <Route
          path="/users/:userId"
          element={
            <UserProfile
              posts={posts}
              isPostsLoading={isPostsLoading}
              postsError={postsError}
              likePost={likePost}
              repostPost={repostPost}
              openQuoteModal={openQuoteModal}
              user={user}
             />
          }
        />
        <Route
          path="/posts/:postId"
          element={
            <PostDetail
              user={user}
              posts={posts}
              repostPost={repostPost}
              openQuoteModal={openQuoteModal}
             />
          } 
        />
      </Routes>
      {postToQuote && (
        <QuotePostModal
          quotedPost={posts.find((post) => post.id === postToQuote.id) ?? postToQuote}
          user={user}
          setPosts={setPosts}
          onClose={() => setPostToQuote(null)}
        />
      )}
    </div>
  )
}
export default App;
