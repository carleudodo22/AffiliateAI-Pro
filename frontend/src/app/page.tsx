"use client";

import { useEffect, useState } from "react";
import AffiliateAutopilotPanel from "./components/AffiliateAutopilotPanel";
import CampaignPackagePanel from "./components/CampaignPackagePanel";
import ContentGeneratorPanel from "./components/ContentGeneratorPanel";
import CreativeImagePanel from "./components/CreativeImagePanel";
import DashboardOverview from "./components/DashboardOverview";
import HistoryCenter from "./components/HistoryCenter";
import ProductHunterPanel from "./components/ProductHunterPanel";
import SettingsPanel from "./components/SettingsPanel";
import SystemInfoPanel from "./components/SystemInfoPanel";

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

type AppTab =
  | "dashboard"
  | "autopilot"
  | "product_hunter"
  | "content_generator"
  | "creative_image"
  | "campaign_package"
  | "history"
  | "system"
  | "settings";

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");

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
      setActiveTab("dashboard");
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
      setActiveTab("dashboard");
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
    setActiveTab("dashboard");
  }

  function renderSettingsIcon() {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 15.2A3.2 3.2 0 1 0 12 8.8a3.2 3.2 0 0 0 0 6.4Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.02-1.58a.5.5 0 0 0 .12-.64l-1.91-3.31a.5.5 0 0 0-.61-.22l-2.38.96a7.2 7.2 0 0 0-1.7-.98L14.6 2.72A.5.5 0 0 0 14.11 2h-3.82a.5.5 0 0 0-.49.42L9.43 4.95c-.61.24-1.18.57-1.7.98l-2.38-.96a.5.5 0 0 0-.61.22L2.83 8.5a.5.5 0 0 0 .12.64l2.02 1.58c-.04.32-.07.65-.07.98s.02.66.07.98l-2.02 1.58a.5.5 0 0 0-.12.64l1.91 3.31a.5.5 0 0 0 .61.22l2.38-.96c.52.4 1.09.73 1.7.98l.37 2.53a.5.5 0 0 0 .49.42h3.82a.5.5 0 0 0 .49-.42l.37-2.53c.61-.24 1.18-.57 1.7-.98l2.38.96a.5.5 0 0 0 .61-.22l1.91-3.31a.5.5 0 0 0-.12-.64l-2.02-1.58Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  function renderSystemIcon() {
    return (
      <svg
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 5.5C4 4.67 4.67 4 5.5 4h13c.83 0 1.5.67 1.5 1.5v9c0 .83-.67 1.5-1.5 1.5h-13C4.67 16 4 15.33 4 14.5v-9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 20h6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M12 16v4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M8 8h8M8 11h5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  function renderTabContent() {
    if (activeTab === "dashboard") {
      return <DashboardOverview />;
    }

    if (activeTab === "autopilot") {
      return <AffiliateAutopilotPanel token={token} />;
    }

    if (activeTab === "product_hunter") {
      return <ProductHunterPanel token={token} />;
    }

    if (activeTab === "content_generator") {
      return <ContentGeneratorPanel token={token} />;
    }

    if (activeTab === "creative_image") {
      return <CreativeImagePanel token={token} />;
    }

    if (activeTab === "campaign_package") {
      return <CampaignPackagePanel token={token} />;
    }

    if (activeTab === "history") {
      return <HistoryCenter token={token} />;
    }

    if (activeTab === "system") {
      return <SystemInfoPanel />;
    }

    return (
      <SettingsPanel
        token={token}
        userName={user?.name || "Usuário"}
        userEmail={user?.email || "email não encontrado"}
      />
    );
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
      <main className="page authLandingPage">
        <div className="gridGlow" />

        <section className="authLandingShell">
          <div className="authLandingGrid">
            <div className="authLandingContent">
              <div className="badge">
                <span className="pulse" />
                AI Affiliate Marketing SaaS
              </div>

              <h1>
                AffiliateAI <span>Pro</span>
              </h1>

              <p className="authLandingSubtitle">
                Uma central inteligente para transformar produtos em campanhas
                completas de afiliados com análise, conteúdo, criativo visual,
                histórico e pacote final pronto para postar.
              </p>

              <div className="authLandingActions">
                <button
                  className="primaryButton"
                  onClick={() => setAuthMode("register")}
                >
                  Criar conta local
                </button>

                <button
                  className="secondaryAuthButton"
                  onClick={() => setAuthMode("login")}
                >
                  Entrar no painel
                </button>
              </div>

              <div className="authLandingStats">
                <div>
                  <strong>6</strong>
                  <span>módulos principais</span>
                </div>

                <div>
                  <strong>4</strong>
                  <span>agentes inteligentes</span>
                </div>

                <div>
                  <strong>1</strong>
                  <span>pacote final</span>
                </div>
              </div>

              <div className="authFeatureGrid">
                <div>
                  <span>01</span>
                  <strong>Autopilot</strong>
                  <p>Cria estratégia, produto, copy, roteiro e checklist.</p>
                </div>

                <div>
                  <span>02</span>
                  <strong>Content Generator</strong>
                  <p>Gera conteúdo pronto para TikTok, Reels, Shorts e WhatsApp.</p>
                </div>

                <div>
                  <span>03</span>
                  <strong>Creative Image</strong>
                  <p>Monta prompt visual, texto da arte e direção 9:16.</p>
                </div>

                <div>
                  <span>04</span>
                  <strong>Campaign Package</strong>
                  <p>Junta tudo em uma entrega final pronta para copiar.</p>
                </div>
              </div>
            </div>

            <div className="authPanel authLandingPanel">
              <div className="panelHeader">
                <span className="dot" />
                {authMode === "login" ? "Acessar painel" : "Criar acesso"}
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
                      ? "Entrar no painel"
                      : "Criar conta"}
                </button>

                {errorMessage && <p className="errorMessage">{errorMessage}</p>}
              </div>

              <div className="authPanelFooter">
                <span>Ambiente local</span>
                <strong>Backend conectado em localhost:8000</strong>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="gridGlow" />

      <section className="hero appHero">
        <div className="topBar">
          <div className="topUserInfo">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>

          <div className="topActions">
            <button
              className={`topSystemButton ${
                activeTab === "system" ? "active" : ""
              }`}
              onClick={() => setActiveTab("system")}
              title="Sistema"
              aria-label="Abrir informações do sistema"
            >
              {renderSystemIcon()}
            </button>

            <button
              className={`topSettingsButton ${
                activeTab === "settings" ? "active" : ""
              }`}
              onClick={() => setActiveTab("settings")}
              title="Configurações"
              aria-label="Abrir configurações"
            >
              {renderSettingsIcon()}
            </button>

            <button className="logoutButton" onClick={logout}>
              Sair
            </button>
          </div>
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

      <section className="workspaceShell">
        <div className="workspaceNav">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            Dashboard
          </button>

          <button
            className={activeTab === "autopilot" ? "active" : ""}
            onClick={() => setActiveTab("autopilot")}
          >
            Autopilot
          </button>

          <button
            className={activeTab === "product_hunter" ? "active" : ""}
            onClick={() => setActiveTab("product_hunter")}
          >
            Product Hunter
          </button>

          <button
            className={activeTab === "content_generator" ? "active" : ""}
            onClick={() => setActiveTab("content_generator")}
          >
            Content Generator
          </button>

          <button
            className={activeTab === "creative_image" ? "active" : ""}
            onClick={() => setActiveTab("creative_image")}
          >
            Creative Image
          </button>

          <button
            className={activeTab === "campaign_package" ? "active" : ""}
            onClick={() => setActiveTab("campaign_package")}
          >
            Campaign Package
          </button>

          <button
            className={activeTab === "history" ? "active" : ""}
            onClick={() => setActiveTab("history")}
          >
            Histórico
          </button>
        </div>
      </section>

      {renderTabContent()}
    </main>
  );
}