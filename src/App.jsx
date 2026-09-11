import { Routes, Route, NavLink } from "react-router-dom";
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

function App() {
  const [posts, setPosts] = useState([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");

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
        const { data, error } = await supabase
          .from("posts")
          .select("*, profiles (username), likes (user_id)")
          .order("created_at", {ascending: false});
        if(error) {
          throw error;
        }
        if (!ignore) {
          setPosts(data ?? []);
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
    async function loadUsername() {
      if(!user) {
        setUsername("");
        setUserNameError("");
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();
      if(error) {
        console.log(error.message);
        setUsernameError("ユーザー情報の読み込みに失敗しました");
        return;
      }
      setUsernameError("");
      setUsername(data?.username ?? "");
    }
    loadUsername();
  }, [user]);
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
    if(!post) {
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
      const newPosts = posts.map((post) => {
        if(post.id === postId) {
          return {
            ...post,
            likes: post.likes.filter((like) => {
              return like.user_id !== user.id;
            })
          };
        }
        return post;
      });
      setPosts(newPosts);
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
        const newPosts = posts.map((post) => {
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
        });
      setPosts(newPosts);
    }
  }
  if(isAuthLoading) {
    return <p role="status">読み込み中...</p>
  }
  
  return (
    <div>
      <h2>StudyCode</h2>
      {authError && (
        <p className="error" role="alert">
          {authError}
        </p>
      )}
      <p>みんなの学びを見てみよう！</p>
      {/*NavLinkのto=で指定したURLへ移動する:*/}      
      <nav>
        <NavLink
          to="/"
          className={({isActive}) => isActive ? "active" : ""}
        >
          ホーム
        </NavLink>
        <NavLink
          to="/search"
          className={({isActive}) => isActive ? "active" : ""} 
        >
          検索
        </NavLink>
        {user && (
          <>    
            <NavLink
              to="/postpage"
              className={({isActive}) => isActive ? "active" : ""}
            >
              投稿
            </NavLink>
            <NavLink
              to="/timer"
              className={({isActive}) => isActive ? "active" : ""}
            >
              タイマー
            </NavLink>
            <NavLink
              to="/profile"
              className={({isActive}) => isActive ? "active" : ""}
            >
              プロフィール
            </NavLink>
          </>
        )}
        {user ? (
          <>
            <span>ログイン中：{username || user.email}</span>
            {usernameError && (
              <p className={"error"} role="alert">
                {usernameError}
              </p>
            )}
            <button onClick={signOut}>
              ログアウト
            </button>
          </>
        ) : (
          <NavLink
            to="/login"
            className={({isActive}) => isActive ? "active" : ""}
          >
            ログイン
          </NavLink>
        )}
      </nav>
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
              user={user}
             />
          }
        />
        <Route
          path="/posts/:postId"
          element={
            <PostDetail
              user={user}
             />
          } 
        />
      </Routes>
    </div>
  )
}
export default App;
