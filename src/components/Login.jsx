import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function getJapaneseErrorMessage(message) {
    if(message.includes("Invalid login credentials")) {
      return "メールアドレスまたはパスワードが間違っています";
    }
    if(message.includes("Password should be at least")) {
      return "パスワードが短すぎます";
    }
    if(message.includes("User already registered")) {
      return "このメールアドレスはすでに登録されています";
    }
    return "エラーが発生しました。もう一度お試しください";
  }

  async function signUp() {
    setMessage("");
    if(email.trim() === "" || password.trim() === "") {
      setMessage("メールアドレスとパスワードを入力してください")
      return;
    }
    if(password.length < 6) {
      setMessage("パスワードは６文字以上にしてください")
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });

    if (error) {
      setMessage(getJapaneseErrorMessage(error.message));
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setMessage("確認メールを送信しました。メールを確認してください。");
  }

  async function signIn() {
    setMessage("");
    if(email.trim() === "" || password.trim() === "") {
      setMessage("メールアドレスとパスワードを入力してください")
      return;
    }
    setIsLoading(true);
    const { data, error} = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    if(error) {
      setMessage(getJapaneseErrorMessage(error.message));
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    setEmail("");
    setPassword("");
    setMessage("ログインしました。");
    navigate("/");
  }

  return (
    <div>
      <h3>新規登録</h3>

      <form>
        <input
          type="email"
          placeholder="メールアドレス"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button
          type="button" 
          onClick={signUp}
          disabled={isLoading}
        >
          {isLoading ? "処理中..." : "新規登録"}
        </button>
        <button
          type="button" 
          onClick={signIn}
          disabled={isLoading}
        >
          {isLoading ? "処理中..." : "ログイン"}
        </button>
      </form>

      {message && (
        <p>{message}</p>
      )}
    </div>
  );
}

export default Login;