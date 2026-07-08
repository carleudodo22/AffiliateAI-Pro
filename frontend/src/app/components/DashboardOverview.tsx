"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AnyData = Record<string, any>;

type UserPreferences = {
  defaultNiche?: string;
  defaultChannel?: string;
  defaultCampaignStyle?: string;
  defaultBudgetStyle?: string;
  defaultMarketplace?: string;
  language?: string;
};

type UserSettingsApiResponse = {
  default_niche: string;
  default_channel: string;
  default_campaign_style: string;
  default_budget_style: string;
  default_marketplace: string;
  language: string;
};

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  createdAt?: string;
  score?: string;
};

export default function DashboardOverview() {
  const [autopilotHistory, setAutopilotHistory] = useState<AnyData[]>([]);
  const [productHunterHistory, setProductHunterHistory] = useState<AnyData[]>([]);
  const [contentHistory, setContentHistory] = useState<AnyData[]>([]);
  const [creativeHistory, setCreativeHistory] = useState<AnyData[]>([]);
  const [packageHistory, setPackageHistory] = useState<AnyData[]>([]);

  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastSync, setLastSync] = useState("");

  useEffect(() => {
    loadDashboardData();

    window.addEventListener("autopilot-history-updated", loadDashboardData);
    window.addEventListener("product-hunter-history-updated", loadDashboardData);
    window.addEventListener("content-generator-history-updated", loadDashboardData);
    window.addEventListener("creative-image-history-updated", loadDashboardData);
    window.addEventListener("campaign-package-history-updated", loadDashboardData);

    return () => {
      window.removeEventListener("autopilot-history-updated", loadDashboardData);
      window.removeEventListener("product-hunter-history-updated", loadDashboardData);
      window.removeEventListener("content-generator-history-updated", loadDashboardData);
      window.removeEventListener("creative-image-history-updated", loadDashboardData);
      window.removeEventListener("campaign-package-history-updated", loadDashboardData);
    };
  }, []);

  function getToken() {
    return localStorage.getItem("affiliateai_token") || "";
  }

  function formatDate(value?: string) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  async function fetchHistory(endpoint: string) {
    const token = getToken();

    if (!token) {
      return [];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return [];
    }

    return data;
  }

  async function loadUserSettings() {
    const token = getToken();

    if (!token) {
      loadLocalPreferences();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        loadLocalPreferences();
        return;
      }

      const data: UserSettingsApiResponse = await response.json();

      const mappedPreferences: UserPreferences = {
        defaultNiche: data.default_niche,
        defaultChannel: data.default_channel,
        defaultCampaignStyle: data.default_campaign_style,
        defaultBudgetStyle: data.default_budget_style,
        defaultMarketplace: data.default_marketplace,
        language: data.language,
      };

      setPreferences(mappedPreferences);
      localStorage.setItem(
        "affiliateai_preferences",
        JSON.stringify(mappedPreferences)
      );
    } catch {
      loadLocalPreferences();
    }
  }

  function loadLocalPreferences() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
      setPreferences(null);
      return;
    }

    try {
      setPreferences(JSON.parse(savedPreferences));
    } catch {
      setPreferences(null);
    }
  }

  async function loadDashboardData() {
    setLoading(true);
    setErrorMessage("");

    try {
      const [
        autopilotData,
        productHunterData,
        contentData,
        creativeData,
        packageData,
      ] = await Promise.all([
        fetchHistory("/api/autopilot/history"),
        fetchHistory("/api/product-hunter/history"),
        fetchHistory("/api/content-generator/history"),
        fetchHistory("/api/creative-image/history"),
        fetchHistory("/api/campaign-package/history"),
      ]);

      setAutopilotHistory(autopilotData);
      setProductHunterHistory(productHunterData);
      setContentHistory(contentData);
      setCreativeHistory(creativeData);
      setPackageHistory(packageData);

      await loadUserSettings();
      setLastSync(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar Dashboard.");
      }
    } finally {
      setLoading(false);
    }
  }

  function getNumericScore(item: AnyData) {
    const score =
      item?.score?.final_score ??
      item?.analysis?.score?.final_score ??
      item?.final_score ??
      item?.score;

    const parsedScore = Number(score);

    if (Number.isNaN(parsedScore)) {
      return null;
    }

    return parsedScore;
  }

  const dashboardStats = useMemo(() => {
    const totalAutopilot = autopilotHistory.length;
    const totalProducts = productHunterHistory.length;
    const totalContents = contentHistory.length;
    const totalCreatives = creativeHistory.length;
    const totalPackages = packageHistory.length;

    const totalActions =
      totalAutopilot +
      totalProducts +
      totalContents +
      totalCreatives +
      totalPackages;

    const scoreItems = [
      ...autopilotHistory,
      ...productHunterHistory,
      ...packageHistory,
    ]
      .map(getNumericScore)
      .filter((score): score is number => typeof score === "number");

    const averageScore =
      scoreItems.length > 0
        ? Math.round(
            scoreItems.reduce((sum, score) => sum + score, 0) / scoreItems.length
          )
        : 0;

    const scoredProducts = [
      ...autopilotHistory.map((item) => ({
        name: item.selected_product || "Campanha Autopilot",
        score: getNumericScore(item) || 0,
      })),
      ...productHunterHistory.map((item) => ({
        name: item.product_name || item.selected_product || "Produto analisado",
        score: getNumericScore(item) || 0,
      })),
      ...packageHistory.map((item) => ({
        name: item.product_name || "Pacote salvo",
        score: getNumericScore(item) || 0,
      })),
    ];

    const bestProduct = scoredProducts.sort((a, b) => b.score - a.score)[0];

    const channels = [
      ...autopilotHistory.map((item) => item.main_channel),
      ...productHunterHistory.map(
        (item) => item.traffic_channel || item.main_channel
      ),
      ...contentHistory.map((item) => item.platform),
      ...creativeHistory.map((item) => item.platform),
    ].filter(Boolean);

    const channelCount = channels.reduce<Record<string, number>>((acc, channel) => {
      acc[channel] = (acc[channel] || 0) + 1;
      return acc;
    }, {});

    const mainChannel =
      Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      preferences?.defaultChannel ||
      "Não definido";

    return {
      totalAutopilot,
      totalProducts,
      totalContents,
      totalCreatives,
      totalPackages,
      totalActions,
      averageScore,
      bestProduct: bestProduct?.name || "Nenhum produto ainda",
      bestProductScore: bestProduct?.score || 0,
      mainChannel,
    };
  }, [
    autopilotHistory,
    productHunterHistory,
    contentHistory,
    creativeHistory,
    packageHistory,
    preferences,
  ]);

  const latestAutopilot = autopilotHistory[0];
  const latestProduct = productHunterHistory[0];
  const latestContent = contentHistory[0];
  const latestCreative = creativeHistory[0];
  const latestPackage = packageHistory[0];

  const recentActivities = useMemo<ActivityItem[]>(() => {
    const all: ActivityItem[] = [
      ...autopilotHistory.slice(0, 5).map((item) => ({
        id: `autopilot-${item.id}`,
        type: "Autopilot",
        title: item.selected_product || "Campanha Autopilot",
        subtitle: `${item.niche || "Nicho"} • ${item.main_channel || "Canal"}`,
        createdAt: item.created_at,
        score: item.score ? `${item.score}/100` : undefined,
      })),
      ...productHunterHistory.slice(0, 5).map((item) => ({
        id: `product-${item.id}`,
        type: "Product Hunter",
        title: item.product_name || item.selected_product || "Produto analisado",
        subtitle: `${item.marketplace || "Marketplace"} • ${
          item.traffic_channel || item.main_channel || "Canal"
        }`,
        createdAt: item.created_at,
        score:
          item.score || item.final_score
            ? `${item.score || item.final_score}/100`
            : undefined,
      })),
      ...contentHistory.slice(0, 5).map((item) => ({
        id: `content-${item.id}`,
        type: "Content Generator",
        title: item.product_name || "Conteúdo gerado",
        subtitle: `${item.platform || "Plataforma"} • ${item.tone || "Tom"}`,
        createdAt: item.created_at,
      })),
      ...creativeHistory.slice(0, 5).map((item) => ({
        id: `creative-${item.id}`,
        type: "Creative Image",
        title: item.product_name || "Criativo visual",
        subtitle: `${item.platform || "Plataforma"} • ${
          item.creative_style || "Estilo"
        }`,
        createdAt: item.created_at,
      })),
      ...packageHistory.slice(0, 5).map((item) => ({
        id: `package-${item.id}`,
        type: "Campaign Package",
        title: item.product_name || "Pacote final salvo",
        subtitle: `${item.niche || "Nicho"} • ${item.marketplace || "Marketplace"}`,
        createdAt: item.created_at,
        score: item.score ? `${item.score}/100` : undefined,
      })),
    ];

    return all
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 8);
  }, [
    autopilotHistory,
    productHunterHistory,
    contentHistory,
    creativeHistory,
    packageHistory,
  ]);

  const modules = [
    {
      name: "Autopilot",
      status: dashboardStats.totalAutopilot > 0 ? "Ativo" : "Pronto",
      description: "Estratégia e campanha",
      active: dashboardStats.totalAutopilot > 0,
    },
    {
      name: "Product Hunter",
      status: dashboardStats.totalProducts > 0 ? "Ativo" : "Pronto",
      description: "Análise de produto",
      active: dashboardStats.totalProducts > 0,
    },
    {
      name: "Content Generator",
      status: dashboardStats.totalContents > 0 ? "Ativo" : "Pronto",
      description: "Copy e roteiro",
      active: dashboardStats.totalContents > 0,
    },
    {
      name: "Creative Image",
      status: dashboardStats.totalCreatives > 0 ? "Ativo" : "Pronto",
      description: "Prompt visual",
      active: dashboardStats.totalCreatives > 0,
    },
    {
      name: "Campaign Package",
      status: dashboardStats.totalPackages > 0 ? "Ativo" : "Pronto",
      description: "Pacote final salvo",
      active: dashboardStats.totalPackages > 0,
    },
  ];

  return (
    <section className="dashboardPro">
      <div className="dashboardPro__hero">
        <div className="dashboardPro__heroContent">
          <span className="dashboardPro__eyebrow">Dashboard Executivo</span>
          <h2>Visão Geral do AffiliateAI Pro</h2>
          <p>
            Acompanhe a operação completa do sistema com métricas, últimas ações,
            oportunidades e status dos módulos em um painel mais limpo e
            profissional.
          </p>
        </div>

        <div className="dashboardPro__statusCard">
          <span>Status do sistema</span>
          <strong>{loading ? "Atualizando..." : "Online"}</strong>
          <small>Backend local conectado</small>
          <div className="dashboardPro__statusMeta">
            <div>
              <label>Última sincronização</label>
              <p>{lastSync || "--:--:--"}</p>
            </div>
            <div>
              <label>Ambiente</label>
              <p>Local / Docker</p>
            </div>
          </div>
        </div>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      <div className="dashboardPro__topStats">
        <div className="dashboardPro__statCard">
          <span>Ações totais</span>
          <strong>{dashboardStats.totalActions}</strong>
          <p>Soma de tudo que o sistema já gerou.</p>
        </div>

        <div className="dashboardPro__statCard">
          <span>Campanhas</span>
          <strong>{dashboardStats.totalAutopilot}</strong>
          <p>Execuções do Autopilot.</p>
        </div>

        <div className="dashboardPro__statCard">
          <span>Produtos</span>
          <strong>{dashboardStats.totalProducts}</strong>
          <p>Análises do Product Hunter.</p>
        </div>

        <div className="dashboardPro__statCard">
          <span>Conteúdos</span>
          <strong>{dashboardStats.totalContents}</strong>
          <p>Textos e roteiros gerados.</p>
        </div>

        <div className="dashboardPro__statCard">
          <span>Criativos</span>
          <strong>{dashboardStats.totalCreatives}</strong>
          <p>Briefings e prompts visuais.</p>
        </div>

        <div className="dashboardPro__statCard dashboardPro__statCard--highlight">
          <span>Pacotes finais</span>
          <strong>{dashboardStats.totalPackages}</strong>
          <p>Campaign Packages salvos no banco.</p>
        </div>
      </div>

      <div className="dashboardPro__mainGrid">
        <div className="dashboardPro__spotlightCard">
          <div className="dashboardPro__cardHeader">
            <span>Resumo estratégico</span>
            <button onClick={loadDashboardData} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar dados"}
            </button>
          </div>

          <div className="dashboardPro__spotlightMetric">
            <div>
              <label>Melhor oportunidade</label>
              <h3>{dashboardStats.bestProduct}</h3>
              <p>
                Score atual:{" "}
                {dashboardStats.bestProductScore
                  ? `${dashboardStats.bestProductScore}/100`
                  : "--"}
              </p>
            </div>

            <div className="dashboardPro__scoreBubble">
              <span>Score médio</span>
              <strong>{dashboardStats.averageScore || "--"}</strong>
            </div>
          </div>

          <div className="dashboardPro__summaryGrid">
            <div>
              <span>Canal principal</span>
              <strong>{dashboardStats.mainChannel}</strong>
            </div>
            <div>
              <span>Pacotes salvos</span>
              <strong>{dashboardStats.totalPackages}</strong>
            </div>
            <div>
              <span>Módulos ativos</span>
              <strong>{modules.filter((item) => item.active).length}/5</strong>
            </div>
            <div>
              <span>Conteúdos prontos</span>
              <strong>{dashboardStats.totalContents}</strong>
            </div>
          </div>
        </div>

        <div className="dashboardPro__sideColumn">
          <div className="dashboardPro__infoCard">
            <span>Preferências do usuário</span>
            <h3>{preferences ? "Configuradas" : "Não configuradas"}</h3>
            <ul>
              <li>
                <strong>Nicho:</strong> {preferences?.defaultNiche || "Não definido"}
              </li>
              <li>
                <strong>Canal:</strong> {preferences?.defaultChannel || "Não definido"}
              </li>
              <li>
                <strong>Marketplace:</strong>{" "}
                {preferences?.defaultMarketplace || "Não definido"}
              </li>
              <li>
                <strong>Estilo:</strong>{" "}
                {preferences?.defaultCampaignStyle || "Não definido"}
              </li>
            </ul>
          </div>

          <div className="dashboardPro__infoCard dashboardPro__infoCard--highlight">
            <span>Último pacote final</span>
            <h3>{latestPackage?.product_name || "Nenhum pacote salvo"}</h3>
            <p>
              {latestPackage
                ? `${latestPackage.niche || "nicho"} • ${
                    latestPackage.score || "--"
                  }/100`
                : "Salve um Campaign Package para exibir aqui."}
            </p>
            <small>
              {latestPackage ? formatDate(latestPackage.created_at) : "Sem registros"}
            </small>
          </div>
        </div>
      </div>

      <div className="dashboardPro__bottomGrid">
        <div className="dashboardPro__activityCard">
          <div className="dashboardPro__cardTitle">
            <div>
              <span>Timeline</span>
              <h3>Últimas atividades</h3>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <div className="dashboardPro__empty">
              Nenhuma atividade registrada ainda.
            </div>
          ) : (
            <div className="dashboardPro__activityList">
              {recentActivities.map((item) => (
                <div key={item.id} className="dashboardPro__activityItem">
                  <div className="dashboardPro__activityBadge">{item.type}</div>
                  <div className="dashboardPro__activityBody">
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                    <small>{formatDate(item.createdAt)}</small>
                  </div>
                  <div className="dashboardPro__activityScore">
                    {item.score || "--"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="dashboardPro__latestCard">
          <div className="dashboardPro__cardTitle">
            <div>
              <span>Produção recente</span>
              <h3>Últimos resultados por módulo</h3>
            </div>
          </div>

          <div className="dashboardPro__latestGrid">
            <div className="dashboardPro__miniCard">
              <span>Autopilot</span>
              <strong>{latestAutopilot?.selected_product || "Sem campanha"}</strong>
              <p>
                {latestAutopilot
                  ? `${latestAutopilot.niche || "nicho"} • ${
                      latestAutopilot.score || "--"
                    }/100`
                  : "Ainda sem execução"}
              </p>
            </div>

            <div className="dashboardPro__miniCard">
              <span>Product Hunter</span>
              <strong>
                {latestProduct?.product_name ||
                  latestProduct?.selected_product ||
                  "Sem análise"}
              </strong>
              <p>
                {latestProduct
                  ? `${latestProduct.marketplace || "marketplace"} • ${
                      latestProduct.score || latestProduct.final_score || "--"
                    }/100`
                  : "Ainda sem análise"}
              </p>
            </div>

            <div className="dashboardPro__miniCard">
              <span>Content Generator</span>
              <strong>{latestContent?.product_name || "Sem conteúdo"}</strong>
              <p>
                {latestContent
                  ? `${latestContent.platform || "plataforma"} • ${
                      latestContent.tone || "tom"
                    }`
                  : "Ainda sem conteúdo"}
              </p>
            </div>

            <div className="dashboardPro__miniCard">
              <span>Creative Image</span>
              <strong>{latestCreative?.product_name || "Sem criativo"}</strong>
              <p>
                {latestCreative
                  ? `${latestCreative.platform || "plataforma"} • ${
                      latestCreative.creative_style || "estilo"
                    }`
                  : "Ainda sem criativo"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboardPro__modulesCard">
        <div className="dashboardPro__cardTitle">
          <div>
            <span>Módulos</span>
            <h3>Status operacional</h3>
          </div>
        </div>

        <div className="dashboardPro__modulesGrid">
          {modules.map((module) => (
            <div
              key={module.name}
              className={`dashboardPro__moduleItem ${
                module.active ? "is-active" : ""
              }`}
            >
              <span>{module.name}</span>
              <strong>{module.status}</strong>
              <p>{module.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}