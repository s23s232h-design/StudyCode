function Reply({
  username,
  content
}) {
  return (
    <div>
      <p>{username}</p>
      <p>{content}</p>
    </div>
  );
}

export default Reply;