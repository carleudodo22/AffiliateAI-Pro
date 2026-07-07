"use client";

import { useEffect, useState } from "react";
import AffiliateAutopilotPanel from "./components/AffiliateAutopilotPanel";

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

  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [authName, setAuthName] = useState("Kauet");
  const [authEmail, setAuthEmail] = useState("teste456@email.com");
  const [authPassword, setAuthPassword] = useState("123456");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadCurrentUser();
  }, []);

  async function loadCurrentUser() {
    try {
      const savedToken = localStorage.getItem("affiliateai_token");

      if (!savedToken) {
        setCheckingSession(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("affiliateai_token");
        setToken("");
        setUser(null);
        setCheckingSession(false);
        return;
      }

      const data: User = await response.json();

      setToken(savedToken);
      setUser(data);
    } catch {
      localStorage.removeItem("affiliateai_token");
      setToken("");
      setUser(null);
    } finally {
      setCheckingSession(false);
    }
  }

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
      setToken(data.access_token);
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
      setToken(data.access_token);
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
    setToken("");
    setUser(null);
  }

  if (checkingSession) {
    return (
      <main className="page">
        <div className="gridGlow" />

        <section className="authShell">
          <div className="badge">
            <span className="pulse" />
            AffiliateAI Pro
          </div>

          <h1>
            Carregando <span>sistema...</span>
          </h1>

          <p className="subtitle">Verificando sua sessão.</p>
        </section>
      </main>
    );
  }

  if (!user || !token) {
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
            Entre na sua conta para acessar o painel inteligente de afiliados.
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
                    placeholder="Seu nome"
                  />
                </label>
              )}

              <label>
                Email
                <input
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="seuemail@email.com"
                />
              </label>

              <label>
                Senha
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="Sua senha"
                />
              </label>

              <button
                className="primaryButton authButton"
                onClick={authMode === "login" ? login : register}
                disabled={loading}
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
          Sistema online
        </div>

        <h1>
          AffiliateAI <span>Pro</span>
        </h1>

        <p className="subtitle">
          Painel inteligente para caçar oportunidades, montar campanhas e criar
          conteúdos para afiliados.
        </p>
      </section>

      <AffiliateAutopilotPanel />
    </main>
  );
}