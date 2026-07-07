"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AutopilotResult = {
  id: number | null;
  agent: string;
  status: string;

  niche: string;
  target_audience: string | null;

  objective: string;
  main_channel: string;
  budget_style: string;
  campaign_style: string;

  selected_product: string;
  marketplace: string;
  score: number;
  decision: string;

  strategy: string;
  headline: string;
  short_copy: string;
  video_script: string;
  image_brief: string;
  voiceover_script: string;

  checklist: string[];
  campaign_package: {
    product?: {
      name?: string;
      marketplace?: string;
      average_price?: number;
      commission_percent?: number;
      reason?: string;
    };
    market_analysis?: {
      score?: number;
      decision?: string;
      demand_score?: number;
      competition_score?: number;
      visual_strength?: number;
      impulse_buy?: number;
      risk_level?: string;
    };
    content_package?: {
      hashtags?: string[];
      ctas?: string[];
    };
    publishing_plan?: {
      posting_angle?: string;
      test_variations?: string[];
    };
  };

  created_at: string | null;
};

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

export default function AffiliateAutopilotPanel() {
  const [niche, setNiche] = useState("beleza");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );
  const [mainChannel, setMainChannel] = useState("tiktok");
  const [campaignStyle, setCampaignStyle] = useState("viral");
  const [objective, setObjective] = useState("vender");
  const [budgetStyle, setBudgetStyle] = useState("organico");

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [result, setResult] = useState<AutopilotResult | null>(null);
  const [history, setHistory] = useState<AutopilotHistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  function getToken() {
    return localStorage.getItem("affiliateai_token");
  }

  async function loadHistory() {
    setLoadingHistory(true);

    try {
      const token = getToken();

      if (!token) {
        setLoadingHistory(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/autopilot/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setLoadingHistory(false);
        return;
      }

      const data: AutopilotHistoryItem[] = await response.json();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function runAutopilot() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Você precisa estar logado para rodar o Autopilot.");
      }

      const response = await fetch(`${API_URL}/api/autopilot/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          niche,
          target_audience: targetAudience,
          objective,
          main_channel: mainChannel,
          budget_style: budgetStyle,
          campaign_style: campaignStyle,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AutopilotResult = await response.json();

      setResult(data);
      await loadHistory();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao rodar Autopilot.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function openHistoryItem(id: number) {
    setLoading(true);
    setErrorMessage("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Você precisa estar logado.");
      }

      const response = await fetch(`${API_URL}/api/autopilot/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AutopilotResult = await response.json();

      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir campanha.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Agora";
    }

    return new Date(date).toLocaleString("pt-BR");
  }

  return (
    <section className="autopilotPanel">
      <div className="panelHeader">
        <span className="dot" />
        Affiliate Autopilot Agent
      </div>

      <div className="autopilotIntro">
        <div>
          <h2>Autopilot Profissional de Afiliados</h2>
          <p>
            O sistema escolhe um produto, analisa oportunidade, monta campanha,
            salva no banco e permite abrir campanhas antigas.
          </p>
        </div>

        <div className="autopilotStatus">
          <span>Modo</span>
          <strong>Campaign Builder</strong>
        </div>
      </div>

      <div className="autopilotControls">
        <label>
          Nicho
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="Ex: beleza, fitness, casa, automotivo, pet"
          />
        </label>

        <label>
          Público-alvo
          <input
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            placeholder="Ex: mulheres de 20 a 35 anos..."
          />
        </label>

        <label>
          Objetivo
          <select
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
          >
            <option value="vender">Vender</option>
            <option value="validar_produto">Validar Produto</option>
            <option value="aquecer_audiencia">Aquecer Audiência</option>
            <option value="capturar_lead">Capturar Lead</option>
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
            <option value="whatsapp">WhatsApp</option>
            <option value="pinterest">Pinterest</option>
            <option value="google">Google</option>
            <option value="facebook_ads">Facebook Ads</option>
          </select>
        </label>

        <label>
          Orçamento
          <select
            value={budgetStyle}
            onChange={(event) => setBudgetStyle(event.target.value)}
          >
            <option value="organico">Orgânico</option>
            <option value="baixo_orcamento">Baixo orçamento</option>
            <option value="trafego_pago">Tráfego pago</option>
          </select>
        </label>

        <label>
          Estilo da campanha
          <select
            value={campaignStyle}
            onChange={(event) => setCampaignStyle(event.target.value)}
          >
            <option value="viral">Viral</option>
            <option value="direto">Direto</option>
            <option value="premium">Premium</option>
            <option value="popular">Popular</option>
            <option value="emocional">Emocional</option>
            <option value="agressivo">Agressivo</option>
          </select>
        </label>

        <button
          className="primaryButton autopilotButton"
          onClick={runAutopilot}
          disabled={loading}
        >
          {loading ? "Montando campanha..." : "Rodar Autopilot Profissional"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      {result && (
        <div className="autopilotResult">
          <div className="autopilotScoreBox">
            <div>
              <span>Produto escolhido</span>
              <strong>{result.selected_product}</strong>
              <small>
                {result.marketplace} • {formatDate(result.created_at)}
              </small>
            </div>

            <div>
              <span>Score da oportunidade</span>
              <strong>{result.score}/100</strong>
              <small>{result.decision}</small>
            </div>
          </div>

          <div className="autopilotMetrics">
            <div>
              <span>Demanda</span>
              <strong>
                {result.campaign_package.market_analysis?.demand_score ?? "--"}
              </strong>
            </div>

            <div>
              <span>Concorrência</span>
              <strong>
                {result.campaign_package.market_analysis?.competition_score ??
                  "--"}
              </strong>
            </div>

            <div>
              <span>Visual</span>
              <strong>
                {result.campaign_package.market_analysis?.visual_strength ??
                  "--"}
              </strong>
            </div>

            <div>
              <span>Compra por impulso</span>
              <strong>
                {result.campaign_package.market_analysis?.impulse_buy ?? "--"}
              </strong>
            </div>
          </div>

          <div className="autopilotGrid">
            <div className="autopilotCard">
              <h3>Estratégia</h3>
              <p>{result.strategy}</p>
              <button onClick={() => copyText(result.strategy)}>Copiar</button>
            </div>

            <div className="autopilotCard">
              <h3>Headline</h3>
              <p>{result.headline}</p>
              <button onClick={() => copyText(result.headline)}>Copiar</button>
            </div>

            <div className="autopilotCard">
              <h3>Copy curta</h3>
              <p>{result.short_copy}</p>
              <button onClick={() => copyText(result.short_copy)}>Copiar</button>
            </div>

            <div className="autopilotCard">
              <h3>Roteiro de vídeo</h3>
              <p>{result.video_script}</p>
              <button onClick={() => copyText(result.video_script)}>
                Copiar
              </button>
            </div>

            <div className="autopilotCard">
              <h3>Brief de imagem</h3>
              <p>{result.image_brief}</p>
              <button onClick={() => copyText(result.image_brief)}>
                Copiar
              </button>
            </div>

            <div className="autopilotCard">
              <h3>Narração</h3>
              <p>{result.voiceover_script}</p>
              <button onClick={() => copyText(result.voiceover_script)}>
                Copiar
              </button>
            </div>
          </div>

          <div className="autopilotGrid">
            <div className="autopilotCard">
              <h3>Hashtags</h3>
              <p>
                {(result.campaign_package.content_package?.hashtags ?? []).join(
                  " "
                )}
              </p>
              <button
                onClick={() =>
                  copyText(
                    (
                      result.campaign_package.content_package?.hashtags ?? []
                    ).join(" ")
                  )
                }
              >
                Copiar
              </button>
            </div>

            <div className="autopilotCard">
              <h3>Plano de publicação</h3>
              <p>
                {result.campaign_package.publishing_plan?.posting_angle ??
                  "Plano não disponível."}
              </p>
            </div>
          </div>

          <div className="autopilotCard">
            <h3>Checklist de execução</h3>
            <ul>
              {result.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="autopilotHistory">
        <div className="autopilotHistoryHeader">
          <div>
            <h3>Histórico do Autopilot</h3>
            <p>Campanhas salvas automaticamente no banco.</p>
          </div>

          <button onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {history.length === 0 ? (
          <div className="autopilotEmpty">
            Nenhuma campanha salva ainda. Rode o Autopilot para criar a primeira.
          </div>
        ) : (
          <div className="autopilotHistoryList">
            {history.map((item) => (
              <button
                key={item.id}
                className="autopilotHistoryItem"
                onClick={() => openHistoryItem(item.id)}
              >
                <div>
                  <strong>{item.selected_product}</strong>
                  <span>
                    {item.niche} • {item.marketplace} • {item.main_channel}
                  </span>
                </div>

                <div>
                  <strong>{item.score}/100</strong>
                  <span>{item.decision}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}