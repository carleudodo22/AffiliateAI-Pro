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

export default function DashboardOverview() {
  const [history, setHistory] = useState<AutopilotHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();

    function refreshDashboard() {
      loadDashboard();
    }

    window.addEventListener("autopilot-history-updated", refreshDashboard);

    return () => {
      window.removeEventListener("autopilot-history-updated", refreshDashboard);
    };
  }, []);

  async function loadDashboard() {
    setLoading(true);

    try {
      const token = localStorage.getItem("affiliateai_token");

      if (!token) {
        setHistory([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/autopilot/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setHistory([]);
        return;
      }

      const data: AutopilotHistoryItem[] = await response.json();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  const metrics = useMemo(() => {
    const totalCampaigns = history.length;

    const averageScore =
      totalCampaigns > 0
        ? Math.round(
            history.reduce((total, item) => total + item.score, 0) /
              totalCampaigns
          )
        : 0;

    const bestCampaign =
      history.length > 0
        ? [...history].sort((a, b) => b.score - a.score)[0]
        : null;

    const lastCampaign = history.length > 0 ? history[0] : null;

    const channelCount: Record<string, number> = {};

    for (const item of history) {
      channelCount[item.main_channel] =
        (channelCount[item.main_channel] || 0) + 1;
    }

    const topChannel =
      Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "Nenhum";

    return {
      totalCampaigns,
      averageScore,
      bestCampaign,
      lastCampaign,
      topChannel,
    };
  }, [history]);

  return (
    <section className="dashboardPanel">
      <div className="dashboardHeader">
        <div>
          <span className="dashboardEyebrow">Visão geral</span>
          <h2>Dashboard de Campanhas</h2>
          <p>
            Acompanhe o desempenho das campanhas criadas pelo Autopilot e veja
            quais oportunidades estão mais fortes.
          </p>
        </div>

        <button onClick={loadDashboard} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar dados"}
        </button>
      </div>

      <div className="dashboardMetrics">
        <div className="dashboardCard highlight">
          <span>Campanhas criadas</span>
          <strong>{metrics.totalCampaigns}</strong>
          <small>Total salvo no banco</small>
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
              ? `${metrics.bestCampaign.score}/100 • ${metrics.bestCampaign.marketplace}`
              : "Rode o Autopilot"}
          </small>
        </div>

        <div className="dashboardCard">
          <span>Canal principal</span>
          <strong>{metrics.topChannel}</strong>
          <small>Canal mais usado</small>
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
                {metrics.lastCampaign.marketplace}
              </span>
              <p>
                Score {metrics.lastCampaign.score}/100 —{" "}
                {metrics.lastCampaign.decision}
              </p>
            </div>
          ) : (
            <p className="dashboardEmpty">
              Nenhuma campanha criada ainda. Rode o Autopilot para começar.
            </p>
          )}
        </div>

        <div className="dashboardBox">
          <h3>Status do sistema</h3>

          <div className="systemList">
            <div>
              <span>Backend</span>
              <strong>Online</strong>
            </div>

            <div>
              <span>Banco de dados</span>
              <strong>Salvando histórico</strong>
            </div>

            <div>
              <span>Autopilot</span>
              <strong>Ativo</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}