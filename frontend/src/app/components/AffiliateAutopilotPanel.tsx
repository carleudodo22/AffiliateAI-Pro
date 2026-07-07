"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AutopilotResponse = {
  id: number | null;
  agent: string;
  status: string;
  niche: string;
  objective: string;
  main_channel: string;
  budget_style: string;
  campaign_style: string;
  package: {
    selected_product: {
      product_name: string;
      marketplace: string;
      average_price: number;
      commission_percent: number;
      estimated_competition: number;
      trend_signal: number;
      reason: string;
    };
    analysis: {
      decision: string;
      score: {
        final_score: number;
        demand_score: number;
        virality_score: number;
        profit_score: number;
        competition_score: number;
        saturation_risk: number;
      };
      strategy: {
        positioning: string;
        sales_angle: string;
        content_ideas: string[];
        warnings: string[];
      };
    };
    content: {
      headline: string;
      product_description: string;
      short_sales_copy: string;
      video_hooks: string[];
      video_scripts: string[];
      instagram_caption: string;
      tiktok_caption: string;
      whatsapp_message: string;
      ad_copy: string;
      ctas: string[];
      hashtags: string[];
    };
    creative: {
      image_creative_direction: string;
      image_generation_brief: string;
      video_creative_direction: string;
      video_script: string;
      voiceover_script: string;
      sound_direction: string;
      publishing_caption: string;
      checklist: string[];
    };
  };
};

type AutopilotHistoryItem = {
  id: number;
  niche: string;
  objective: string;
  main_channel: string;
  budget_style: string;
  campaign_style: string;
  status: string;
  created_at: string;
};

type AffiliateAutopilotPanelProps = {
  token: string;
};

