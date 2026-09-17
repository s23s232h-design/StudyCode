import { useEffect, useRef } from "react";

function DeleteModal ({
    postToDelete,
    isDeleting,
    onConfirm,
    onClose
}) {
    const cancelButtonRef = useRef(null);
    const deleteButtonRef = useRef(null);
    useEffect(() => {
      function handleKeyDown(event) {
        if (event.key === "Escape" && !isDeleting) {
          onClose();
        }
        if (event.key === "Tab" && !isDeleting) {
          if(
            !event.shiftKey &&
            document.activeElement === cancelButtonRef.current
          ) {
            event.preventDefault();
            deleteButtonRef.current?.focus();
          }
          if(
            event.shiftKey &&
            document.activeElement === deleteButtonRef.current
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
    }, [postToDelete, isDeleting, onClose]);

    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    },[]);
  
    useEffect(() => {
      cancelButtonRef.current?.focus();
    }, []);

    return (
      <div
        className="delete-modal-overlay"
        onClick={() => {
          if(!isDeleting) {
            onClose();
          }
        }}
      >
        <div
          className="delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          onClick={(event) => event.stopPropagation()}
        >
          <p id="delete-modal-title" className="modal-message">
           「{postToDelete?.term}」を削除しますか？
          </p>
          <div className="modal-actions">
            <button
              ref={deleteButtonRef}
              className="danger-button"
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "削除中..." : "削除する"}
            </button>
            <button
              ref={cancelButtonRef}
              className="secondary-button"
              onClick={onClose}
              disabled={isDeleting}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    );
}

export default DeleteModal;
