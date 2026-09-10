import Post from "./Post";
function Home({ posts, likePost, user}) {
    const timelinePosts = [...posts]
      .sort((a, b) => b.id - a.id)
      .slice(0, 10);
    return (
        <div>
            <h3>ホーム</h3>
            <p>StudyCodeへようこそ！</p>
            <h3>タイムライン</h3>
            {!user && (
              <p>
                投稿やいいねをするにはログインしてください
              </p>
            )}
            {timelinePosts.length === 0 ? (
                <p>まだ投稿がありません</p>
            ) : (
              timelinePosts.map((post) => (
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
                  isLiked={
                    user
                      ? post.likes?.some((like) => like.user_id === user.id) ?? false
                      : false
                  }
                />
              ))
            )}
        </div>
    );
}

export default Home;