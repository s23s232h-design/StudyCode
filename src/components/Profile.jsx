import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function Profile( {user, setAppUsername } ) {
  const [username, setUsername] = useState("");
  const [introduction, setIntroduction] = useState(""); 
  const [isEditing, setIsEditing] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [materialInput, setMaterialInput] = useState("");
  const [portfolios, setPortfolios] = useState([]);
  const [portfolioUrlInput, setPortfolioUrlInput] = useState("");
  const [portfolioTitleInput, setPortfolioTitleInput] = useState("");
  const [totalStudySeconds, setTotalStudySeconds] = useState(0);
  const totalHours = Math.floor(totalStudySeconds / 3600);
  const totalMinutes = Math.floor((totalStudySeconds % 3600) / 60);

  useEffect(() => {
    async function loadProfile() {
      if(!user) {
        return;
      }
      const{ data, error } = await supabase
        .from("profiles")
        .select("username, introduction")
        .eq("id", user.id)
        .maybeSingle();
      if(error) {
        console.log(error.message);
        return;
      }
      if(data) {
        setUsername(data.username ?? "");
        setIntroduction(data.introduction ?? "");
      }
      const { data: materialData, error: materialError } = await supabase
        .from("materials")
        .select("id, name")
        .eq("user_id", user.id);
      if(materialError) {
        console.log(materialError.message);
        return;
      }  
      setMaterials(
        materialData.map((material) => {
          return {
            ...material,
            deleted: false
          };
        })
      );
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("portfolios")
        .select("id, title, url")
        .eq("user_id", user.id);
      if (portfolioError) {
        console.log(portfolioError.message);
        return;
      }
      setPortfolios(
        portfolioData.map((portfolio) => {
          return {
            ...portfolio,
            deleted: false
          };
        })
      );
      const { data: studyTimeData, error: studyTimeError } = await supabase
        .from("study_times")
        .select("seconds")
        .eq("user_id", user.id);
      if (studyTimeError) {
        console.log(studyTimeError.message);
        return;
      }
      const total = studyTimeData.reduce((sum, record) => {
        return sum + record.seconds;
      }, 0);
      setTotalStudySeconds(total);
    }
    loadProfile();
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
  async function saveProfile() {
    if(!user) {
      alert("プロフィールを保存するにはログインしてください")
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        username: username,
        introduction: introduction
      });
    if(error) {
      console.log(error.message);
      return;
    }
    setAppUsername(username);
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
        console.log(deleteMaterialError.message);
        return;
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
        console.log(insertMaterialError.message);
        return;
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
        console.log(deletePortfolioError.message);
        return;
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
        console.log(insertPortfolioError.message);
        return;
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
  }
  async function cancelEdit() {
    if(!user) {
      return;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("username, introduction")
      .eq("id", user.id)
      .maybeSingle();
    if(error) {
        console.log(error.message);
        return;
    }
    if(data) {
      setUsername(data.username ?? "");
      setIntroduction(data.introduction ?? "");
    }
    const { data: materialData, error: materialError} = await supabase
      .from("materials")
      .select("id, name")
      .eq("user_id", user.id);
    if (materialError) {
      console.log(materialError.message);
      return;
    }
    setMaterials(
      materialData.map((material) => {
        return {
          ...material,
          deleted: false
        };
      })
    );
    const { data: portfolioData, error: portfolioError } = await supabase
      .from("portfolios")
      .select("id, title, url")
      .eq("user_id", user.id);
    if (portfolioError) {
      console.log(portfolioError.message);
      return;
    }
    setPortfolios(
      portfolioData.map((portfolio) => {
        return {
          ...portfolio,
          deleted: false
        };
      })
    );
    setPortfolioTitleInput("");
    setPortfolioUrlInput("");
    setMaterialInput("");
    setIsEditing(false);
  }
  if(!user) {
    return (
      <div>
        <h3>プロフィール</h3>
        <p>プロフィールを見るにはログインしてください</p>
      </div>
    );
  }
  return (
    <div>
      <h3>プロフィール</h3>
        {isEditing ? (
          <div>
            <p>ユーザー名：</p>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <p>自己紹介：</p>
            <textarea 
              value={introduction}
              onChange={(event) => setIntroduction(event.target.value)}
            />
            <p>使用している教材</p>
            <input 
              type="text"
              value={materialInput}
              onChange={(event) => setMaterialInput(event.target.value)}
             />
             <button onClick={addMaterial}>
              追加
             </button>
             <ul>
               {materials.map((material, index) => (
                  <li key={index}>
                    <span
                      style={{
                        opacity: material.deleted ? 0.4 : 1
                      }}
                    >
                   {material.name}
                   </span>
                   <button onClick={() => toggleDeleteMaterial(index)}>
                    {material.deleted ? "戻す" : "削除"}
                   </button>
                 </li>
               ))}
             </ul>
             <p>ポートフォリオ</p>
             <input 
               type="text"
               placeholder="アプリ名を記載してください"
               value={portfolioTitleInput}
               onChange={(event) => setPortfolioTitleInput(event.target.value)}
              />
              <input
               type="text"
               placeholder="URLを貼ってください"
               value={portfolioUrlInput}
               onChange={(event) => setPortfolioUrlInput(event.target.value)}
               />
              <button onClick={addPortfolio}>
                追加
              </button> 
              <ul>
                {portfolios.map((portfolio, index) => (
                  <li key={index}>
                    <span
                      style={{
                        opacity: portfolio.deleted ? 0.4 : 1
                      }}
                    >
                      {portfolio.title} : {portfolio.url}
                    </span>
                    <button onClick={() => toggleDeletePortfolio(index)}>
                      {portfolio.deleted ? "戻す" : "削除"}
                    </button>
                  </li>
                ))}        
              </ul>
            <button onClick={saveProfile}>
              保存
            </button>
            <button onClick={cancelEdit}>
              キャンセル
            </button>
          </div>
        ) : (
          <div>
            <p>ユーザー名：{username}</p>
            <p>自己紹介：{introduction}</p>
            <p>累計学習時間：{totalHours}時間{totalMinutes}分</p>
            <p>使用している教材</p>
            <ul>
               {materials.map((material, index) => (
                 <li key={index}>
                   {material.name}
                 </li>
               ))}
             </ul>
             <p>ポートフォリオ</p>
             <ul>
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
            <button onClick={() => setIsEditing(true)}>
              編集
            </button>
          </div>
        )}
    </div>
  );
}

export default Profile;