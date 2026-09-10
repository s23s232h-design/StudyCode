import RelativeTime from "./RelativeTime.jsx";

function Reply({
  username,
  content,
  createdAt,
  canDelete,
  onDelete
}) {
  return (
    <div>
      <p>{username}</p>
      <RelativeTime createdAt={createdAt} />
      <p>{content}</p>
      {canDelete && (
        <button onClick={onDelete}>
          削除
        </button>
      )}
    </div>
  );
}

export default Reply;