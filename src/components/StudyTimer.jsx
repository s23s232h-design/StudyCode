import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

function StudyTimer({ user }) {
    const [seconds, setSeconds] = useState(0);
    const [intervalId, setIntervalId] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [totalStudySeconds, setTotalStudySeconds] = useState(0);
    const [todayStudySeconds, setTodayStudySeconds] = useState(0);
    const [weeklyStudySeconds, setWeeklyStudySeconds] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState("");
    
    useEffect(() => {
      const savedStartTime = localStorage.getItem("timerStartTime");
      const savedSeconds = localStorage.getItem("timerSeconds");

      let id = null;
      if(savedStartTime) {
        const start = Number(savedStartTime);
        
        const elapsedSeconds = Math.floor((Date.now() - start) / 1000);
        setSeconds(elapsedSeconds);
        
        id = setInterval(() => {
          const elapsedSeconds = Math.floor((Date.now() - start) / 1000);
          setSeconds(elapsedSeconds);
        }, 1000)
        setIntervalId(id);
      } else if (savedSeconds) {
        setSeconds(Number(savedSeconds));
      }
      return () => {
        if(id !== null) {
          clearInterval(id);
        }
      };
    }, []);
    
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
      const id = setInterval(() => {
          const elapsedMilliseconds = Date.now() - now;
          const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
          setSeconds(elapsedSeconds);
      }, 1000);
      setIntervalId(id);
    }

    function pauseTimer() {
        clearInterval(intervalId);
        setIntervalId(null);
        setStartTime(null);
        localStorage.removeItem("timerStartTime");
        localStorage.setItem("timerSeconds", String(seconds));
    }

    function resetTimer() {
      clearInterval(intervalId);
      setIntervalId(null);
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

    if(!user) {
      return (
        <div>
          <h3>学習タイマー</h3>
          <p>学習時間を記録するにはログインしてください</p>
        </div>
      )
    }
    return (
        <div>
          {isLoading ? (
            <p role="status">読み込み中...</p>
          ) : errorMessage ? (
            <p className="error" role="alert">{errorMessage}</p>
          ) : (
            <>
              <h3>累計学習時間</h3>
              <p>{totalDisplayHours}:{totalDisplayMinutes}:{totalDisplaySeconds}</p>
              <h3>今週の学習時間</h3>
              <p>{weeklyDisplayHours}:{weeklyDisplayMinutes}:{weeklyDisplaySeconds}</p>
              <h3>今日の学習時間</h3>
              <p>{todayDisplayHours}:{todayDisplayMinutes}:{todayDisplaySeconds}</p>
            </>
          )}
            <h3>学習タイマー</h3>
            <p>{displayHours}:{displayMinutes}:{displaySeconds}</p>
            {isSaving && <p role="status">記録中...</p>}
            {!isSaving && saveErrorMessage && (
              <p className="error" role="alert">{saveErrorMessage}</p>
            )}
            <button 
              onClick={startTimer}
              disabled={intervalId !== null}
            >
              開始
            </button>
            <button 
              onClick={pauseTimer}
              disabled={intervalId === null}
            >
              一時停止
            </button>
            <button 
              onClick={resetTimer}
              disabled={seconds === 0 || isSaving}
            >
              タイマーをリセット
            </button>
            <button
              onClick={saveStudyTime}
              disabled={seconds === 0 || isLoading || Boolean(errorMessage) || isSaving}
            >
              学習時間を記録
            </button>
        </div>
    )
}

export default StudyTimer;
