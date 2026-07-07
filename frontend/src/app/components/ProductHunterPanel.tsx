"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ProductHunterPanelProps = {
  token: string;
};

type AnalysisResult = Record<string, any>;

type HistoryItem = Record<string, any>;

type UserPreferences = {
  defaultNiche?: string;
  defaultChannel?: string;
  defaultCampaignStyle?: string;
  defaultBudgetStyle?: string;
  defaultMarketplace?: string;
  language?: string;
};

type UserSettingsApiResponse = {
  id: number;
  user_id: number;
  default_niche: string;
  default_channel: string;
  default_campaign_style: string;
  default_budget_style: string;
  default_marketplace: string;
  language: string;
  created_at: string;
  updated_at: string;
};

export default function ProductHunterPanel({ token }: ProductHunterPanelProps) {
  const [productName, setProductName] = useState("escova secadora");
  const [niche, setNiche] = useState("beleza");
  const [marketplace, setMarketplace] = useState("shopee");
  const [averagePrice, setAveragePrice] = useState("119.90");
  const [commissionPercent, setCommissionPercent] = useState("12");
  const [competitionLevel, setCompetitionLevel] = useState("medium");
  const [trafficChannel, setTrafficChannel] = useState("tiktok");

  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadUserSettings();
    loadHistory();
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function mapApiSettingsToPreferences(
    data: UserSettingsApiResponse
  ): UserPreferences {
    return {
      defaultNiche: data.default_niche,
      defaultChannel: data.default_channel,
      defaultCampaignStyle: data.default_campaign_style,
      defaultBudgetStyle: data.default_budget_style,
      defaultMarketplace: data.default_marketplace,
      language: data.language,
    };
  }

  function saveLocalPreferences(preferences: UserPreferences) {
    localStorage.setItem("affiliateai_preferences", JSON.stringify(preferences));
  }

  function loadLocalPreferences() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
      return null;
    }

    try {
      return JSON.parse(savedPreferences) as UserPreferences;
    } catch {
      return null;
    }
  }

  function applyProductPresetByNiche(selectedNiche: string) {
    if (selectedNiche === "beleza") {
      setProductName("escova secadora");
      setAveragePrice("119.90");
      setCommissionPercent("12");
      return;
    }

    if (selectedNiche === "fitness") {
      setProductName("mini elástico para treino");
      setAveragePrice("39.90");
      setCommissionPercent("12");
      return;
    }

    if (selectedNiche === "automotivo") {
      setProductName("aspirador portátil automotivo");
      setAveragePrice("99.90");
      setCommissionPercent("11");
      return;
    }

    if (selectedNiche === "casa") {
      setProductName("mini processador elétrico");
      setAveragePrice("89.90");
      setCommissionPercent("12");
      return;
    }

    if (selectedNiche === "pet") {
      setProductName("escova removedora de pelos pet");
      setAveragePrice("49.90");
      setCommissionPercent("10");
      return;
    }

    setProductName(`produto tendência de ${selectedNiche}`);
    setAveragePrice("79.90");
    setCommissionPercent("10");
  }

  function applyPreferences(preferences: UserPreferences) {
    if (preferences.defaultNiche) {
      setNiche(preferences.defaultNiche);
      applyProductPresetByNiche(preferences.defaultNiche);
    }

    if (preferences.defaultMarketplace) {
      setMarketplace(preferences.defaultMarketplace);
    }

    if (preferences.defaultChannel) {
      setTrafficChannel(preferences.defaultChannel);
    }
  }

  async function loadUserSettings() {
    setLoadingSettings(true);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        const localPreferences = loadLocalPreferences();

        if (localPreferences) {
          applyPreferences(localPreferences);
        }

        return;
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const localPreferences = loadLocalPreferences();

        if (localPreferences) {
          applyPreferences(localPreferences);
        }

        return;
      }

      const data: UserSettingsApiResponse = await response.json();
      const preferences = mapApiSettingsToPreferences(data);

      saveLocalPreferences(preferences);
      applyPreferences(preferences);
    } catch {
      const localPreferences = loadLocalPreferences();

      if (localPreferences) {
        applyPreferences(localPreferences);
      }
    } finally {
      setLoadingSettings(false);
    }
  }

  function getFinalScore(data: AnalysisResult | null) {
    if (!data) return "--";

    return (
      data?.score?.final_score ??
      data?.final_score ??
      data?.score ??
      data?.analysis?.score?.final_score ??
      "--"
    );
  }

  function getDecision(data: AnalysisResult | null) {
    if (!data) return "Sem análise";

    return (
      data?.decision ??
      data?.analysis?.decision ??
      data?.recommendation ??
      "Análise concluída"
    );
  }

  function getStrategy(data: AnalysisResult | null) {
    if (!data) return "";

    return (
      data?.strategy?.positioning ??
      data?.strategy ??
      data?.analysis?.strategy?.positioning ??
      data?.sales_strategy ??
      ""
    );
  }

  function getContentIdeas(data: AnalysisResult | null) {
    const ideas =
      data?.strategy?.content_ideas ??
      data?.analysis?.strategy?.content_ideas ??
      data?.content_ideas ??
      [];

    if (Array.isArray(ideas)) return ideas;

    return [];
  }

  async function loadHistory() {
    setLoadingHistory(true);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        setHistory([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/product-hunter/history`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        setHistory([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function analyzeProduct() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para analisar produtos.");
      }

      const response = await fetch(`${API_URL}/api/product-hunter/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          product_name: productName,
          niche,
          category: niche,
          marketplace,
          average_price: Number(averagePrice),
          commission_percent: Number(commissionPercent),
          competition_level: competitionLevel,
          traffic_channel: trafficChannel,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setResult(data);
      await loadHistory();

      window.dispatchEvent(new Event("product-hunter-history-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao analisar produto.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function openHistoryItem(id: number) {
    setLoading(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado.");
      }

      const response = await fetch(`${API_URL}/api/product-hunter/${id}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir análise.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <section className="hunterPanel">
      <div className="hunterHeader">
        <div>
          <span className="hunterEyebrow">Product Hunter Agent</span>

          <h2>Caçador de Produtos</h2>

          <p>
            Analise produtos para afiliados com score, demanda, concorrência,
            comissão, risco e estratégia de venda. Agora ele busca nicho,
            marketplace e canal direto da API de configurações do usuário.
          </p>
        </div>

        <div className="hunterStatus">
          <span>Configurações</span>
          <strong>{loadingSettings ? "Sincronizando" : "Sincronizadas"}</strong>
        </div>
      </div>

      <div className="hunterControls">
        <label>
          Nome do produto
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Ex: escova secadora"
          />
        </label>

        <label>
          Nicho
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="Ex: beleza, fitness, casa..."
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
          </select>
        </label>

        <label>
          Preço médio
          <input
            value={averagePrice}
            onChange={(event) => setAveragePrice(event.target.value)}
            placeholder="119.90"
          />
        </label>

        <label>
          Comissão %
          <input
            value={commissionPercent}
            onChange={(event) => setCommissionPercent(event.target.value)}
            placeholder="12"
          />
        </label>

        <label>
          Concorrência
          <select
            value={competitionLevel}
            onChange={(event) => setCompetitionLevel(event.target.value)}
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>

        <label>
          Canal de tráfego
          <select
            value={trafficChannel}
            onChange={(event) => setTrafficChannel(event.target.value)}
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

        <button
          className="primaryButton hunterButton"
          onClick={analyzeProduct}
          disabled={loading || loadingSettings}
        >
          {loading ? "Analisando produto..." : "Analisar Produto"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      {result && (
        <div className="hunterResult">
          <div className="hunterScoreBox">
            <div>
              <span>Produto analisado</span>
              <strong>
                {result?.product_name ??
                  result?.product?.name ??
                  result?.name ??
                  productName}
              </strong>
              <small>
                {result?.marketplace ?? marketplace} • {niche}
              </small>
            </div>

            <div>
              <span>Score</span>
              <strong>{getFinalScore(result)}/100</strong>
              <small>{getDecision(result)}</small>
            </div>
          </div>

          <div className="hunterMetrics">
            <div>
              <span>Demanda</span>
              <strong>
                {result?.score?.demand_score ??
                  result?.analysis?.score?.demand_score ??
                  "--"}
              </strong>
            </div>

            <div>
              <span>Virality</span>
              <strong>
                {result?.score?.virality_score ??
                  result?.analysis?.score?.virality_score ??
                  "--"}
              </strong>
            </div>

            <div>
              <span>Lucro</span>
              <strong>
                {result?.score?.profit_score ??
                  result?.analysis?.score?.profit_score ??
                  "--"}
              </strong>
            </div>

            <div>
              <span>Risco</span>
              <strong>
                {result?.score?.saturation_risk ??
                  result?.analysis?.score?.saturation_risk ??
                  "--"}
              </strong>
            </div>
          </div>

          <div className="hunterGrid">
            <div className="hunterCard">
              <h3>Estratégia recomendada</h3>
              <p>
                {getStrategy(result) ||
                  "Use demonstração visual, dor clara, benefício rápido e CTA direto."}
              </p>
              <button
                onClick={() =>
                  copyText(
                    getStrategy(result) ||
                      "Use demonstração visual, dor clara, benefício rápido e CTA direto."
                  )
                }
              >
                Copiar
              </button>
            </div>

            <div className="hunterCard">
              <h3>Ângulo de venda</h3>
              <p>
                {result?.strategy?.sales_angle ??
                  result?.analysis?.strategy?.sales_angle ??
                  "Apresente o produto como uma solução prática para uma dor específica do público."}
              </p>
            </div>
          </div>

          <div className="hunterCard">
            <h3>Ideias de conteúdo</h3>

            {getContentIdeas(result).length === 0 ? (
              <p>
                Mostre antes/depois, faça demonstração rápida, compare com uma
                alternativa ruim e finalize com chamada para ação.
              </p>
            ) : (
              <ul>
                {getContentIdeas(result).map((idea: string) => (
                  <li key={idea}>{idea}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="hunterHistory">
        <div className="hunterHistoryHeader">
          <div>
            <h3>Histórico de análises</h3>
            <p>Análises salvas pelo Product Hunter.</p>
          </div>

          <button onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {history.length === 0 ? (
          <div className="hunterEmpty">Nenhuma análise encontrada ainda.</div>
        ) : (
          <div className="hunterHistoryList">
            {history.map((item) => {
              const id = item.id ?? item.analysis_id;

              return (
                <button
                  key={id}
                  className="hunterHistoryItem"
                  onClick={() => openHistoryItem(Number(id))}
                >
                  <div>
                    <strong>
                      {item.product_name ??
                        item.selected_product ??
                        item.name ??
                        "Produto"}
                    </strong>
                    <span>
                      {item.marketplace ?? "marketplace"} •{" "}
                      {item.traffic_channel ?? item.main_channel ?? "canal"}
                    </span>
                  </div>

                  <div>
                    <strong>
                      {item?.score?.final_score ??
                        item.final_score ??
                        item.score ??
                        "--"}
                      /100
                    </strong>
                    <span>{item.decision ?? "Análise"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}