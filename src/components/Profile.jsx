import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { handleFormArrowNavigation } from "../utils/formKeyboardNavigation.js";
import Avatar from "./Avatar.jsx";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

function Profile({ user, setAppUsername, setAppAvatarUrl, updateAppProfile }) {
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [introduction, setIntroduction] = useState(""); 
  const [isEditing, setIsEditing] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialInput, setMaterialInput] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioUrlInput, setPortfolioUrlInput] = useState("");
  const [portfolioTitleInput, setPortfolioTitleInput] = useState("");
  const [totalStudySeconds, setTotalStudySeconds] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const totalHours = Math.floor(totalStudySeconds / 3600);
  const totalMinutes = Math.floor((totalStudySeconds % 3600) / 60);
  const [saveErrorMessage, setSaveErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function loadProfile() {
      if(!user) {
        return;
      }
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, introduction, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if(error) {
          throw error;
        }
        const { data: materialData, error: materialError } = await supabase
          .from("materials")
          .select("id, name")
          .eq("user_id", user.id);
        if(materialError) {
          throw materialError;
        }
        const { data: portfolioData, error: portfolioError } = await supabase
          .from("portfolios")
          .select("id, title, url")
          .eq("user_id", user.id);
        if (portfolioError) {
          throw portfolioError;
        }
        const { data: studyTimeData, error: studyTimeError } = await supabase
          .from("study_times")
          .select("seconds")
          .eq("user_id", user.id);
        if (studyTimeError) {
          throw studyTimeError;
        }
        if (ignore) {
          return;
        }
        setUsername(data?.username ?? "");
        setAvatarUrl(data?.avatar_url ?? "");
        setIntroduction(data?.introduction ?? "");
        setMaterials(
          (materialData ?? []).map((material) => ({
            ...material,
            deleted: false
          }))
        );
        setPortfolios(
          (portfolioData ?? []).map((portfolio) => ({
            ...portfolio,
            deleted: false
          }))
        );
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
    loadProfile();
    return () => {
      ignore = true;
    };
  }, [user]);

  function addPortfolio(){
    if(portfolioTitleInput.trim() === "" || portfolioUrlInput.trim() === "") {
      return;
    }
    setPortfolios([
      ...portfolios,
      {
        title: portfolioTitleInput,
        url: portfolioUrlInput,
        deleted: false
      }
    ]);
    setPortfolioTitleInput("");
    setPortfolioUrlInput("");
  }
  function addMaterial() {
    if(materialInput.trim() === "") {
      return;
    }
    setMaterials([
      ...materials, 
      {
        name: materialInput,
        deleted: false
      }
    ]);
    setMaterialInput("");
  }
  function toggleDeletePortfolio(indexToChange) {
    const newPortfolios = portfolios.map((portfolio, index) => {
      if(index === indexToChange) {
        return {
          ...portfolio,
          deleted: !portfolio.deleted
        };
      }
      return portfolio;
    });
    setPortfolios(newPortfolios);
  }
  function toggleDeleteMaterial(indexToChange) {
    const newMaterials = materials.map((material, index) => {
      if(index === indexToChange) {
        return {
          ...material,
          deleted: !material.deleted
        };
      }
      return material;
    });
    setMaterials(newMaterials);
  }
  function handleAvatarFileChange(event) {
    const file = event.target.files?.[0];
    setAvatarFile(null);
    setAvatarError("");
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("画像ファイルを選択してください");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("プロフィール画像は5MB以下にしてください");
      return;
    }
    setAvatarFile(file);
  }

  async function saveProfile() {
    if(!user) {
      alert("プロフィールを保存するにはログインしてください")
      return;
    }
    if (isSaving || isAvatarUploading || avatarError) {
      return;
    }
    setIsSaving(true);
    setSaveErrorMessage("");
    try {
    let avatarUrlToSave = avatarUrl;
    if (avatarFile) {
      setIsAvatarUploading(true);
      const avatarPath = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(avatarPath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type
        });
      if (uploadError) {
        throw uploadError;
      }
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(avatarPath);
      avatarUrlToSave = `${publicUrl}?v=${Date.now()}`;
      setIsAvatarUploading(false);
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username: username,
        introduction: introduction,
        avatar_url: avatarUrlToSave
      });
    if(error) {
      throw error;
    }
    setAppUsername(username);
    setAvatarUrl(avatarUrlToSave);
    setAppAvatarUrl(avatarUrlToSave);
    updateAppProfile({
      userId: user.id,
      username,
      avatarUrl: avatarUrlToSave
    });
    setAvatarFile(null);
    const materialsToDelete = materials.filter((material) => {
      return material.deleted && material.id;
    });
    if(materialsToDelete.length > 0) {
      const isToDelete = materialsToDelete.map((material) => {
        return material.id;
      });
      const { error: deleteMaterialError } = await supabase
        .from("materials")
        .delete()
        .in("id", isToDelete);
      if(deleteMaterialError) {
        throw deleteMaterialError;
      }
    }
    const newMaterials = materials.filter((material) => {
      return !material.deleted && !material.id;
    });
    let insertedMaterials = [];
    if(newMaterials.length > 0) {
      const { data: materialData, error: insertMaterialError } = await supabase
        .from("materials")
        .insert(
          newMaterials.map((material) => {
            return {
              user_id: user.id,
              name: material.name
            };
          })
        )
        .select("id, name");
      if(insertMaterialError) {
        throw insertMaterialError;
      }
      insertedMaterials = materialData;
    }
    const existingMaterials = materials.filter((material) => {
      return !material.deleted && material.id;
    });
    setMaterials([
      ...existingMaterials,
      ...insertedMaterials.map((material) => {
        return {
          ...material,
          deleted: false
        };
      })
    ]);
    const portfoliosToDelete = portfolios.filter((portfolio) => {
      return portfolio.deleted && portfolio.id;
    });
    if (portfoliosToDelete.length > 0) {
      const idsToDelete = portfoliosToDelete.map((portfolio) => {
        return portfolio.id;
      });

      const { error: deletePortfolioError } = await supabase
        .from("portfolios")
        .delete()
        .in("id", idsToDelete);

      if (deletePortfolioError) {
        throw deletePortfolioError;
      }
    }
    const newPortfolios = portfolios.filter((portfolio) => {
      return !portfolio.deleted && !portfolio.id;
    });
    let insertedPortfolios = [];
    if (newPortfolios.length > 0) {
      const { data: portfolioData, error: insertPortfolioError } = await supabase
        .from("portfolios")
        .insert(
          newPortfolios.map((portfolio) => {
            return {
              user_id: user.id,
              title: portfolio.title,
              url: portfolio.url
            };
          })
        )
        .select("id, title, url");
      if (insertPortfolioError) {
        throw insertPortfolioError;
      }
      insertedPortfolios = portfolioData;
    }
      const existingPortfolios = portfolios.filter((portfolio) => {
        return !portfolio.deleted && portfolio.id;
      });
      setPortfolios([
        ...existingPortfolios,
        ...insertedPortfolios.map((portfolio) => {
          return {
            ...portfolio,
            deleted: false
          };
        })
      ]);
    setIsEditing(false);
    setErrorMessage("");
    setSaveErrorMessage("");
    } catch (error) {
      console.log(error.message);
      setSaveErrorMessage("プロフィールの保存に失敗しました")
    } finally {
      setIsAvatarUploading(false);
      setIsSaving(false);
    }
  }
  async function cancelEdit() {
    if(!user || isSaving || isAvatarUploading) {
      return;
    }
    setAvatarFile(null);
    setAvatarError("");
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username, introduction, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if(error) {
        throw error;
      }
      const { data: materialData, error: materialError} = await supabase
        .from("materials")
        .select("id, name")
        .eq("user_id", user.id);
      if (materialError) {
        throw materialError;
      }
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id, title, url")
        .eq("user_id", user.id);
      if (portfolioError) {
        throw portfolioError;
      }
      setUsername(data?.username ?? "");
      setAvatarUrl(data?.avatar_url ?? "");
      setIntroduction(data?.introduction ?? "");
      setMaterials(
        (materialData ?? []).map((material) => ({
          ...material,
          deleted: false
        }))
      );
      setPortfolios(
        (portfolioData ?? []).map((portfolio) => ({
          ...portfolio,
          deleted: false
        }))
      );
      setPortfolioTitleInput("");
      setPortfolioUrlInput("");
      setMaterialInput("");
      setIsEditing(false);
      setErrorMessage("");
    } catch (error) {
      console.log(error.message);
      setErrorMessage("プロフィールの読み込みに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }
  if(!user) {
    return (
      <div>
        <div className="page-header"><h2 className="page-title">プロフィール</h2></div>
        <p className="empty-state">プロフィールを見るにはログインしてください</p>
      </div>
    );
  }
  return (
    <div className="profile-form">
      <div className="page-header"><h2 className="page-title">プロフィール</h2></div>
      {isLoading && <p role="status">読み込み中...</p>}
      {!isLoading && errorMessage && (
        <p className="error" role="alert">{errorMessage}</p>
      )}
      {!isLoading && (!errorMessage || isEditing) && (
        isEditing ? (
          <div className="profile-editor" onKeyDown={handleFormArrowNavigation}>
            <Avatar avatarUrl={avatarUrl} username={username} size="large" />
            <label className="form-label" htmlFor="avatar-file">
              プロフィール画像
            </label>
            <input
              key={avatarUrl}
              id="avatar-file"
              className="form-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
              disabled={isSaving || isAvatarUploading}
              aria-describedby="avatar-file-hint"
              aria-invalid={Boolean(avatarError)}
            />
            <p id="avatar-file-hint" className="keyboard-hint">
              5MB以下の画像を選択してください。
            </p>
            {avatarError && <p className="error" role="alert">{avatarError}</p>}
            <label className="form-label">
              ユーザー名
            </label>
            <input
              className="form-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <label className="form-label">
              自己紹介
            </label>
            <textarea 
              className="form-textarea"
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
            />
            <label className="form-label">
              使用している教材
            </label>
            <div className="inline-form">
              <input
                className="form-input" 
                type="text"
                value={materialInput}
                onChange={(event) => setMaterialInput(event.target.value)}
               />
              <button
                className="secondary-button"
                onClick={addMaterial}
              >
                追加
               </button>
             </div>
             <ul className="edit-list">
               {materials.map((material, index) => (
                  <li key={index} className="edit-list-item">
                    <span
                      className={material.deleted ? "deleted-item" : ""}
                    >
                      {material.name}
                    </span>
                    <button 
                      className={
                        material.deleted
                          ? "secondary-button small-button"
                          : "danger-button small-button"
                      } 
                      onClick={() => toggleDeleteMaterial(index)}
                    >
                      {material.deleted ? "戻す" : "削除"}
                    </button>
                 </li>
               ))}
             </ul>
             <label className="form-label">
               ポートフォリオ
             </label>
             <div className="profile-portfolio-inputs">
               <input 
                 className="form-input"
                 type="text"
                 placeholder="アプリ名を記載してください"
                 value={portfolioTitleInput}
                 onChange={(event) => setPortfolioTitleInput(event.target.value)}
               />
               <input
                 className="form-input"
                 type="text"
                 placeholder="URLを貼ってください"
                 value={portfolioUrlInput}
                 onChange={(event) => setPortfolioUrlInput(event.target.value)}
                />
               <button
                 className="secondary-button"
                 onClick={addPortfolio}>
                  追加
               </button> 
              </div>
              <ul className="edit-list">
                {portfolios.map((portfolio, index) => (
                  <li key={index} className="edit-list-item">
                    <span
                      className={portfolio.deleted ? "deleted-item" : ""}
                    > 
                      {portfolio.title} : {portfolio.url}
                    </span>
                    <button
                      className={
                        portfolio.deleted
                          ? "secondary-button small-button"
                          : "danger-button small-button"
                      }
                      onClick={() => toggleDeletePortfolio(index)}
                    >
                      {portfolio.deleted ? "戻す" : "削除"}
                    </button>
                  </li>
                ))}        
              </ul>
            <div className="profile-actions">
              <button
                className="primary-button"
                onClick={saveProfile}
                disabled={isSaving || isAvatarUploading || Boolean(avatarError)}
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
              {isSaving && (
                <p role="status">
                  {isAvatarUploading ? "画像をアップロード中..." : "保存中..."}
                </p>
              )}
              {!isSaving && saveErrorMessage && (
                <p className="error" role="alert">
                  {saveErrorMessage}
                </p>
              )}
              <button 
                className="secondary-button"
                onClick={cancelEdit}
                disabled={isSaving || isAvatarUploading}>
                キャンセル
              </button>
            </div>
            <p className="keyboard-hint">
              Alt + ↑↓ で入力欄を移動できます
            </p>
          </div>
        ) : (
          <div className="profile-view">
            <div className="profile-overview">
              <Avatar avatarUrl={avatarUrl} username={username} size="large" />
              <div>
                <h3 className="profile-name">{username || "ユーザー名未設定"}</h3>
                <p className="profile-value">{introduction || "自己紹介はまだ登録されていません。"}</p>
              </div>
            </div>
            <div className="profile-section">
              <p className="profile-label">累計学習時間</p>
              <p className="profile-value">{totalHours}時間{totalMinutes}分</p>
            </div>
            <div className="profile-section">
              <p className="profile-label">使用している教材</p>
              {materials.length === 0 && (
                <p className="empty-state">登録されている教材はありません</p>
              )}
              <ul className="profile-list">
                {materials.map((material, index) => (
                  <li key={index}>
                    {material.name}
                  </li>
                ))}
              </ul>
            </div>
            <div className="profile-section">
              <p className="profile-label">ポートフォリオ</p>
              {portfolios.length === 0 && (
                <p className="empty-state">登録されているポートフォリオはありません</p>
              )}
              <ul className="profile-list">
                {portfolios.map((portfolio, index) => (
                  <li key={index}>
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
            </div>
            <button 
              className="primary-button"
              onClick={() => setIsEditing(true)}
            >
              編集
            </button>
          </div>
        )
      )}
    </div>
  );
}

export default Profile;
