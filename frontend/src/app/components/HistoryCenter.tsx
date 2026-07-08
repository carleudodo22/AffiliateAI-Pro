"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type HistoryCenterProps = {
  token: string;
};

type HistoryType =
  | "all"
  | "autopilot"
  | "product_hunter"
  | "content_generator"
  | "creative_image"
  | "campaign_package";

type HistoryRealType = Exclude<HistoryType, "all">;

type HistoryItem = {
  id: number;
  type: HistoryRealType;
  title: string;
  subtitle: string;
  meta: string;
  date: string;
  score?: string;
  decision?: string;
  raw: Record<string, any>;
};

type DetailState = {
  type: HistoryRealType;
  data: Record<string, any>;
} | null;

export default function HistoryCenter({ token }: HistoryCenterProps) {
  const [activeFilter, setActiveFilter] = useState<HistoryType>("all");

  const [autopilotHistory, setAutopilotHistory] = useState<HistoryItem[]>([]);
  const [productHunterHistory, setProductHunterHistory] = useState<HistoryItem[]>(
    []
  );
  const [contentHistory, setContentHistory] = useState<HistoryItem[]>([]);
  const [creativeHistory, setCreativeHistory] = useState<HistoryItem[]>([]);
  const [packageHistory, setPackageHistory] = useState<HistoryItem[]>([]);

  const [detail, setDetail] = useState<DetailState>(null);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [lastSync, setLastSync] = useState("");

  useEffect(() => {
    loadAllHistory();

    window.addEventListener("autopilot-history-updated", loadAllHistory);
    window.addEventListener("product-hunter-history-updated", loadAllHistory);
    window.addEventListener("content-generator-history-updated", loadAllHistory);
    window.addEventListener("creative-image-history-updated", loadAllHistory);
    window.addEventListener("campaign-package-history-updated", loadAllHistory);

    return () => {
      window.removeEventListener("autopilot-history-updated", loadAllHistory);
      window.removeEventListener("product-hunter-history-updated", loadAllHistory);
      window.removeEventListener(
        "content-generator-history-updated",
        loadAllHistory
      );
      window.removeEventListener("creative-image-history-updated", loadAllHistory);
      window.removeEventListener(
        "campaign-package-history-updated",
        loadAllHistory
      );
    };
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function formatDate(value?: string) {
    if (!value) return "Data não encontrada";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function copyText(text: string, message = "Copiado com sucesso.") {
    navigator.clipboard.writeText(text);
    setCopyMessage(message);
  }

  async function fetchHistory(endpoint: string) {
    const currentToken = getToken();

    if (!currentToken) {
      return [];
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
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

  async function loadAllHistory() {
    setLoading(true);
    setErrorMessage("");
    setCopyMessage("");

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

      setAutopilotHistory(
        autopilotData.map((item: Record<string, any>) => ({
          id: Number(item.id),
          type: "autopilot",
          title: item.selected_product || "Campanha Autopilot",
          subtitle: `${item.niche || "nicho"} • ${
            item.marketplace || "marketplace"
          } • ${item.main_channel || "canal"}`,
          meta: "Autopilot",
          date: item.created_at,
          score: item.score ? `${item.score}/100` : undefined,
          decision: item.decision,
          raw: item,
        }))
      );

      setProductHunterHistory(
        productHunterData.map((item: Record<string, any>) => ({
          id: Number(item.id ?? item.analysis_id),
          type: "product_hunter",
          title: item.product_name || item.selected_product || "Produto analisado",
          subtitle: `${item.niche || item.category || "nicho"} • ${
            item.marketplace || "marketplace"
          } • ${item.traffic_channel || item.main_channel || "canal"}`,
          meta: "Product Hunter",
          date: item.created_at,
          score:
            item.score || item.final_score
              ? `${item.score || item.final_score}/100`
              : undefined,
          decision: item.decision,
          raw: item,
        }))
      );

      setContentHistory(
        contentData.map((item: Record<string, any>) => ({
          id: Number(item.id),
          type: "content_generator",
          title: item.product_name || "Conteúdo gerado",
          subtitle: `${item.niche || "nicho"} • ${
            item.platform || "plataforma"
          } • ${item.tone || "tom"}`,
          meta: "Content Generator",
          date: item.created_at,
          decision: item.headline,
          raw: item,
        }))
      );

      setCreativeHistory(
        creativeData.map((item: Record<string, any>) => ({
          id: Number(item.id ?? item.creative_id),
          type: "creative_image",
          title: item.product_name || "Criativo visual",
          subtitle: `${item.niche || "nicho"} • ${
            item.platform || "plataforma"
          } • ${item.creative_style || "estilo"}`,
          meta: "Creative Image",
          date: item.created_at,
          decision: item.art_headline,
          raw: item,
        }))
      );

      setPackageHistory(
        packageData.map((item: Record<string, any>) => ({
          id: Number(item.id),
          type: "campaign_package",
          title: item.product_name || "Pacote de campanha",
          subtitle: `${item.niche || "nicho"} • ${
            item.marketplace || "marketplace"
          }`,
          meta: "Campaign Package",
          date: item.created_at,
          score: item.score ? `${item.score}/100` : undefined,
          decision: item.decision,
          raw: item,
        }))
      );

      setLastSync(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar histórico geral.");
      }
    } finally {
      setLoading(false);
    }
  }

  const allItems = useMemo(() => {
    return [
      ...autopilotHistory,
      ...productHunterHistory,
      ...contentHistory,
      ...creativeHistory,
      ...packageHistory,
    ].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      return dateB - dateA;
    });
  }, [
    autopilotHistory,
    productHunterHistory,
    contentHistory,
    creativeHistory,
    packageHistory,
  ]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return allItems;
    }

    return allItems.filter((item) => item.type === activeFilter);
  }, [activeFilter, allItems]);

  const filterOptions = [
    {
      key: "all" as HistoryType,
      label: "Tudo",
      count: allItems.length,
    },
    {
      key: "autopilot" as HistoryType,
      label: "Autopilot",
      count: autopilotHistory.length,
    },
    {
      key: "product_hunter" as HistoryType,
      label: "Product Hunter",
      count: productHunterHistory.length,
    },
    {
      key: "content_generator" as HistoryType,
      label: "Content",
      count: contentHistory.length,
    },
    {
      key: "creative_image" as HistoryType,
      label: "Creative",
      count: creativeHistory.length,
    },
    {
      key: "campaign_package" as HistoryType,
      label: "Packages",
      count: packageHistory.length,
    },
  ];

  async function openDetail(item: HistoryItem) {
    setLoadingDetail(true);
    setErrorMessage("");
    setCopyMessage("");

    const endpointByType: Record<HistoryRealType, string> = {
      autopilot: "/api/autopilot",
      product_hunter: "/api/product-hunter",
      content_generator: "/api/content-generator",
      creative_image: "/api/creative-image",
      campaign_package: "/api/campaign-package",
    };

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para abrir o histórico.");
      }

      const response = await fetch(`${API_URL}${endpointByType[item.type]}/${item.id}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setDetail({
        type: item.type,
        data,
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir detalhe.");
      }
    } finally {
      setLoadingDetail(false);
    }
  }

  function getDetailTitle() {
    if (!detail) return "Selecione um registro";

    if (detail.type === "autopilot") return "Autopilot";
    if (detail.type === "product_hunter") return "Product Hunter";
    if (detail.type === "content_generator") return "Content Generator";
    if (detail.type === "creative_image") return "Creative Image";

    return "Campaign Package";
  }

  function getDetailSubtitle() {
    if (!detail) return "Escolha um item da lista para visualizar os detalhes.";

    if (detail.type === "autopilot") {
      return detail.data.selected_product || "Campanha aberta";
    }

    if (detail.type === "product_hunter") {
      return (
        detail.data.product_name ||
        detail.data?.product?.name ||
        detail.data.name ||
        "Produto analisado"
      );
    }

    if (detail.type === "content_generator") {
      return detail.data.product_name || "Conteúdo gerado";
    }

    if (detail.type === "creative_image") {
      return detail.data.product_name || "Criativo visual";
    }

    return detail.data.product_name || "Pacote final salvo";
  }

  function renderCopyBox(title: string, text: string, message: string) {
    return (
      <div className="historyPro__detailBox">
        <div>
          <h4>{title}</h4>
          <button onClick={() => copyText(text || "", message)}>Copiar</button>
        </div>

        <p>{text || "Não gerado."}</p>
      </div>
    );
  }

  function renderAutopilotDetail(data: Record<string, any>) {
    return (
      <div className="historyPro__detailContent">
        <div className="historyPro__detailMetrics">
          <div>
            <span>Produto</span>
            <strong>{data.selected_product || "Não encontrado"}</strong>
          </div>

          <div>
            <span>Score</span>
            <strong>{data.score || "--"}/100</strong>
          </div>

          <div>
            <span>Nicho</span>
            <strong>{data.niche || "Não encontrado"}</strong>
          </div>

          <div>
            <span>Canal</span>
            <strong>{data.main_channel || "Não encontrado"}</strong>
          </div>
        </div>

        {renderCopyBox("Estratégia", data.strategy, "Estratégia copiada.")}
        {renderCopyBox("Copy curta", data.short_copy, "Copy copiada.")}
        {renderCopyBox("Roteiro de vídeo", data.video_script, "Roteiro copiado.")}
        {renderCopyBox("Briefing de imagem", data.image_brief, "Briefing copiado.")}
      </div>
    );
  }

  function renderProductHunterDetail(data: Record<string, any>) {
    const score =
      data?.score?.final_score ||
      data?.final_score ||
      data?.score ||
      data?.analysis?.score?.final_score ||
      "--";

    const strategy =
      data?.strategy?.positioning ||
      data.strategy ||
      data?.analysis?.strategy?.positioning ||
      "Estratégia não gerada.";

    return (
      <div className="historyPro__detailContent">
        <div className="historyPro__detailMetrics">
          <div>
            <span>Produto</span>
            <strong>
              {data.product_name || data?.product?.name || data.name || "Produto"}
            </strong>
          </div>

          <div>
            <span>Score</span>
            <strong>{score}/100</strong>
          </div>

          <div>
            <span>Marketplace</span>
            <strong>{data.marketplace || "Não encontrado"}</strong>
          </div>

          <div>
            <span>Decisão</span>
            <strong>{data.decision || data.recommendation || "Análise"}</strong>
          </div>
        </div>

        {renderCopyBox("Estratégia recomendada", strategy, "Estratégia copiada.")}
      </div>
    );
  }

  function renderContentDetail(data: Record<string, any>) {
    return (
      <div className="historyPro__detailContent">
        <div className="historyPro__detailMetrics">
          <div>
            <span>Produto</span>
            <strong>{data.product_name || "Produto"}</strong>
          </div>

          <div>
            <span>Nicho</span>
            <strong>{data.niche || "Nicho"}</strong>
          </div>

          <div>
            <span>Plataforma</span>
            <strong>{data.platform || "Plataforma"}</strong>
          </div>

          <div>
            <span>Tom</span>
            <strong>{data.tone || "Tom"}</strong>
          </div>
        </div>

        {renderCopyBox("Headline", data.headline, "Headline copiada.")}
        {renderCopyBox("Copy curta", data.short_copy, "Copy copiada.")}
        {renderCopyBox("Legenda", data.caption, "Legenda copiada.")}
        {renderCopyBox("Roteiro de vídeo", data.video_script, "Roteiro copiado.")}
        {renderCopyBox("WhatsApp", data.whatsapp_text, "Texto copiado.")}
      </div>
    );
  }

  function renderCreativeDetail(data: Record<string, any>) {
    return (
      <div className="historyPro__detailContent">
        <div className="historyPro__detailMetrics">
          <div>
            <span>Produto</span>
            <strong>{data.product_name || "Produto"}</strong>
          </div>

          <div>
            <span>Nicho</span>
            <strong>{data.niche || "Nicho"}</strong>
          </div>

          <div>
            <span>Plataforma</span>
            <strong>{data.platform || "Plataforma"}</strong>
          </div>

          <div>
            <span>Estilo</span>
            <strong>{data.creative_style || "Estilo"}</strong>
          </div>
        </div>

        {renderCopyBox("Título da arte", data.art_headline, "Título copiado.")}
        {renderCopyBox("Subtítulo", data.art_subtitle, "Subtítulo copiado.")}
        {renderCopyBox("CTA", data.cta, "CTA copiado.")}
        {renderCopyBox("Briefing visual", data.visual_brief, "Briefing copiado.")}
        {renderCopyBox("Prompt de imagem", data.image_prompt, "Prompt copiado.")}
      </div>
    );
  }

  function renderPackageDetail(data: Record<string, any>) {
    const packageText =
      typeof data.package_text === "string"
        ? data.package_text
        : "Texto do pacote não encontrado.";

    return (
      <div className="historyPro__detailContent">
        <div className="historyPro__detailMetrics">
          <div>
            <span>Produto</span>
            <strong>{data.product_name || "Produto"}</strong>
          </div>

          <div>
            <span>Nicho</span>
            <strong>{data.niche || "Nicho"}</strong>
          </div>

          <div>
            <span>Marketplace</span>
            <strong>{data.marketplace || "Marketplace"}</strong>
          </div>

          <div>
            <span>Score</span>
            <strong>{data.score || "--"}/100</strong>
          </div>
        </div>

        <div className="historyPro__packageBox">
          <div>
            <h4>Pacote completo salvo</h4>
            <button
              onClick={() =>
                copyText(packageText, "Pacote de campanha copiado.")
              }
            >
              Copiar pacote
            </button>
          </div>

          <textarea readOnly value={packageText} />
        </div>
      </div>
    );
  }

  function renderDetail() {
    if (!detail) {
      return (
        <div className="historyPro__detailEmpty">
          <div>
            <span>Nenhum registro aberto</span>
            <h4>Selecione um item do histórico</h4>
            <p>
              Ao clicar em um registro, o AffiliateAI Pro carrega o detalhe
              completo direto do backend.
            </p>
          </div>
        </div>
      );
    }

    if (detail.type === "autopilot") return renderAutopilotDetail(detail.data);
    if (detail.type === "product_hunter") {
      return renderProductHunterDetail(detail.data);
    }
    if (detail.type === "content_generator") {
      return renderContentDetail(detail.data);
    }
    if (detail.type === "creative_image") return renderCreativeDetail(detail.data);

    return renderPackageDetail(detail.data);
  }

  return (
    <section className="historyPro">
      <div className="historyPro__hero">
        <div>
          <span className="historyPro__eyebrow">Histórico Geral</span>

          <h2>Central de Histórico</h2>

          <p>
            Consulte tudo que foi gerado no AffiliateAI Pro em um só lugar:
            campanhas, análises, conteúdos, criativos visuais e pacotes finais
            salvos no banco.
          </p>
        </div>

        <div className="historyPro__status">
          <span>Total de registros</span>
          <strong>{allItems.length}</strong>
          <p>{loading ? "Atualizando histórico..." : "Histórico sincronizado"}</p>
          <small>Última sincronização: {lastSync || "--:--:--"}</small>
        </div>
      </div>

      <div className="historyPro__toolbar">
        <div className="historyPro__filters">
          {filterOptions.map((filter) => (
            <button
              key={filter.key}
              className={activeFilter === filter.key ? "active" : ""}
              onClick={() => setActiveFilter(filter.key)}
            >
              <span>{filter.label}</span>
              <strong>{filter.count}</strong>
            </button>
          ))}
        </div>

        <button
          className="historyPro__refreshButton"
          onClick={loadAllHistory}
          disabled={loading}
        >
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
      {copyMessage && <p className="successMessage">{copyMessage}</p>}

      <div className="historyPro__layout">
        <div className="historyPro__listPanel">
          <div className="historyPro__sectionTitle">
            <div>
              <span>Registros</span>
              <h3>{filteredItems.length} itens encontrados</h3>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="historyPro__emptyList">
              Nenhum item encontrado nesse filtro ainda.
            </div>
          ) : (
            <div className="historyPro__list">
              {filteredItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  className={`historyPro__item ${
                    detail?.type === item.type && detail?.data?.id === item.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() => openDetail(item)}
                >
                  <div className="historyPro__itemMain">
                    <span>{item.meta}</span>
                    <strong>{item.title}</strong>
                    <p>{item.subtitle}</p>
                    <small>{formatDate(item.date)}</small>
                  </div>

                  <div className="historyPro__itemSide">
                    {item.score && <strong>{item.score}</strong>}
                    {item.decision && <span>{item.decision}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="historyPro__detailPanel">
          <div className="historyPro__detailHeader">
            <div>
              <span>Detalhes</span>
              <h3>{loadingDetail ? "Carregando..." : getDetailTitle()}</h3>
              <p>{getDetailSubtitle()}</p>
            </div>

            {detail && (
              <button onClick={() => setDetail(null)}>Fechar</button>
            )}
          </div>

          {renderDetail()}
        </div>
      </div>
    </section>
  );
}