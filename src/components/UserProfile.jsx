import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Post from "./Post";
import Avatar from "./Avatar.jsx";

function UserProfile( { posts, likePost, repostPost, openQuoteModal, user, isPostsLoading, postsError }) {
    const { userId } = useParams();
    const [username, setUsername] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [introduction, setIntroduction] = useState("");
    const userPosts = posts.filter((post) => {
        return post.user_id === userId && !post.deleted_at;
    });
    const [materials, setMaterials] = useState([]);
    const [portfolios, setPortfolios] = useState([]);
    const [totalStudySeconds, setTotalStudySeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let ignore = false;
        async function loadUserProfile() {
            setIsLoading(true);
            try {
              const { data, error } = await supabase
                .from("profiles")
                .select("username, introduction, avatar_url")
                .eq("id", userId)
                .maybeSingle();
              if(error) {
                throw error;
              }
              const {data: materialData, error: materialError} = await supabase
                .from("materials")
                .select("id, name")
                .eq("user_id", userId);
              if (materialError) {
                throw materialError;
              }
              const { data: portfolioData, error: portfolioError } = await supabase
                .from("portfolios")
                .select("id, title, url")
                .eq("user_id", userId);
              if (portfolioError) {
                throw portfolioError;
              }
              const { data: studyTimeData, error: studyTimeError } = await supabase
                .from("study_times")
                .select("seconds")
                .eq("user_id", userId);
              if (studyTimeError) {
                throw studyTimeError;
              }
              if (ignore) {
                return;
              }
              setUsername(data?.username ?? "");
              setAvatarUrl(data?.avatar_url ?? "");
              setIntroduction(data?.introduction ?? "");
              setMaterials(materialData ?? []);
              setPortfolios(portfolioData ?? []);
              const total = (studyTimeData ?? []).reduce((sum, record) => {
                return sum + record.seconds;
              }, 0);
              setTotalStudySeconds(total);
              setErrorMessage("");
            } catch (error) {
              if (!ignore) {
                console.log(error.message);
                setErrorMessage("プロフィールの読み込みに失敗しました");
              }
            } finally {
              if (!ignore) {
                setIsLoading(false);
              }
            }
        }
        loadUserProfile();
        return () => {
          ignore = true;
        };
    }, [userId]);
    const totalHours = Math.floor(totalStudySeconds / 3600);
    const totalMinutes = Math.floor(
      (totalStudySeconds % 3600) / 60
    );
    return(
        <div>
          <div className="page-header"><h2 className="page-title">ユーザープロフィール</h2></div>
          {isLoading ? (
            <p role="status">読み込み中...</p>
          ) : errorMessage ? (
            <p className="error" role="alert">{errorMessage}</p>
          ) : (
            <div className="profile-view">
              <div className="profile-overview">
              <Avatar avatarUrl={avatarUrl} username={username} size="large" />
              <div>
                <h3 className="profile-name">{username || "未設定"}</h3>
                <p className="profile-value">{introduction || "未設定"}</p>
              </div>
              </div>
              <div className="profile-section">
                <h3 className="profile-label">累計学習時間</h3>
                <p className="profile-value">
                {totalHours}時間{totalMinutes}分
              </p>
              </div>
              <div className="profile-section">
              <h3 className="profile-label">使用している教材</h3>
              {materials.length === 0 ? (
                <p className="empty-state">登録されている教材はありません</p>
              ) : (
                <ul className="profile-list">
                  {materials.map((material) => (
                    <li key={material.id}>
                      {material.name}
                    </li>
                  ))}
                </ul>
              )}
              </div>
              <div className="profile-section">
              <h3 className="profile-label">ポートフォリオ</h3>
              {portfolios.length === 0 ? (
                <p className="empty-state">登録されているポートフォリオはありません</p>
              ) : (
                <ul className="profile-list">
                  {portfolios.map((portfolio) => (
                    <li key={portfolio.id}>
                      {portfolio.title} :{" "}
                      <a
                        href={portfolio.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {portfolio.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </div>
          )}
          <section className="page-section">
          <div className="page-header"><h2 className="page-title">投稿</h2></div>
          {isPostsLoading ? (
            <p role="status">読み込み中...</p>
          ) : postsError ? (
            <p className="error" role="alert">{postsError}</p>
          ) : userPosts.length === 0 ? (
            <p className="empty-state">まだ投稿がありません</p>
          ) : (
            userPosts.map((post) => (
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
                  isLiked={
                    user
                      ? post.likes?.some(
                          (like) => like.user_id === user.id
                        ) ?? false
                      : false
                  }
                />
            ))
          )}
          </section>
        </div>
    );
}
export default UserProfile;
