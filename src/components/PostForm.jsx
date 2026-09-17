import { handleFormArrowNavigation } from "../utils/formKeyboardNavigation.js";

function PostForm({
    term,
    setTerm,
    explanation,
    setExplanation,
    addPost,
    message,
    messageType,
    isPosting
}) {
    return (
        <form
          className="post-form"
          onSubmit={addPost}
          onKeyDown={handleFormArrowNavigation}
        >
          <label className="form-label" htmlFor="post-term">
            学んだ用語
          </label>
        <input id="post-term" 
          className="form-input"
          type="text"
          placeholder="学んだ用語を入力"
          value={term}
          onChange={(event) => setTerm(event.target.value)} 
        />
        <label className="form-label" htmlFor="post-explanation">
          自分なりの理解
        </label>
        <textarea id="post-explanation" 
          className="form-textarea"
          placeholder="自分なりの理解を書いてみよう！"
          value={explanation}
          onChange={(event) => setExplanation(event.target.value)} 
        />
        <button 
          className={`primary-button ${isPosting ? "posting" : ""}`}
          type="submit"
          disabled={
            term.trim() === "" || 
            explanation.trim() === "" ||
            isPosting}
        >
          {isPosting ? "投稿中..." : "投稿する"}
        </button>
        <p className="keyboard-hint">
          Alt + ↑↓ で入力欄を移動できます
        </p>
        {message && (
          <p className={messageType}>
            {message}</p>
        )}
      </form>
    );
}

export default PostForm;
