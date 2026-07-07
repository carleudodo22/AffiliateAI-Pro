"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AutopilotHistoryItem = {
  id: number;
  niche: string;
  selected_product: string;
  marketplace: string;
  score: number;
  decision: string;
  main_channel: string;
  campaign_style: string;
  status: string;
  created_at: string;
};

type ContentGeneratorHistoryItem = {
  id: number;
  product_name: string;
  niche: string;
  platform: string;
  tone: string;
  objective: string;
  headline: string;
  status: string;
  created_at: string;
};

type CreativeImageHistoryItem = {
  id: number;
  product_name: string;
  niche: string;
  platform: string;
  creative_style: string;
  objective: string;
  art_headline: string;
  status: string;
  created_at: string;
};

type ProductHunterHistoryItem = Record<string, any>;

type UserPreferences = {
  defaultNiche?: string;
  defaultChannel?: string;
  defaultCampaignStyle?: string;
  defaultBudgetStyle?: string;
  defaultMarketplace?: string;
  language?: string;
};

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultNiche: "beleza",
  defaultChannel: "tiktok",
  defaultCampaignStyle: "viral",
  defaultBudgetStyle: "organico",
  defaultMarketplace: "shopee",
  language: "pt-BR",
};

export default function DashboardOverview() {
  const [autopilotHistory, setAutopilotHistory] = useState<
    AutopilotHistoryItem[]
  >([]);

  const [productHunterHistory, setProductHunterHistory] = useState<
    ProductHunterHistoryItem[]
  >([]);

  const [contentHistory, setContentHistory] = useState<
    ContentGeneratorHistoryItem[]
  >([]);

  const [creativeImageHistory, setCreativeImageHistory] = useState<
    CreativeImageHistoryItem[]
  >([]);

  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    function refreshDashboard() {
      loadDashboard();
    }

    window.addEventListener("autopilot-history-updated", refreshDashboard);
    window.addEventListener("product-hunter-history-updated", refreshDashboard);
    window.addEventListener("content-generator-history-updated", refreshDashboard);
    window.addEventListener("creative-image-history-updated", refreshDashboard);

    return () => {
      window.removeEventListener("autopilot-history-updated", refreshDashboard);
      window.removeEventListener(
        "product-hunter-history-updated",
        refreshDashboard
      );
      window.removeEventListener(
        "content-generator-history-updated",
        refreshDashboard
      );
      window.removeEventListener(
        "creative-image-history-updated",
        refreshDashboard
      );
    };
  }, []);

  function getToken() {
    return localStorage.getItem("affiliateai_token") || "";
  }

  function loadPreferences() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    try {
      const parsedPreferences = JSON.parse(
        savedPreferences
      ) as UserPreferences;

      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...parsedPreferences,
      });
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }

  async function loadDashboard() {
    setLoading(true);
    loadPreferences();

    try {
      const token = getToken();

      if (!token) {
        setAutopilotHistory([]);
        setProductHunterHistory([]);
        setContentHistory([]);
        setCreativeImageHistory([]);
        return;
      }

      const requestHeaders = {
        Authorization: `Bearer ${token}`,
      };

      const [
        autopilotResponse,
        productHunterResponse,
        contentResponse,
        creativeImageResponse,
      ] = await Promise.allSettled([
        fetch(`${API_URL}/api/autopilot/history`, {
          headers: requestHeaders,
        }),
        fetch(`${API_URL}/api/product-hunter/history`, {
          headers: requestHeaders,
        }),
        fetch(`${API_URL}/api/content-generator/history`, {
          headers: requestHeaders,
        }),
        fetch(`${API_URL}/api/creative-image/history`, {
          headers: requestHeaders,
        }),
      ]);

      if (
        autopilotResponse.status === "fulfilled" &&
        autopilotResponse.value.ok
      ) {
        const autopilotData = await autopilotResponse.value.json();
        setAutopilotHistory(Array.isArray(autopilotData) ? autopilotData : []);
      } else {
        setAutopilotHistory([]);
      }

      if (
        productHunterResponse.status === "fulfilled" &&
        productHunterResponse.value.ok
      ) {
        const productHunterData = await productHunterResponse.value.json();
        setProductHunterHistory(
          Array.isArray(productHunterData) ? productHunterData : []
        );
      } else {
        setProductHunterHistory([]);
      }

      if (contentResponse.status === "fulfilled" && contentResponse.value.ok) {
        const contentData = await contentResponse.value.json();
        setContentHistory(Array.isArray(contentData) ? contentData : []);
      } else {
        setContentHistory([]);
      }

      if (
        creativeImageResponse.status === "fulfilled" &&
        creativeImageResponse.value.ok
      ) {
        const creativeImageData = await creativeImageResponse.value.json();

        setCreativeImageHistory(
          Array.isArray(creativeImageData) ? creativeImageData : []
        );
      } else {
        setCreativeImageHistory([]);
      }
    } catch {
      setAutopilotHistory([]);
      setProductHunterHistory([]);
      setContentHistory([]);
      setCreativeImageHistory([]);
    } finally {
      setLoading(false);
    }
  }

  function formatChannel(channel?: string) {
    const channels: Record<string, string> = {
      tiktok: "TikTok",
      instagram: "Instagram",
      youtube_shorts: "YouTube Shorts",
      whatsapp: "WhatsApp",
      pinterest: "Pinterest",
      google: "Google",
      facebook_ads: "Facebook Ads",
    };

    return channels[channel || ""] || channel || "Nenhum";
  }

  function formatMarketplace(marketplace?: string) {
    const marketplaces: Record<string, string> = {
      shopee: "Shopee",
      mercado_livre: "Mercado Livre",
      amazon: "Amazon",
      hotmart: "Hotmart",
      kiwify: "Kiwify",
      monetizze: "Monetizze",
    };

    return marketplaces[marketplace || ""] || marketplace || "Nenhum";
  }

  function formatStyle(style?: string) {
    const styles: Record<string, string> = {
      viral: "Viral",
      direto: "Direto",
      premium: "Premium",
      popular: "Popular",
      emocional: "Emocional",
      agressivo: "Agressivo",
      minimalista: "Minimalista",
    };

    return styles[style || ""] || style || "Nenhum";
  }

  function formatDate(date?: string) {
    if (!date) {
      return "Sem data";
    }

    return new Date(date).toLocaleString("pt-BR");
  }

  const metrics = useMemo(() => {
    const totalCampaigns = autopilotHistory.length;
    const totalProductAnalyses = productHunterHistory.length;
    const totalContents = contentHistory.length;
    const totalCreativeImages = creativeImageHistory.length;

    const averageScore =
      totalCampaigns > 0
        ? Math.round(
            autopilotHistory.reduce((total, item) => total + item.score, 0) /
              totalCampaigns
          )
        : 0;

    const bestCampaign =
      autopilotHistory.length > 0
        ? [...autopilotHistory].sort((a, b) => b.score - a.score)[0]
        : null;

    const lastCampaign =
      autopilotHistory.length > 0 ? autopilotHistory[0] : null;

    const lastContent = contentHistory.length > 0 ? contentHistory[0] : null;

    const lastCreativeImage =
      creativeImageHistory.length > 0 ? creativeImageHistory[0] : null;

    const lastProductAnalysis =
      productHunterHistory.length > 0 ? productHunterHistory[0] : null;

    const channelCount: Record<string, number> = {};

    for (const item of autopilotHistory) {
      channelCount[item.main_channel] =
        (channelCount[item.main_channel] || 0) + 1;
    }

    for (const item of contentHistory) {
      channelCount[item.platform] = (channelCount[item.platform] || 0) + 1;
    }

    for (const item of creativeImageHistory) {
      channelCount[item.platform] = (channelCount[item.platform] || 0) + 1;
    }

    const topChannel =
      Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      preferences.defaultChannel ||
      "Nenhum";

    const totalActions =
      totalCampaigns +
      totalProductAnalyses +
      totalContents +
      totalCreativeImages;

    return {
      totalCampaigns,
      totalProductAnalyses,
      totalContents,
      totalCreativeImages,
      totalActions,
      averageScore,
      bestCampaign,
      lastCampaign,
      lastContent,
      lastCreativeImage,
      lastProductAnalysis,
      topChannel,
    };
  }, [
    autopilotHistory,
    productHunterHistory,
    contentHistory,
    creativeImageHistory,
    preferences,
  ]);

  return (
    <section className="dashboardPanel">
      <div className="dashboardCommandHeader">
        <div>
          <span className="dashboardEyebrow">Central de comando</span>

          <h2>Dashboard AffiliateAI Pro</h2>

          <p>
            Acompanhe campanhas, análises, conteúdos, criativos visuais,
            preferências salvas e status dos agentes principais do seu SaaS de
            afiliados.
          </p>
        </div>

        <div className="dashboardCommandStatus">
          <span>Status geral</span>
          <strong>{loading ? "Atualizando" : "Operacional"}</strong>
          <p>Backend, banco, histórico e agentes conectados.</p>
        </div>
      </div>

      <div className="dashboardMetrics">
        <div className="dashboardCard highlight">
          <span>Campanhas criadas</span>
          <strong>{metrics.totalCampaigns}</strong>
          <small>Autopilot salvo no banco</small>
        </div>

        <div className="dashboardCard">
          <span>Análises de produto</span>
          <strong>{metrics.totalProductAnalyses}</strong>
          <small>Product Hunter</small>
        </div>

        <div className="dashboardCard">
          <span>Conteúdos gerados</span>
          <strong>{metrics.totalContents}</strong>
          <small>Content Generator</small>
        </div>

        <div className="dashboardCard">
          <span>Criativos visuais</span>
          <strong>{metrics.totalCreativeImages}</strong>
          <small>Creative Image</small>
        </div>
      </div>

      <div className="dashboardMetrics">
        <div className="dashboardCard">
          <span>Ações totais</span>
          <strong>{metrics.totalActions}</strong>
          <small>Campanhas + análises + conteúdos + criativos</small>
        </div>

        <div className="dashboardCard">
          <span>Score médio</span>
          <strong>{metrics.averageScore}/100</strong>
          <small>Média das oportunidades</small>
        </div>

        <div className="dashboardCard">
          <span>Melhor produto</span>
          <strong>{metrics.bestCampaign?.selected_product || "Nenhum"}</strong>
          <small>
            {metrics.bestCampaign
              ? `${metrics.bestCampaign.score}/100 • ${formatMarketplace(
                  metrics.bestCampaign.marketplace
                )}`
              : "Rode o Autopilot"}
          </small>
        </div>

        <div className="dashboardCard">
          <span>Canal principal</span>
          <strong>{formatChannel(metrics.topChannel)}</strong>
          <small>Canal mais usado nos agentes</small>
        </div>
      </div>

      <div className="dashboardCommandGrid">
        <div className="dashboardCommandBox large">
          <div className="dashboardBoxHeader">
            <div>
              <span>Melhor oportunidade</span>
              <h3>
                {metrics.bestCampaign?.selected_product || "Nenhuma ainda"}
              </h3>
            </div>

            <strong>
              {metrics.bestCampaign ? `${metrics.bestCampaign.score}/100` : "--"}
            </strong>
          </div>

          {metrics.bestCampaign ? (
            <div className="dashboardOpportunity">
              <p>
                {metrics.bestCampaign.decision} no nicho{" "}
                <strong>{metrics.bestCampaign.niche}</strong>, usando{" "}
                <strong>
                  {formatChannel(metrics.bestCampaign.main_channel)}
                </strong>{" "}
                com estilo{" "}
                <strong>
                  {formatStyle(metrics.bestCampaign.campaign_style)}
                </strong>
                .
              </p>

              <div className="dashboardMiniGrid">
                <div>
                  <span>Marketplace</span>
                  <strong>
                    {formatMarketplace(metrics.bestCampaign.marketplace)}
                  </strong>
                </div>

                <div>
                  <span>Canal</span>
                  <strong>
                    {formatChannel(metrics.bestCampaign.main_channel)}
                  </strong>
                </div>

                <div>
                  <span>Criado em</span>
                  <strong>{formatDate(metrics.bestCampaign.created_at)}</strong>
                </div>
              </div>
            </div>
          ) : (
            <p className="dashboardEmpty">
              Rode o Autopilot para criar sua primeira oportunidade.
            </p>
          )}
        </div>

        <div className="dashboardCommandBox">
          <div className="dashboardBoxHeader">
            <div>
              <span>Preferências</span>
              <h3>Padrões salvos</h3>
            </div>
          </div>

          <div className="dashboardPreferenceList">
            <div>
              <span>Nicho padrão</span>
              <strong>{preferences.defaultNiche || "beleza"}</strong>
            </div>

            <div>
              <span>Canal padrão</span>
              <strong>{formatChannel(preferences.defaultChannel)}</strong>
            </div>

            <div>
              <span>Marketplace</span>
              <strong>{formatMarketplace(preferences.defaultMarketplace)}</strong>
            </div>

            <div>
              <span>Estilo</span>
              <strong>{formatStyle(preferences.defaultCampaignStyle)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboardSplit">
        <div className="dashboardBox">
          <h3>Última campanha</h3>

          {metrics.lastCampaign ? (
            <div className="dashboardCampaign">
              <strong>{metrics.lastCampaign.selected_product}</strong>
              <span>
                {metrics.lastCampaign.niche} •{" "}
                {formatMarketplace(metrics.lastCampaign.marketplace)}
              </span>
              <p>
                Score {metrics.lastCampaign.score}/100 —{" "}
                {metrics.lastCampaign.decision}
              </p>
            </div>
          ) : (
            <p className="dashboardEmpty">
              Nenhuma campanha criada ainda. Vá para o Autopilot para começar.
            </p>
          )}
        </div>

        <div className="dashboardBox">
          <h3>Último conteúdo gerado</h3>

          {metrics.lastContent ? (
            <div className="dashboardCampaign">
              <strong>{metrics.lastContent.product_name}</strong>
              <span>
                {metrics.lastContent.niche} •{" "}
                {formatChannel(metrics.lastContent.platform)} •{" "}
                {formatStyle(metrics.lastContent.tone)}
              </span>
              <p>{metrics.lastContent.headline}</p>
            </div>
          ) : (
            <p className="dashboardEmpty">
              Nenhum conteúdo criado ainda. Vá para o Content Generator.
            </p>
          )}
        </div>
      </div>

      <div className="dashboardSplit">
        <div className="dashboardBox">
          <h3>Último criativo visual</h3>

          {metrics.lastCreativeImage ? (
            <div className="dashboardCampaign">
              <strong>{metrics.lastCreativeImage.product_name}</strong>
              <span>
                {metrics.lastCreativeImage.niche} •{" "}
                {formatChannel(metrics.lastCreativeImage.platform)} •{" "}
                {formatStyle(metrics.lastCreativeImage.creative_style)}
              </span>
              <p>{metrics.lastCreativeImage.art_headline}</p>
            </div>
          ) : (
            <p className="dashboardEmpty">
              Nenhum criativo visual criado ainda. Vá para Creative Image.
            </p>
          )}
        </div>

        <div className="dashboardBox">
          <h3>Última análise de produto</h3>

          {metrics.lastProductAnalysis ? (
            <div className="dashboardCampaign">
              <strong>
                {metrics.lastProductAnalysis.product_name ||
                  metrics.lastProductAnalysis.selected_product ||
                  metrics.lastProductAnalysis.name ||
                  "Produto analisado"}
              </strong>

              <span>
                {metrics.lastProductAnalysis.niche ||
                  metrics.lastProductAnalysis.category ||
                  "nicho"}{" "}
                •{" "}
                {formatMarketplace(
                  metrics.lastProductAnalysis.marketplace || "marketplace"
                )}
              </span>

              <p>
                Score{" "}
                {metrics.lastProductAnalysis?.score?.final_score ??
                  metrics.lastProductAnalysis.final_score ??
                  metrics.lastProductAnalysis.score ??
                  "--"}
                /100
              </p>
            </div>
          ) : (
            <p className="dashboardEmpty">
              Nenhuma análise criada ainda. Vá para o Product Hunter.
            </p>
          )}
        </div>
      </div>

      <div className="dashboardSplit">
        <div className="dashboardBox">
          <h3>Status dos agentes</h3>

          <div className="systemList">
            <div>
              <span>Autopilot</span>
              <strong>Ativo</strong>
            </div>

            <div>
              <span>Product Hunter</span>
              <strong>Ativo</strong>
            </div>

            <div>
              <span>Content Generator</span>
              <strong>Salvando histórico</strong>
            </div>

            <div>
              <span>Creative Image</span>
              <strong>Salvando histórico</strong>
            </div>

            <div>
              <span>Histórico Geral</span>
              <strong>Unificado</strong>
            </div>
          </div>
        </div>

        <div className="dashboardBox">
          <h3>Próxima evolução</h3>

          <div className="dashboardCampaign">
            <strong>Exportar campanha completa</strong>
            <span>Autopilot + Conteúdo + Criativo</span>
            <p>
              O próximo passo forte é criar um pacote exportável da campanha,
              juntando estratégia, copy, roteiro, prompt visual e checklist em
              uma entrega só.
            </p>
          </div>
        </div>
      </div>

      <div className="dashboardActionsPanel">
        <div>
          <span>Próximo passo recomendado</span>

          <h3>Criar exportação de campanha completa</h3>

          <p>
            Agora o sistema já cria e salva campanhas, análises, conteúdos e
            criativos. O próximo avanço é gerar um pacote final copiável ou
            exportável com tudo pronto para postar.
          </p>
        </div>

        <button onClick={loadDashboard} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar dashboard"}
        </button>
      </div>
    </section>
  );
}