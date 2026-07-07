"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = {
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);

  const [authName, setAuthName] = useState("Kauet");
  const [authEmail, setAuthEmail] = useState("teste456@email.com");
  const [authPassword, setAuthPassword] = useState("123456");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function register() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: authName,
          email: authEmail,
          password: authPassword,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AuthResponse = await response.json();

      localStorage.setItem("affiliateai_token", data.access_token);
      setUser(data.user);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao cadastrar.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authEmail,
          password: authPassword,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AuthResponse = await response.json();

      localStorage.setItem("affiliateai_token", data.access_token);
      setUser(data.user);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao fazer login.");
      }
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("affiliateai_token");
    setUser(null);
  }

  if (!user) {
    return (
      <main className="page">
        <div className="gridGlow" />

        <section className="authShell">
          <div className="badge">
            <span className="pulse" />
            AI Affiliate Marketing SaaS
          </div>

          <h1>
            AffiliateAI <span>Pro</span>
          </h1>

          <p className="subtitle">
            Entre na sua conta para acessar o painel inteligente.
          </p>

          <div className="authPanel">
            <div className="panelHeader">
              <span className="dot" />
              {authMode === "login" ? "Login" : "Criar Conta"}
            </div>

            <div className="authTabs">
              <button
                className={authMode === "login" ? "active" : ""}
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>

              <button
                className={authMode === "register" ? "active" : ""}
                onClick={() => setAuthMode("register")}
              >
                Cadastro
              </button>
            </div>

            <div className="authForm">
              {authMode === "register" && (
                <label>
                  Nome
                  <input
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                  />
                </label>
              )}

              <label>
                Email
                <input
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                />
              </label>

              <label>
                Senha
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                />
              </label>

              <button
                className="primaryButton authButton"
                onClick={authMode === "login" ? login : register}
              >
                {loading
                  ? "Processando..."
                  : authMode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </button>

              {errorMessage && <p className="errorMessage">{errorMessage}</p>}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="gridGlow" />

      <section className="hero">
        <div className="topBar">
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <button onClick={logout}>Sair</button>
        </div>

        <div className="badge">
          <span className="pulse" />
          Sistema estável
        </div>

        <h1>
          AffiliateAI <span>Pro</span>
        </h1>

        <p className="subtitle">
          Login funcionando. Agora podemos reconstruir os agentes por partes sem
          travar o projeto.
        </p>
      </section>
    </main>
  );
}