export default function AffiliateAutopilotPanel({
  token,
}: AffiliateAutopilotPanelProps) {
  const [niche, setNiche] = useState("beleza");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );
  const [objective, setObjective] = useState("vender");
  const [mainChannel, setMainChannel] = useState("tiktok");
  const [budgetStyle, setBudgetStyle] = useState("organico");
  const [campaignStyle, setCampaignStyle] = useState("viral");

  const [result, setResult] = useState<AutopilotResponse | null>(null);
  const [history, setHistory] = useState<AutopilotHistoryItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const [copyMessage, setCopyMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function runAutopilot() {
    setLoading(true);
    setErrorMessage("");
    setCopyMessage("");

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 15000);

    try {
      const response = await fetch(`${API_URL}/api/autopilot/run`, {
        method: "POST",
        signal: controller.signal,
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
          preferred_marketplaces: ["shopee", "mercado_livre", "amazon", "hotmart"],
        }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondeu erro ${response.status}: ${errorText}`);
      }

      const data: AutopilotResponse = await response.json();

      setResult(data);
      await loadHistory();
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          setErrorMessage(
            "O Autopilot demorou demais para responder. Verifique se o backend está rodando e se a rota /api/autopilot/run aparece no Swagger."
          );
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Erro desconhecido ao rodar Autopilot.");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  }

  async function loadHistory() {
    if (!token) {
      setHistory([]);
      return;
    }

    setLoadingHistory(true);

    try {
      const response = await fetch(`${API_URL}/api/autopilot/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao carregar histórico do Autopilot.");
      }

      const data: AutopilotHistoryItem[] = await response.json();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function openCampaign(id: number) {
    setOpeningId(id);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/api/autopilot/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondeu erro ${response.status}: ${errorText}`);
      }

      const data: AutopilotResponse = await response.json();
      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro desconhecido ao abrir campanha.");
      }
    } finally {
      setOpeningId(null);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopyMessage("Copiado!");
    setTimeout(() => setCopyMessage(""), 1700);
  }

  function joinLines(items: string[]) {
    return items.join("\n");
  }

  useEffect(() => {
    loadHistory();
  }, [token]);

  return (
    <section className="autopilotPanel">
      <div className="panelHeader">
        <span className="dot" />
        Affiliate Autopilot Agent
      </div>

      <div className="autopilotIntro">
        <div>
          <h2>IA Autopilot de Afiliados</h2>
          <p>
            Informe o nicho e deixe a IA escolher produto, analisar oportunidade
            e montar uma campanha completa.
          </p>
        </div>

        <button
          className="primaryButton autopilotButton"
          onClick={runAutopilot}
          disabled={loading}
        >
          {loading ? "Rodando Autopilot..." : "Rodar Autopilot"}
        </button>
      </div>

      <div className="autopilotControls">
        <label>
          Nicho
          <input value={niche} onChange={(event) => setNiche(event.target.value)} />
        </label>

        <label className="wide">
          Público-alvo
          <input
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
          />
        </label>

        <label>
          Objetivo
          <select value={objective} onChange={(event) => setObjective(event.target.value)}>
            <option value="vender">Vender</option>
            <option value="validar_produto">Validar produto</option>
            <option value="aquecer_audiencia">Aquecer audiência</option>
            <option value="capturar_lead">Capturar lead</option>
          </select>
        </label>

        <label>
          Canal
          <select
            value={mainChannel}
            onChange={(event) => setMainChannel(event.target.value)}
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="whatsapp">WhatsApp</option>
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
          Estilo
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
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
      {copyMessage && <p className="copyMessage">{copyMessage}</p>}

      {!result && (
        <div className="autopilotEmpty">
          <p>
            O Autopilot ainda não rodou. Clique em <strong>Rodar Autopilot</strong>{" "}
            para gerar a primeira campanha automática.
          </p>
        </div>
      )}

      {result && (
        <div className="autopilotResult">
          <div className="autopilotScoreBox">
            <div>
              <span>Produto escolhido</span>
              <h3>{result.package.selected_product.product_name}</h3>
              <p>{result.package.selected_product.reason}</p>
            </div>

            <div className="autopilotScoreCircle">
              <strong>{result.package.analysis.score.final_score}</strong>
              <small>/100</small>
            </div>
          </div>

          <div className="autopilotGrid">
            <article className="autopilotCard">
              <span>Marketplace</span>
              <strong>{result.package.selected_product.marketplace}</strong>
              <p>
                Preço médio R$ {result.package.selected_product.average_price} ·
                Comissão {result.package.selected_product.commission_percent}%
              </p>
            </article>

            <article className="autopilotCard">
              <span>Decisão</span>
              <strong>{result.package.analysis.decision}</strong>
              <p>{result.package.analysis.strategy.sales_angle}</p>
            </article>

            <article className="autopilotCard">
              <span>Headline</span>
              <strong>{result.package.content.headline}</strong>
              <button onClick={() => copyText(result.package.content.headline)}>
                Copiar
              </button>
            </article>

            <article className="autopilotCard">
              <span>Copy curta</span>
              <p>{result.package.content.short_sales_copy}</p>
              <button onClick={() => copyText(result.package.content.short_sales_copy)}>
                Copiar
              </button>
            </article>

            <article className="autopilotCard wide">
              <span>Direção da imagem</span>
              <p>{result.package.creative.image_generation_brief}</p>
              <button
                onClick={() => copyText(result.package.creative.image_generation_brief)}
              >
                Copiar
              </button>
            </article>

            <article className="autopilotCard wide">
              <span>Roteiro do vídeo</span>
              <p>{result.package.creative.video_script}</p>
              <button onClick={() => copyText(result.package.creative.video_script)}>
                Copiar
              </button>
            </article>

            <article className="autopilotCard wide">
              <span>Narração</span>
              <p>{result.package.creative.voiceover_script}</p>
              <button onClick={() => copyText(result.package.creative.voiceover_script)}>
                Copiar
              </button>
            </article>

            <article className="autopilotCard">
              <span>Ganchos de vídeo</span>
              <ul>
                {result.package.content.video_hooks.map((hook) => (
                  <li key={hook}>{hook}</li>
                ))}
              </ul>
              <button onClick={() => copyText(joinLines(result.package.content.video_hooks))}>
                Copiar
              </button>
            </article>

            <article className="autopilotCard">
              <span>Checklist da campanha</span>
              <ul>
                {result.package.creative.checklist.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      )}

      <div className="autopilotHistory">
        <div className="autopilotHistoryHeader">
          <div>
            <h3>Histórico do Autopilot</h3>
            <p>Campanhas automáticas salvas na sua conta.</p>
          </div>

          <button onClick={loadHistory}>
            {loadingHistory ? "Carregando..." : "Atualizar"}
          </button>
        </div>

        {history.length === 0 && !loadingHistory && (
          <p className="autopilotHistoryEmpty">
            Nenhuma campanha automática salva ainda.
          </p>
        )}

        {history.length > 0 && (
          <div className="autopilotHistoryList">
            {history.map((item) => (
              <article className="autopilotHistoryCard" key={item.id}>
                <div>
                  <strong>
                    #{item.id} · {item.niche}
                  </strong>
                  <span>
                    {item.objective} · {item.main_channel} · {item.campaign_style}
                  </span>
                </div>

                <button onClick={() => openCampaign(item.id)}>
                  {openingId === item.id ? "Abrindo..." : "Abrir"}
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}