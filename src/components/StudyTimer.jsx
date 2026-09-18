import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function StudyTimer({ user }) {
    const [seconds, setSeconds] = useState(() => {
      const savedStartTime = Number(localStorage.getItem("timerStartTime"));
      if (Number.isFinite(savedStartTime) && savedStartTime > 0) {
        return Math.max(0, Math.floor((Date.now() - savedStartTime) / 1000));
      }
      const savedSeconds = Number(localStorage.getItem("timerSeconds"));
      return Number.isFinite(savedSeconds) ? Math.max(0, Math.floor(savedSeconds)) : 0;
    });
    const [startTime, setStartTime] = useState(() => {
      const savedStartTime = Number(localStorage.getItem("timerStartTime"));
      return Number.isFinite(savedStartTime) && savedStartTime > 0 ? savedStartTime : null;
    });
    const [totalStudySeconds, setTotalStudySeconds] = useState(0);
    const [todayStudySeconds, setTodayStudySeconds] = useState(0);
    const [weeklyStudySeconds, setWeeklyStudySeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState("");
    
    useEffect(() => {
      if (startTime === null) {
        return;
      }

      // 開始・復元したどちらのタイマーも、停止時と画面を離れるときに解除する。
      const id = setInterval(() => {
        setSeconds(Math.max(0, Math.floor((Date.now() - startTime) / 1000)));
      }, 1000);
      return () => {
        clearInterval(id);
      };
    }, [startTime]);
    
    useEffect(() => {
      let ignore = false;
      async function loadStudyTimes() {
        if (!user) {
          return;
        }
        setIsLoading(true);
        try {
          const { data, error } = await supabase
            .from("study_times")
            .select("study_date, seconds")
            .eq("user_id", user.id);
          if (error) {
            throw error;
          }
          if (ignore) {
            return;
          }
          const records = data ?? [];
          const total = records.reduce((sum, record) => {
            return sum + record.seconds;
          }, 0);
          setTotalStudySeconds(total);
          const today = new Date();
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, "0");
          const date = String(today.getDate()).padStart(2, "0");
          const todayKey = `${year}-${month}-${date}`;
          const todayRecord = records.find((record) => {
            return record.study_date === todayKey;
          });
          setTodayStudySeconds(todayRecord?.seconds ?? 0);
          const dayOfWeek = today.getDay();
          const daysFromMonday =
            dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const monday = new Date(today);
          monday.setDate(
            today.getDate() - daysFromMonday
          );
          let weeklyTotal = 0;
          for (let i = 0; i < 7; i++) {
            const currentDate = new Date(monday);
            currentDate.setDate(
              monday.getDate() + i
            );
            const year = currentDate.getFullYear();
            const month = String(
              currentDate.getMonth() + 1
            ).padStart(2, "0");
            const date = String(
              currentDate.getDate()
            ).padStart(2, "0");
            const dateKey =
              `${year}-${month}-${date}`;
            const record = records.find((record) => {
              return record.study_date === dateKey;
            });
            weeklyTotal += record?.seconds ?? 0;
          }
          setWeeklyStudySeconds(weeklyTotal);
          setErrorMessage("");
        } catch (error) {
          if (!ignore) {
            console.log(error.message);
            setErrorMessage("学習時間の読み込みに失敗しました");
          }
        } finally {
          if (!ignore) {
            setIsLoading(false);
          }
        }
      }
      loadStudyTimes();
      return () => {
        ignore = true;
      };
    }, [user]);

    function startTimer() {
      localStorage.removeItem("timerSeconds");
      const now = Date.now() - seconds * 1000;
      setStartTime(now);
      localStorage.setItem("timerStartTime", String(now));
    }

    function pauseTimer() {
        setStartTime(null);
        localStorage.removeItem("timerStartTime");
        localStorage.setItem("timerSeconds", String(seconds));
    }

    function resetTimer() {
      setStartTime(null);
      setSeconds(0);
      localStorage.removeItem("timerStartTime");
      localStorage.removeItem("timerSeconds");
    }
    async function saveStudyTime() {
      if (!user) {
        alert("学習時間を記録するにはログインしてください");
        return;
      }
      if (isLoading || errorMessage || isSaving) {
        return;
      }
      setIsSaving(true);
      let failureMessage = "学習時間の読み込みに失敗しました";
      try {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const date = String(today.getDate()).padStart(2, "0");
        const dateKey = `${year}-${month}-${date}`;

        const { data, error } = await supabase
          .from("study_times")
          .select("seconds")
          .eq("user_id", user.id)
          .eq("study_date", dateKey)
          .maybeSingle();
        if (error) {
          throw error;
        }
        setSaveErrorMessage("");
        failureMessage = "学習時間の記録に失敗しました";
        const newTodaySeconds = (data?.seconds ?? 0) + seconds;
        const { error: saveError } = await supabase
          .from("study_times")
          .upsert(
            {
              user_id: user.id,
              study_date: dateKey,
              seconds: newTodaySeconds
            },
            {
              onConflict: "user_id,study_date"
            }
          );
        if (saveError) {
          throw saveError;
        }
        setTodayStudySeconds(newTodaySeconds);
        setWeeklyStudySeconds((weeklyTotal) => weeklyTotal + seconds);
        setTotalStudySeconds((total) => total + seconds);
        resetTimer();
        setSaveErrorMessage("");
      } catch (error) {
        console.log(error.message);
        setSaveErrorMessage(failureMessage);
      } finally {
        setIsSaving(false);
      }
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const displayHours = String(hours).padStart(2, "0");
    const displayMinutes = String(minutes).padStart(2, "0");
    const displaySeconds = String(secs).padStart(2, "0");
    
    const totalHours = Math.floor(totalStudySeconds / 3600);
    const totalMinutes = Math.floor((totalStudySeconds % 3600) / 60);
    const totalSecs = totalStudySeconds % 60;
    const totalDisplayHours = String(totalHours).padStart(2, "0");
    const totalDisplayMinutes = String(totalMinutes).padStart(2, "0");
    const totalDisplaySeconds = String(totalSecs).padStart(2, "0");

    const todayHours = Math.floor(todayStudySeconds / 3600);
    const todayMinutes = Math.floor((todayStudySeconds % 3600) / 60);
    const todaySecs = todayStudySeconds % 60;
    const todayDisplayHours = String(todayHours).padStart(2, "0");
    const todayDisplayMinutes = String(todayMinutes).padStart(2, "0");
    const todayDisplaySeconds = String(todaySecs).padStart(2, "0");  

    const weeklyHours = Math.floor(weeklyStudySeconds / 3600);
    const weeklyMinutes = Math.floor((weeklyStudySeconds % 3600) / 60);
    const weeklySecs = weeklyStudySeconds % 60;
    const weeklyDisplayHours = String(weeklyHours).padStart(2, "0");
    const weeklyDisplayMinutes = String(weeklyMinutes).padStart(2, "0");
    const weeklyDisplaySeconds = String(weeklySecs).padStart(2, "0");  

    return (
        <div className="timer-page">
          <div className="page-header">
            <h2 className="page-title">学習タイマー</h2>
            <p className="page-description">集中した時間を記録して、日々の積み重ねを確かめましょう。</p>
          </div>
          {user && (
            isLoading ? (
              <p role="status">読み込み中...</p>
            ) : errorMessage ? (
              <p className="error" role="alert">{errorMessage}</p>
            ) : (
              <div className="study-summary-grid">
                <div className="study-summary-card">
                  <p className="study-summary-label">今日の学習時間</p>
                  <p className="study-summary-time">
                    {todayDisplayHours}:{todayDisplayMinutes}:{todayDisplaySeconds}
                  </p>
                </div>
                <div className="study-summary-card">
                  <p className="study-summary-label">今週の学習時間</p>
                  <p className="study-summary-time">
                    {weeklyDisplayHours}:{weeklyDisplayMinutes}:{weeklyDisplaySeconds}
                  </p>
                </div>
                <div className="study-summary-card">
                  <p className="study-summary-label">累計学習時間</p>
                  <p className="study-summary-time">
                    {totalDisplayHours}:{totalDisplayMinutes}:{totalDisplaySeconds}
                  </p>
                </div>
              </div>
            )
          )}
          <div className="timer-card">
            <h3>学習タイマー</h3>
            <p className="timer-display">
              {displayHours}:{displayMinutes}:{displaySeconds}
            </p>
            {isSaving && <p role="status">記録中...</p>}
            {!isSaving && saveErrorMessage && (
              <p className="error" role="alert">{saveErrorMessage}</p>
            )}
            <div className="timer-actions">
              <button
                className="primary-button"
                onClick={startTimer}
                disabled={startTime !== null}
              >
                {seconds > 0 ? "再開" : "開始"}
              </button>
              <button
                className="secondary-button"
                onClick={pauseTimer}
                disabled={startTime === null}
              >
                一時停止
              </button>
              <button
                className="secondary-button"
                onClick={resetTimer}
                disabled={seconds === 0 || isSaving}
              >
                タイマーをリセット
              </button>
              <button
                className="primary-button"
                onClick={saveStudyTime}
                disabled={seconds === 0 || isLoading || Boolean(errorMessage) || isSaving}
              >
                {isSaving ? "記録中..." : "学習時間を記録"}
              </button>
              {!user && (
                <p className="keyboard-hint">
                  学習時間を記録するにはログインが必要です
                </p>
              )}
            </div>
          </div>
        </div>
    )
}

export default StudyTimer;
