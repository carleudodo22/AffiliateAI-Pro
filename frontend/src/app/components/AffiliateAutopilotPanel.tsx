"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ProductHunterPanelProps = {
  token: string;
};

type ProductHunterHistoryItem = {
  id: number;
  product_name: string;
  niche: string;
  marketplace: string;
  score: string;
  decision: string;
  status: string;
  created_at: string;
};

type ProductHunterResponse = {
  id: number | null;
  agent: string;
  status: string;

  product_name: string;
  niche: string;
  marketplace: string;

  average_price: number;
  commission_percent: number;

  score: string;
  decision: string;
  summary: string;

  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  risks: string[];

  target_audience: string;
  content_angles: string[];
  recommended_channels: string[];

  analysis_package: Record<string, unknown>;

  created_at: string | null;
};

type AffiliateProduct = {
  id: number;
  product_name: string;
  niche: string;
  marketplace: string;
  product_url: string | null;
  affiliate_link: string | null;
  average_price: number;
  commission_percent: number;
  status: string;
  notes: string | null;
};

const DEFAULT_FORM = {
  product_name: "produto tendência de tecnologia",
  niche: "tecnologia",
  marketplace: "shopee",
  average_price: "79.90",
  commission_percent: "10",
  competition_level: "media",
  traffic_channel: "tiktok",
  target_audience: "",
  product_url: "",
};

