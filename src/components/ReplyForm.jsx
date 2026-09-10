import { useState } from "react";

function ReplyForm({ onSubmitReply }) {
  const [content, setContent] = useState("");

  function handleSubmit(event) {
    event.preventDefault();

    if (content.trim() === "") {
      return;
    }

    onSubmitReply(content);

    setContent("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        placeholder="返信を入力"
      />

      <button type="submit">
        返信
      </button>
    </form>
  );
}

export default ReplyForm;