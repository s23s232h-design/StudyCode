import { useState } from "react";
import { handleFormArrowNavigation } from "../utils/formKeyboardNavigation.js";

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
    <form
      className="reply-form"
      onSubmit={handleSubmit}
      onKeyDown={handleFormArrowNavigation}
    >
      <textarea
        className="form-textarea"
        value={content}
        onChange={(event) =>
          setContent(event.target.value)
        }
        placeholder="返信を入力"
      />

      <button className="primary-button" type="submit">
        返信
      </button>
    </form>
  );
}

export default ReplyForm;
