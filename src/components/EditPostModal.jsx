import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient.js"

function EditPostModal({
    postToEdit,
    setPostToEdit,
    setPosts
}) {
    const [editTerm, setEditTerm] = useState(postToEdit.term);
    const [editExplanation, setEditExplanation] = useState(postToEdit.explanation)
    const [isSaving, setIsSaving] = useState(false);
    const termInputRef = useRef(null);
    const explanationRef = useRef(null);
    const saveButtonRef = useRef(null);
    const cancelButtonRef = useRef(null);
    useEffect(() => {
      function handleKeyDown(event) {
        if(event.key === "Escape" && !isSaving) {
          setPostToEdit(null);
        }
        if(event.key === "Tab" && !isSaving) {
          if(
            !event.shiftKey &&
            document.activeElement === cancelButtonRef.current
          ) {
            event.preventDefault();
            termInputRef.current?.focus();
          }
          if(
            event.shiftKey &&
            document.activeElement === termInputRef.current
          ) {
            event.preventDefault();
            cancelButtonRef.current?.focus();
          }
        }
      }
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [isSaving, setPostToEdit]);
    useEffect(() => {
      termInputRef.current?.focus();
    }, []);
    useEffect(() =>{
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }, []);
    async function handleSave() {
      if(
        editTerm.trim() === "" || 
        editExplanation.trim() === ""
      ) {
        return;
      }
      setIsSaving(true);
      const { error } = await supabase
        .from("posts")
        .update({
          term: editTerm,
          explanation: editExplanation
        })
        .eq("id", postToEdit.id);
      if(error) {
        setIsSaving(false);
        return;
      }
      setPosts((currentPosts) =>
        currentPosts.map((post) => {
          if(post.id === postToEdit.id) {
            return {
              ...post,
              term: editTerm,
              explanation: editExplanation
            };
          }
          return post;
        })
      );
      setIsSaving(false);
      setPostToEdit(null);    
    }
    return (
      <div
        className="edit-modal-overlay"
        onClick={() => {
          if (!isSaving) {
            setPostToEdit(null);
          }
        }}
      >
        <div
          className="edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <h3 id="edit-modal-title">
            投稿を編集
          </h3>
          <p>用語</p>
          <input
            ref={termInputRef}
            type="text"
            value={editTerm}
            onChange={(event) => setEditTerm(event.target.value)}
          />
          <p>説明</p>
          <textarea
            ref={explanationRef}
            value={editExplanation}
            onChange={(event) => setEditExplanation(event.target.value)}
          />
          <button
            ref={saveButtonRef}
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "保存中..." : "保存する" }
          </button>
          <button
            ref={cancelButtonRef}
            onClick={() => setPostToEdit(null)}
            disabled={isSaving}
          >
            キャンセル
          </button>
        </div>
      </div>
    )
}

export default EditPostModal;