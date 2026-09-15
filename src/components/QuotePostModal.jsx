import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { handleFormArrowNavigation } from "../utils/formKeyboardNavigation.js";
import QuotedPostCard from "./QuotedPostCard.jsx";

function QuotePostModal({ quotedPost, user, setPosts, onClose }) {
  const [quoteTerm, setQuoteTerm] = useState("");
  const [quoteExplanation, setQuoteExplanation] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const modalRef = useRef(null);
  const termInputRef = useRef(null);
  const postingRef = useRef(false);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    termInputRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !postingRef.current) {
        onClose();
      }
      if (event.key !== "Tab") {
        return;
      }
      const modal = modalRef.current;
      if (!modal) {
        return;
      }
      const fields = Array.from(modal.querySelectorAll(
        "input:not(:disabled), textarea:not(:disabled), button:not(:disabled)"
      ));
      const first = fields[0];
      const last = fields[fields.length - 1];
      if (!first) {
        event.preventDefault();
        modal.focus();
      } else if (!fields.includes(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (postingRef.current) {
      return;
    }
    if (!user) {
      alert("引用するにはログインしてください");
      return;
    }
    if (quotedPost.deleted_at) {
      setErrorMessage("削除済みの投稿は引用できません");
      return;
    }
    if (quoteTerm.trim() === "" || quoteExplanation.trim() === "") {
      setErrorMessage("用語と説明を入力してください");
      return;
    }

    postingRef.current = true;
    setIsPosting(true);
    setErrorMessage("");
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          term: quoteTerm,
          explanation: quoteExplanation,
          quoted_post_id: quotedPost.id
        })
        .select(`
          *,
          profiles (username),
          likes (user_id),
          reposts (
            user_id,
            created_at,
            profiles (username)
          ),
          quoted_post:posts!posts_quoted_post_id_fkey (
            id,
            user_id,
            term,
            explanation,
            created_at,
            deleted_at,
            profiles (username)
          )
        `)
        .single();
      if (error) {
        throw error;
      }
      setPosts((currentPosts) => [data, ...currentPosts]);
      onClose();
    } catch (error) {
      console.log(error.message);
      setErrorMessage("引用投稿に失敗しました。もう一度お試しください。");
    } finally {
      postingRef.current = false;
      setIsPosting(false);
    }
  }

  return (
    <div
      className="quote-modal"
      onClick={() => {
        if (!postingRef.current) {
          onClose();
        }
      }}
    >
      <form
        className="quote-modal-content"
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-modal-title"
        aria-busy={isPosting}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={handleFormArrowNavigation}
        onSubmit={handleSubmit}
      >
        <h3 id="quote-modal-title">投稿を引用</h3>
        <QuotedPostCard quotedPost={quotedPost} />
        <label className="form-label" htmlFor="quote-term">用語</label>
        <input
          ref={termInputRef}
          id="quote-term"
          className="form-input"
          value={quoteTerm}
          onChange={(event) => setQuoteTerm(event.target.value)}
          disabled={isPosting}
          required
        />
        <label className="form-label" htmlFor="quote-explanation">説明</label>
        <textarea
          id="quote-explanation"
          className="form-textarea"
          value={quoteExplanation}
          onChange={(event) => setQuoteExplanation(event.target.value)}
          disabled={isPosting}
          required
        />
        <p className="keyboard-hint">Alt + ↑↓ で入力欄を移動できます</p>
        {errorMessage && <p className="error" role="alert">{errorMessage}</p>}
        <div className="modal-actions">
          <button className="primary-button" type="submit" disabled={isPosting}>
            {isPosting ? "投稿中..." : "引用して投稿"}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={isPosting}
            onClick={onClose}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuotePostModal;
