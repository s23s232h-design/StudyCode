import Post from "./Post";
function Home({ posts, likePost, repostPost, openQuoteModal, user, isPostsLoading, postsError }) {
    const timelineEvents = [];

    posts.forEach((post) => {
      if (post.deleted_at) {
        return;
      }
      timelineEvents.push({
        type: "post",
        eventTime: post.created_at,
        post
      });

      (post.reposts ?? []).forEach((repost) => {
        timelineEvents.push({
          type: "repost",
          eventTime: repost.created_at,
          post,
          repost
        });
      });
    });

    const sortedTimelineEvents = timelineEvents
      .sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime))
      .slice(0, 10);
    return (
        <div>
            <div className="page-header">
              <h2 className="page-title">みんなの学び</h2>
              <p className="page-description">日々の発見や学びを、みんなで共有しましょう。</p>
            </div>
            {!user && (
              <p className="page-description">
                投稿やいいねをするにはログインしてください
              </p>
            )}
            {isPostsLoading ? (
                <p role="status">読み込み中...</p>
            ) : postsError ? (
                <p className="error" role="alert">{postsError}</p>
            ) : sortedTimelineEvents.length === 0 ? (
                <p className="empty-state">まだ投稿がありません</p>
            ) : (
              sortedTimelineEvents.map((event) => {
                const { post } = event;
                const postCard = (
                  <Post
                    key={`post-${post.id}`}
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
                    isLiked={
                      user
                        ? post.likes?.some((like) => like.user_id === user.id) ?? false
                        : false
                    }
                  />
                );

                if (event.type === "repost") {
                  return (
                    <div
                      className="repost-event"
                      key={`repost-${post.id}-${event.repost.user_id}`}
                    >
                      <span className="repost-event-label">
                        ↻ {event.repost.profiles?.username || "ユーザー"}さんがリポストしました
                      </span>
                      {postCard}
                    </div>
                  );
                }

                return postCard;
              })
            )}
        </div>
    );
}

export default Home;
