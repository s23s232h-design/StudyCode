function Reply({
  username,
  content,
  canDelete,
  onDelete
}) {
  return (
    <div>
      <p>{username}</p>
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