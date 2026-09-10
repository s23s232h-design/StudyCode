import { useEffect, useState } from "react";

function RelativeTime({ createdAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  function getRelativeTime() {
    const created = new Date(createdAt);

    const diffMilliseconds =
      now - created.getTime();

    const diffSeconds = Math.floor(
      diffMilliseconds / 1000
    );

    if (diffSeconds < 60) {
      return `${Math.max(diffSeconds, 0)}秒前`;
    }

    const diffMinutes = Math.floor(
      diffSeconds / 60
    );

    if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    }

    const diffHours = Math.floor(
      diffMinutes / 60
    );

    if (diffHours < 24) {
      return `${diffHours}時間前`;
    }

    const diffDays = Math.floor(
      diffHours / 24
    );

    return `${diffDays}日前`;
  }

  return <span>{getRelativeTime()}</span>;
}

export default RelativeTime;