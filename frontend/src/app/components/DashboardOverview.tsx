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

    return () => {
      window.removeEventListener("autopilot-history-updated", refreshDashboard);
      window.removeEventListener(
        "product-hunter-history-updated",
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
        return;
      }

      const autopilotResponse = await fetch(
        `${API_URL}/api/autopilot/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (autopilotResponse.ok) {
        const autopilotData: AutopilotHistoryItem[] =
          await autopilotResponse.json();
        setAutopilotHistory(Array.isArray(autopilotData) ? autopilotData : []);
      } else {
        setAutopilotHistory([]);
      }

      const productHunterResponse = await fetch(
        `${API_URL}/api/product-hunter/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (productHunterResponse.ok) {
        const productHunterData = await productHunterResponse.json();
        setProductHunterHistory(
          Array.isArray(productHunterData) ? productHunterData : []
        );
      } else {
        setProductHunterHistory([]);
      }
    } catch {
      setAutopilotHistory([]);
      setProductHunterHistory([]);
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

    const channelCount: Record<string, number> = {};

    for (const item of autopilotHistory) {
      channelCount[item.main_channel] = (channelCount[item.main_channel] || 0) + 1;
    }

    const topChannel =
      Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      preferences.defaultChannel ||
      "Nenhum";

    const totalActions = totalCampaigns + totalProductAnalyses;

    return {
      totalCampaigns,
      totalProductAnalyses,
      totalActions,
      averageScore,
      bestCampaign,
      lastCampaign,
      topChannel,
    };
  }, [autopilotHistory, productHunterHistory, preferences]);

  return (
    <section className="dashboardPanel">
      <div className="dashboardCommandHeader">
        <div>
          <span className="dashboardEyebrow">Central de comando</span>
          <h2>Dashboard AffiliateAI Pro</h2>
          <p>
            Acompanhe campanhas, análises, preferências salvas e status dos
            agentes principais do seu SaaS de afiliados.
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
          <span>Score médio</span>
          <strong>{metrics.averageScore}/100</strong>
          <small>Média das oportunidades</small>
        </div>

        <div className="dashboardCard">
          <span>Ações totais</span>
          <strong>{metrics.totalActions}</strong>
          <small>Campanhas + análises</small>
        </div>
      </div>

      <div className="dashboardCommandGrid">
        <div className="dashboardCommandBox large">
          <div className="dashboardBoxHeader">
            <div>
              <span>Melhor oportunidade</span>
              <h3>{metrics.bestCampaign?.selected_product || "Nenhuma ainda"}</h3>
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
                <strong>{formatChannel(metrics.bestCampaign.main_channel)}</strong>{" "}
                com estilo{" "}
                <strong>{formatStyle(metrics.bestCampaign.campaign_style)}</strong>.
              </p>

              <div className="dashboardMiniGrid">
                <div>
                  <span>Marketplace</span>
                  <strong>{formatMarketplace(metrics.bestCampaign.marketplace)}</strong>
                </div>

                <div>
                  <span>Canal</span>
                  <strong>{formatChannel(metrics.bestCampaign.main_channel)}</strong>
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
              <strong>Ativo</strong>
            </div>

            <div>
              <span>Configurações</span>
              <strong>Sincronizadas</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboardActionsPanel">
        <div>
          <span>Próximo passo recomendado</span>
          <h3>Criar histórico completo de conteúdos</h3>
          <p>
            O próximo avanço forte é fazer o Content Generator salvar no banco e
            aparecer no Histórico Geral junto com Autopilot e Product Hunter.
          </p>
        </div>

        <button onClick={loadDashboard} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar dashboard"}
        </button>
      </div>
    </section>
  );
}