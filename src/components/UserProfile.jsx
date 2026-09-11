import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import Post from "./Post";

function UserProfile( { posts, likePost, user, isPostsLoading, postsError }) {
    const { userId } = useParams();
    const [username, setUsername] = useState("");
    const [introduction, setIntroduction] = useState("");
    const userPosts = posts.filter((post) => {
        return post.user_id === userId;
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
                .select("username, introduction")
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
          <h3>ユーザープロフィール</h3>
          {isLoading ? (
            <p role="status">読み込み中...</p>
          ) : errorMessage ? (
            <p className="error" role="alert">{errorMessage}</p>
          ) : (
            <>
              <p>ユーザー名：{username || "未設定"}</p>
              <p>自己紹介：{introduction || "未設定"}</p>
              <p>
                累計学習時間：
                {totalHours}時間{totalMinutes}分
              </p>
              <h3>使用している教材</h3>
              {materials.length === 0 ? (
                <p>登録されている教材はありません</p>
              ) : (
                <ul>
                  {materials.map((material) => (
                    <li key={material.id}>
                      {material.name}
                    </li>
                  ))}
                </ul>
              )}
              <h3>ポートフォリオ</h3>
              {portfolios.length === 0 ? (
                <p>登録されているポートフォリオはありません</p>
              ) : (
                <ul>
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
            </>
          )}
          <h3>投稿</h3>
          {isPostsLoading ? (
            <p role="status">読み込み中...</p>
          ) : postsError ? (
            <p className="error" role="alert">{postsError}</p>
          ) : userPosts.length === 0 ? (
            <p>まだ投稿がありません</p>
          ) : (
            userPosts.map((post) => (
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
                      ? post.likes?.some(
                          (like) => like.user_id === user.id
                        ) ?? false
                      : false
                  }
                />
            ))
          )}
        </div>
    );
}
export default UserProfile;