export default function ProductHunterPanel({ token }: ProductHunterPanelProps) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [history, setHistory] = useState<ProductHunterHistoryItem[]>([]);
  const [result, setResult] = useState<ProductHunterResponse | null>(null);
  const [autoPickProduct, setAutoPickProduct] =
    useState<AffiliateProduct | null>(null);

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [autoPicking, setAutoPicking] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function updateForm(key: keyof typeof DEFAULT_FORM, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");
  }

  function formatDate(value?: string | null) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function formatMarketplace(value: string) {
    const labels: Record<string, string> = {
      shopee: "Shopee",
      mercado_livre: "Mercado Livre",
      amazon: "Amazon",
      hotmart: "Hotmart",
      kiwify: "Kiwify",
      monetizze: "Monetizze",
      outro: "Outro",
      generic: "Genérico",
    };

    return labels[value] || value;
  }

  function formatChannel(value: string) {
    const labels: Record<string, string> = {
      tiktok: "TikTok",
      instagram: "Instagram",
      youtube_shorts: "YouTube Shorts",
      google: "Google",
      facebook_ads: "Facebook Ads",
      whatsapp: "WhatsApp",
      pinterest: "Pinterest",
    };

    return labels[value] || value;
  }

  function formatCompetition(value: string) {
    const labels: Record<string, string> = {
      baixa: "Baixa",
      baixo: "Baixa",
      media: "Média",
      média: "Média",
      medio: "Média",
      médio: "Média",
      alta: "Alta",
      alto: "Alta",
    };

    return labels[value] || value;
  }

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) return;

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) return;

      const settings = await response.json();

      setForm((currentForm) => ({
        ...currentForm,
        niche:
          settings.default_niche ||
          localStorage.getItem("affiliateai_default_niche") ||
          currentForm.niche,
        marketplace:
          settings.default_marketplace ||
          localStorage.getItem("affiliateai_default_marketplace") ||
          currentForm.marketplace,
        traffic_channel:
          settings.default_channel ||
          localStorage.getItem("affiliateai_default_channel") ||
          currentForm.traffic_channel,
      }));
    } catch {
      const localNiche = localStorage.getItem("affiliateai_default_niche");
      const localMarketplace = localStorage.getItem(
        "affiliateai_default_marketplace"
      );
      const localChannel = localStorage.getItem("affiliateai_default_channel");

      setForm((currentForm) => ({
        ...currentForm,
        niche: localNiche || currentForm.niche,
        marketplace: localMarketplace || currentForm.marketplace,
        traffic_channel: localChannel || currentForm.traffic_channel,
      }));
    } finally {
      setLoadingSettings(false);
    }
  }, [token]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setErrorMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        throw new Error("Você precisa estar logado para carregar o histórico.");
      }

      const response = await fetch(`${API_URL}/api/product-hunter/history`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: ProductHunterHistoryItem[] = await response.json();

      setHistory(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar histórico do Product Hunter.");
      }

      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    loadSettings();
    loadHistory();

    window.addEventListener("product-hunter-history-updated", loadHistory);

    return () => {
      window.removeEventListener("product-hunter-history-updated", loadHistory);
    };
  }, [loadSettings, loadHistory]);

  async function useAutoPickProduct() {
    setAutoPicking(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para usar Auto Pick.");
      }

      const response = await fetch(`${API_URL}/api/affiliate-products/auto-pick`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const product: AffiliateProduct = await response.json();

      setAutoPickProduct(product);

      setForm((currentForm) => ({
        ...currentForm,
        product_name: product.product_name || currentForm.product_name,
        niche: product.niche || currentForm.niche,
        marketplace: product.marketplace || currentForm.marketplace,
        average_price: String(product.average_price || 0),
        commission_percent: String(product.commission_percent || 0),
        target_audience:
          product.notes ||
          `pessoas interessadas no nicho de ${product.niche}`,
        product_url: product.affiliate_link || product.product_url || "",
      }));

      setSuccessMessage(
        `Auto Pick carregou: ${product.product_name}. Agora clique em Analisar Produto.`
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao usar Auto Pick.");
      }
    } finally {
      setAutoPicking(false);
    }
  }

  async function analyzeProduct() {
    setAnalyzing(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para analisar produto.");
      }

      const payload = {
        product_name: form.product_name,
        niche: form.niche,
        marketplace: form.marketplace,
        average_price: Number(form.average_price) || 0,
        commission_percent: Number(form.commission_percent) || 0,
        target_audience: form.target_audience || null,
        product_url: form.product_url || null,
        traffic_channel: form.traffic_channel,
        competition_level: form.competition_level,
      };

      const response = await fetch(`${API_URL}/api/product-hunter/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: ProductHunterResponse = await response.json();

      setResult(data);
      setSuccessMessage("Produto analisado e salvo no histórico.");

      await loadHistory();

      window.dispatchEvent(new Event("product-hunter-history-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao analisar produto.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function openHistoryItem(id: number) {
    setOpeningId(id);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para abrir o histórico.");
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

      const data: ProductHunterResponse = await response.json();

      setResult(data);
      setSuccessMessage("Análise carregada.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir análise.");
      }
    } finally {
      setOpeningId(null);
    }
  }

  async function copyAnalysis() {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopyMessage("Análise copiada.");
    } catch {
      setCopyMessage("Não foi possível copiar.");
    }
  }

  return (
    <section className="agentPanel productHunterPanel">
      <div className="agentHero">
        <div>
          <span className="agentEyebrow">Product Hunter Agent</span>

          <h2>Caçador de Produtos</h2>

          <p>
            Analise produtos para afiliados com score, demanda, concorrência,
            comissão, risco e estratégia de venda. Agora também puxa o melhor
            produto real do seu Catálogo com Auto Pick.
          </p>
        </div>

        <div className="agentHeroStats">
          <span>Configurações</span>
          <strong>Sincronizadas</strong>
          <p>
            {loadingSettings
              ? "Carregando preferências..."
              : "preferências do usuário ativas"}
          </p>
        </div>
      </div>

      <div className="agentWorkspace">
        <div className="agentFormCard">
          <div className="agentSectionHeader">
            <div>
              <span>Análise</span>
              <h3>Dados do produto</h3>
            </div>

            <button onClick={loadSettings} disabled={loadingSettings}>
              {loadingSettings ? "Carregando..." : "Usar preferências"}
            </button>
          </div>

          <div className="agentFormGrid">
            <label>
              Nome do produto
              <input
                value={form.product_name}
                onChange={(event) =>
                  updateForm("product_name", event.target.value)
                }
                placeholder="Ex: Escova secadora"
              />
            </label>

            <label>
              Nicho
              <input
                value={form.niche}
                onChange={(event) => updateForm("niche", event.target.value)}
                placeholder="Ex: beleza"
              />
            </label>

            <label>
              Marketplace
              <select
                value={form.marketplace}
                onChange={(event) =>
                  updateForm("marketplace", event.target.value)
                }
              >
                <option value="shopee">Shopee</option>
                <option value="mercado_livre">Mercado Livre</option>
                <option value="amazon">Amazon</option>
                <option value="hotmart">Hotmart</option>
                <option value="kiwify">Kiwify</option>
                <option value="monetizze">Monetizze</option>
                <option value="outro">Outro</option>
              </select>
            </label>

            <label>
              Preço médio
              <input
                value={form.average_price}
                onChange={(event) =>
                  updateForm("average_price", event.target.value)
                }
                placeholder="79.90"
              />
            </label>

            <label>
              Comissão %
              <input
                value={form.commission_percent}
                onChange={(event) =>
                  updateForm("commission_percent", event.target.value)
                }
                placeholder="10"
              />
            </label>

            <label>
              Concorrência
              <select
                value={form.competition_level}
                onChange={(event) =>
                  updateForm("competition_level", event.target.value)
                }
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </label>

            <label>
              Canal de tráfego
              <select
                value={form.traffic_channel}
                onChange={(event) =>
                  updateForm("traffic_channel", event.target.value)
                }
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
              Público-alvo
              <input
                value={form.target_audience}
                onChange={(event) =>
                  updateForm("target_audience", event.target.value)
                }
                placeholder="Ex: pessoas que buscam praticidade"
              />
            </label>

            <label>
              Link do produto ou afiliado
              <input
                value={form.product_url}
                onChange={(event) =>
                  updateForm("product_url", event.target.value)
                }
                placeholder="https://..."
              />
            </label>
          </div>

          <div className="agentActions">
            <button
              className="primaryButton"
              onClick={analyzeProduct}
              disabled={analyzing || autoPicking}
            >
              {analyzing ? "Analisando..." : "Analisar Produto"}
            </button>

            <button
              onClick={useAutoPickProduct}
              disabled={autoPicking || analyzing}
            >
              {autoPicking ? "Buscando Auto Pick..." : "Usar Auto Pick"}
            </button>

            <button onClick={loadHistory} disabled={loadingHistory}>
              {loadingHistory ? "Atualizando..." : "Atualizar histórico"}
            </button>
          </div>

          {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          {successMessage && <p className="successMessage">{successMessage}</p>}
          {copyMessage && <p className="successMessage">{copyMessage}</p>}

          {autoPickProduct && (
            <div className="agentInfoBox">
              <span>Produto carregado do Catálogo</span>

              <p>
                <strong>{autoPickProduct.product_name}</strong> foi escolhido
                automaticamente. Status: {autoPickProduct.status} • Marketplace:{" "}
                {formatMarketplace(autoPickProduct.marketplace)} • Comissão:{" "}
                {autoPickProduct.commission_percent}%.
              </p>
            </div>
          )}
        </div>

        <div className="agentHistoryCard">
          <div className="agentSectionHeader">
            <div>
              <span>Histórico</span>
              <h3>Histórico de análises</h3>
            </div>

            <button onClick={loadHistory} disabled={loadingHistory}>
              {loadingHistory ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {history.length === 0 ? (
            <div className="agentEmptyBox">
              Nenhuma análise salva pelo Product Hunter.
            </div>
          ) : (
            <div className="agentHistoryList">
              {history.map((item) => (
                <button
                  key={item.id}
                  className={`agentHistoryItem ${
                    result?.id === item.id ? "active" : ""
                  }`}
                  onClick={() => openHistoryItem(item.id)}
                  disabled={openingId === item.id}
                >
                  <div>
                    <span>{item.decision}</span>
                    <strong>{item.product_name}</strong>
                    <p>
                      {formatMarketplace(item.marketplace)} • {item.niche}
                    </p>
                    <small>{formatDate(item.created_at)}</small>
                  </div>

                  <div>
                    <strong>{item.score}</strong>
                    <p>{openingId === item.id ? "Abrindo..." : "score"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="agentResultCard">
          <div className="agentResultHeader">
            <div>
              <span>Resultado da análise</span>

              <h3>{result.product_name}</h3>

              <p>
                {result.decision} • Score {result.score} •{" "}
                {formatDate(result.created_at)}
              </p>
            </div>

            <button onClick={copyAnalysis}>Copiar análise</button>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Nicho</span>
              <strong>{result.niche}</strong>
            </div>

            <div>
              <span>Marketplace</span>
              <strong>{formatMarketplace(result.marketplace)}</strong>
            </div>

            <div>
              <span>Preço médio</span>
              <strong>R$ {Number(result.average_price || 0).toFixed(2)}</strong>
            </div>

            <div>
              <span>Comissão</span>
              <strong>{result.commission_percent}%</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{result.status}</strong>
            </div>

            <div>
              <span>Agente</span>
              <strong>{result.agent}</strong>
            </div>
          </div>

          <div className="agentResultGrid">
            <div>
              <span>Resumo</span>
              <p>{result.summary}</p>
            </div>

            <div>
              <span>Público-alvo</span>
              <p>{result.target_audience}</p>
            </div>
          </div>

          <div className="agentResultLists">
            <div>
              <h4>Pontos fortes</h4>

              <ul>
                {result.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Pontos fracos</h4>

              <ul>
                {result.weaknesses.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Oportunidades</h4>

              <ul>
                {result.opportunities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Riscos</h4>

              <ul>
                {result.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Ângulos de conteúdo</h4>

              <ul>
                {result.content_angles.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Canais recomendados</h4>

              <ul>
                {result.recommended_channels.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <details className="agentRawDetails">
            <summary>Ver pacote técnico completo</summary>

            <pre>{JSON.stringify(result.analysis_package, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}