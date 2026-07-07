"use client";

import { useEffect, useState } from "react";
import ContentGeneratorPanel from "./components/ContentGeneratorPanel";

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

type ProductHunterResponse = {
  id: number | null;
  agent: string;
  niche: string;
  product_name: string;
  marketplace: string;
  decision: string;
  score: {
    demand_score: number;
    virality_score: number;
    profit_score: number;
    competition_score: number;
    saturation_risk: number;
    final_score: number;
  };
  strategy: {
    positioning: string;
    sales_angle: string;
    content_ideas: string[];
    offer_structure: string;
    recommended_channels: string[];
    warnings: string[];
  };
};

type HistoryItem = {
  id: number;
  niche: string;
  product_name: string;
  marketplace: string;
  main_channel: string;
  decision: string;
  final_score: number;
  created_at: string;
};

type DashboardAnalysisSummary = {
  id: number;
  product_name: string;
  niche: string;
  marketplace: string;
  decision: string;
  final_score: number;
  created_at: string;
};

type DashboardMetrics = {
  total_analyses: number;
  average_score: number;
  good_opportunities: number;
  best_opportunity: DashboardAnalysisSummary | null;
  last_analysis: DashboardAnalysisSummary | null;
};

export default function Home() {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [token, setToken] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [authName, setAuthName] = useState("Kauet");
  const [authEmail, setAuthEmail] = useState("teste456@email.com");
  const [authPassword, setAuthPassword] = useState("123456");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [niche, setNiche] = useState("beleza");
  const [productName, setProductName] = useState("escova secadora");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );
  const [marketplace, setMarketplace] = useState("shopee");
  const [mainChannel, setMainChannel] = useState("tiktok");
  const [averagePrice, setAveragePrice] = useState("119.90");
  const [commissionPercent, setCommissionPercent] = useState("12");
  const [estimatedCompetition, setEstimatedCompetition] = useState("58");
  const [trendSignal, setTrendSignal] = useState("82");

  const [result, setResult] = useState<ProductHunterResponse | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openingAnalysisId, setOpeningAnalysisId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function register() {
    setAuthLoading(true);
    setAuthError("");

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
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data: AuthResponse = await response.json();

      localStorage.setItem("affiliateai_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);

      await Promise.all([
        loadHistory(data.access_token),
        loadDashboard(data.access_token),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Erro ao cadastrar usuário.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function login() {
    setAuthLoading(true);
    setAuthError("");

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
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data: AuthResponse = await response.json();

      localStorage.setItem("affiliateai_token", data.access_token);
      setToken(data.access_token);
      setUser(data.user);

      await Promise.all([
        loadHistory(data.access_token),
        loadDashboard(data.access_token),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Erro ao fazer login.");
      }
    } finally {
      setAuthLoading(false);
    }
  }

  async function loadCurrentUser(savedToken: string) {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${savedToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Sessão inválida.");
      }

      const data: User = await response.json();

      setToken(savedToken);
      setUser(data);

      await Promise.all([
        loadHistory(savedToken),
        loadDashboard(savedToken),
      ]);
    } catch {
      localStorage.removeItem("affiliateai_token");
      setToken("");
      setUser(null);
      setDashboard(null);
    }
  }

  function logout() {
    localStorage.removeItem("affiliateai_token");
    setToken("");
    setUser(null);
    setResult(null);
    setHistory([]);
    setDashboard(null);
  }

  async function loadDashboard(authToken?: string) {
    const activeToken = authToken || token;

    if (!activeToken) {
      setDashboard(null);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/dashboard/metrics`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar dashboard.");
      }

      const data: DashboardMetrics = await response.json();
      setDashboard(data);
    } catch {
      setDashboard(null);
    }
  }

  async function loadHistory(authToken?: string) {
    setLoadingHistory(true);

    const activeToken = authToken || token;

    if (!activeToken) {
      setHistory([]);
      setLoadingHistory(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/product-hunter/history`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar histórico.");
      }

      const data: HistoryItem[] = await response.json();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function openAnalysisDetails(analysisId: number) {
    setOpeningAnalysisId(analysisId);
    setErrorMessage("");

    try {
      const response = await fetch(
        `${API_URL}/api/product-hunter/history/${analysisId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondeu erro ${response.status}: ${errorText}`);
      }

      const data: ProductHunterResponse = await response.json();

      setResult(data);
      setNiche(data.niche);
      setProductName(data.product_name);
      setMarketplace(data.marketplace);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro desconhecido ao abrir análise.");
      }
    } finally {
      setOpeningAnalysisId(null);
    }
  }

  async function analyzeProduct() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/product-hunter/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          niche,
          product_name: productName,
          target_audience: targetAudience,
          marketplace,
          main_channel: mainChannel,
          average_price: Number(averagePrice),
          commission_percent: Number(commissionPercent),
          estimated_competition: Number(estimatedCompetition),
          trend_signal: Number(trendSignal),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondeu erro ${response.status}: ${errorText}`);
      }

      const data: ProductHunterResponse = await response.json();
      setResult(data);

      await Promise.all([
        loadHistory(token),
        loadDashboard(token),
      ]);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro desconhecido ao conectar com o backend.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = localStorage.getItem("affiliateai_token");

    if (savedToken) {
      loadCurrentUser(savedToken);
    }
  }, []);

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
            Entre na sua conta para acessar o painel inteligente de análise de
            oportunidades para afiliados.
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
                {authLoading
                  ? "Processando..."
                  : authMode === "login"
                    ? "Entrar"
                    : "Criar conta"}
              </button>

              {authError && <p className="errorMessage">{authError}</p>}
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
          AI Affiliate Marketing SaaS
        </div>

        <h1>
          AffiliateAI <span>Pro</span>
        </h1>

        <p className="subtitle">
          Descubra produtos, analise oportunidades e gere estratégias de venda
          com agentes inteligentes para marketing de afiliados.
        </p>

        <section className="metricsGrid">
          <article className="metricCard">
            <span>Total de análises</span>
            <strong>{dashboard?.total_analyses ?? 0}</strong>
            <small>Análises feitas na sua conta</small>
          </article>

          <article className="metricCard">
            <span>Score médio</span>
            <strong>{dashboard?.average_score ?? 0}</strong>
            <small>Média das oportunidades analisadas</small>
          </article>

          <article className="metricCard">
            <span>Boas oportunidades</span>
            <strong>{dashboard?.good_opportunities ?? 0}</strong>
            <small>Produtos com score acima de 70</small>
          </article>

          <article className="metricCard">
            <span>Melhor oportunidade</span>
            <strong className="metricText">
              {dashboard?.best_opportunity?.product_name ?? "Nenhuma"}
            </strong>
            <small>
              {dashboard?.best_opportunity
                ? `Score ${dashboard.best_opportunity.final_score}`
                : "Faça uma análise para descobrir"}
            </small>
          </article>

          <article className="metricCard wide">
            <span>Última análise</span>
            <strong className="metricText">
              {dashboard?.last_analysis?.product_name ?? "Nenhuma análise ainda"}
            </strong>
            <small>
              {dashboard?.last_analysis
                ? `${dashboard.last_analysis.decision} · Score ${dashboard.last_analysis.final_score}`
                : "Seu histórico aparecerá aqui"}
            </small>
          </article>
        </section>

        <div className="productHunterLayout">
          <section className="formPanel">
            <div className="panelHeader">
              <span className="dot" />
              Product Hunter Agent
            </div>

            <div className="formGrid">
              <label>
                Nicho
                <input
                  value={niche}
                  onChange={(event) => setNiche(event.target.value)}
                />
              </label>

              <label>
                Produto
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                />
              </label>

              <label className="full">
                Público-alvo
                <input
                  value={targetAudience}
                  onChange={(event) => setTargetAudience(event.target.value)}
                />
              </label>

              <label>
                Marketplace
                <select
                  value={marketplace}
                  onChange={(event) => setMarketplace(event.target.value)}
                >
                  <option value="shopee">Shopee</option>
                  <option value="mercado_livre">Mercado Livre</option>
                  <option value="amazon">Amazon</option>
                  <option value="hotmart">Hotmart</option>
                  <option value="kiwify">Kiwify</option>
                  <option value="monetizze">Monetizze</option>
                  <option value="generic">Genérico</option>
                </select>
              </label>

              <label>
                Canal principal
                <select
                  value={mainChannel}
                  onChange={(event) => setMainChannel(event.target.value)}
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                  <option value="youtube_shorts">YouTube Shorts</option>
                  <option value="google">Google</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="pinterest">Pinterest</option>
                </select>
              </label>

              <label>
                Preço médio
                <input
                  type="number"
                  value={averagePrice}
                  onChange={(event) => setAveragePrice(event.target.value)}
                />
              </label>

              <label>
                Comissão %
                <input
                  type="number"
                  value={commissionPercent}
                  onChange={(event) => setCommissionPercent(event.target.value)}
                />
              </label>

              <label>
                Concorrência 0-100
                <input
                  type="number"
                  value={estimatedCompetition}
                  onChange={(event) => setEstimatedCompetition(event.target.value)}
                />
              </label>

              <label>
                Tendência 0-100
                <input
                  type="number"
                  value={trendSignal}
                  onChange={(event) => setTrendSignal(event.target.value)}
                />
              </label>
            </div>

            <button className="primaryButton analyzeButton" onClick={analyzeProduct}>
              {loading ? "Analisando..." : "Analisar oportunidade"}
            </button>

            {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          </section>

          <section className="resultPanel">
            <div className="panelHeader">
              <span className="dot" />
              Resultado da Análise
            </div>

            {!result && (
              <div className="emptyState">
                <p>
                  Preencha os dados do produto e clique em analisar para gerar a
                  estratégia.
                </p>
              </div>
            )}

            {result && (
              <div className="resultContent">
                <div className="scoreCircle">
                  <span>{result.score.final_score}</span>
                  <small>/100</small>
                </div>

                <h2>{result.decision}</h2>

                <p className="resultProduct">
                  #{result.id} · {result.product_name} · {result.marketplace}
                </p>

                <div className="scoreGrid">
                  <div>
                    <strong>{result.score.demand_score}</strong>
                    <span>Demanda</span>
                  </div>

                  <div>
                    <strong>{result.score.virality_score}</strong>
                    <span>Viralização</span>
                  </div>

                  <div>
                    <strong>{result.score.profit_score}</strong>
                    <span>Lucro</span>
                  </div>

                  <div>
                    <strong>{result.score.competition_score}</strong>
                    <span>Concorrência</span>
                  </div>
                </div>

                <div className="strategyBlock">
                  <h3>Posicionamento</h3>
                  <p>{result.strategy.positioning}</p>
                </div>

                <div className="strategyBlock">
                  <h3>Ângulo de venda</h3>
                  <p>{result.strategy.sales_angle}</p>
                </div>

                <div className="strategyBlock">
                  <h3>Ideias de conteúdo</h3>
                  <ul>
                    {result.strategy.content_ideas.map((idea) => (
                      <li key={idea}>{idea}</li>
                    ))}
                  </ul>
                </div>

                <div className="strategyBlock">
                  <h3>Alertas</h3>
                  <ul>
                    {result.strategy.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>

        <ContentGeneratorPanel
          token={token}
          productName={productName}
          niche={niche}
          targetAudience={targetAudience}
          marketplace={marketplace}
          mainChannel={mainChannel}
          analysisId={result?.id ?? null}
        />

        <section className="historyPanel">
          <div className="panelHeader">
            <span className="dot" />
            Histórico de Análises
          </div>

          {loadingHistory && <p className="historyEmpty">Carregando histórico...</p>}

          {!loadingHistory && history.length === 0 && (
            <p className="historyEmpty">
              Nenhuma análise salva ainda. Faça uma análise para iniciar o histórico.
            </p>
          )}

          {!loadingHistory && history.length > 0 && (
            <div className="historyList">
              {history.map((item) => (
                <article className="historyCard" key={item.id}>
                  <div>
                    <strong>
                      #{item.id} · {item.product_name}
                    </strong>

                    <span>
                      {item.niche} · {item.marketplace} · {item.main_channel}
                    </span>
                  </div>

                  <div className="historyActions">
                    <div className="historyScore">
                      <strong>{item.final_score}</strong>
                      <span>{item.decision}</span>
                    </div>

                    <button onClick={() => openAnalysisDetails(item.id)}>
                      {openingAnalysisId === item.id ? "Abrindo..." : "Abrir"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}