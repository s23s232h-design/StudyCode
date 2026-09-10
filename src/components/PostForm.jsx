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
        <form onSubmit={addPost}>
        <p>学んだ用語</p>
        <input type="text"
             placeholder="学んだ用語を入力"
             value={term}
             onChange={(event) => setTerm(event.target.value)} 
        />
        <p>自分なりの理解</p>
        <textarea 
             placeholder="自分なりの理解を書いてみよう！"
             value={explanation}
             onChange={(event) => setExplanation(event.target.value)} 
        />
        <button 
          type="submit"
          className={isPosting ? "posting" : ""}
          disabled={
            term.trim() === "" || 
            explanation.trim() === "" ||
            isPosting}
        >
          {isPosting ? "投稿中..." : "投稿する"}
        </button>
        {message && (
          <p className={messageType}>
            {message}</p>
        )}
      </form>
    );
}

export default PostForm;