"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type HistoryType =
  | "autopilot"
  | "product_hunter"
  | "content_generator"
  | "creative_image"
  | "campaign_package";

type FilterType = "all" | HistoryType;

type HistorySource = {
  type: HistoryType;
  label: string;
  shortLabel: string;
  historyEndpoint: string;
  detailEndpoint: (id: number) => string;
  deleteEndpoint: (id: number) => string;
};

type HistoryItem = {
  key: string;
  id: number;
  type: HistoryType;
  title: string;
  subtitle: string;
  badge: string;
  meta: string;
  created_at: string;
  raw: Record<string, unknown>;
};

type HistoryDetail = {
  item: HistoryItem;
  data: Record<string, unknown>;
};

type HistoryCenterProps = {
  token: string;
};

const HISTORY_SOURCES: HistorySource[] = [
  {
    type: "autopilot",
    label: "Autopilot",
    shortLabel: "Auto",
    historyEndpoint: "/api/autopilot/history",
    detailEndpoint: (id) => `/api/autopilot/${id}`,
    deleteEndpoint: (id) => `/api/autopilot/${id}`,
  },
  {
    type: "product_hunter",
    label: "Product Hunter",
    shortLabel: "Hunter",
    historyEndpoint: "/api/product-hunter/history",
    detailEndpoint: (id) => `/api/product-hunter/${id}`,
    deleteEndpoint: (id) => `/api/product-hunter/${id}`,
  },
  {
    type: "content_generator",
    label: "Content Generator",
    shortLabel: "Content",
    historyEndpoint: "/api/content-generator/history",
    detailEndpoint: (id) => `/api/content-generator/${id}`,
    deleteEndpoint: (id) => `/api/content-generator/${id}`,
  },
  {
    type: "creative_image",
    label: "Creative Image",
    shortLabel: "Creative",
    historyEndpoint: "/api/creative-image/history",
    detailEndpoint: (id) => `/api/creative-image/${id}`,
    deleteEndpoint: (id) => `/api/creative-image/${id}`,
  },
  {
    type: "campaign_package",
    label: "Campaign Package",
    shortLabel: "Package",
    historyEndpoint: "/api/campaign-package/history",
    detailEndpoint: (id) => `/api/campaign-package/${id}`,
    deleteEndpoint: (id) => `/api/campaign-package/${id}`,
  },
];

export default function HistoryCenter({ token }: HistoryCenterProps) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<HistoryDetail | null>(
    null
  );

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingKey, setDeletingKey] = useState("");

  const [pendingDeleteItem, setPendingDeleteItem] =
    useState<HistoryItem | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function getSource(type: HistoryType) {
    return HISTORY_SOURCES.find((source) => source.type === type);
  }

  function getTypeLabel(type: HistoryType) {
    return getSource(type)?.label || type;
  }

  function getValue(
    data: Record<string, unknown>,
    keys: string[],
    fallback = "--"
  ) {
    for (const key of keys) {
      const value = data[key];

      if (value !== undefined && value !== null && value !== "") {
        return String(value);
      }
    }

    return fallback;
  }

  function getListValue(data: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = data[key];

      if (Array.isArray(value)) {
        return value.map((item) => String(item));
      }
    }

    return [];
  }

  function formatDate(value?: string) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function normalizeItem(
    source: HistorySource,
    rawItem: Record<string, unknown>
  ): HistoryItem {
    const id = Number(rawItem.id || 0);

    if (source.type === "autopilot") {
      return {
        key: `${source.type}-${id}`,
        id,
        type: source.type,
        title: getValue(rawItem, ["product_name", "niche"], "Autopilot Run"),
        subtitle: getValue(
          rawItem,
          ["decision", "strategy", "status"],
          "Estratégia gerada pelo Autopilot"
        ),
        badge: getValue(rawItem, ["score", "status"], "Auto"),
        meta: getValue(rawItem, ["niche", "marketplace"], "Campanha"),
        created_at: getValue(rawItem, ["created_at"], ""),
        raw: rawItem,
      };
    }

    if (source.type === "product_hunter") {
      return {
        key: `${source.type}-${id}`,
        id,
        type: source.type,
        title: getValue(rawItem, ["product_name"], "Produto analisado"),
        subtitle: getValue(
          rawItem,
          ["decision", "summary", "status"],
          "Análise de oportunidade"
        ),
        badge: getValue(rawItem, ["score", "status"], "Hunter"),
        meta: `${getValue(rawItem, ["niche"], "nicho")} • ${getValue(
          rawItem,
          ["marketplace"],
          "marketplace"
        )}`,
        created_at: getValue(rawItem, ["created_at"], ""),
        raw: rawItem,
      };
    }

    if (source.type === "content_generator") {
      return {
        key: `${source.type}-${id}`,
        id,
        type: source.type,
        title: getValue(rawItem, ["product_name"], "Conteúdo gerado"),
        subtitle: getValue(
          rawItem,
          ["headline", "short_copy", "status"],
          "Copy, legenda e roteiro"
        ),
        badge: getValue(rawItem, ["platform", "status"], "Content"),
        meta: `${getValue(rawItem, ["niche"], "nicho")} • ${getValue(
          rawItem,
          ["tone"],
          "tom"
        )}`,
        created_at: getValue(rawItem, ["created_at"], ""),
        raw: rawItem,
      };
    }

    if (source.type === "creative_image") {
      return {
        key: `${source.type}-${id}`,
        id,
        type: source.type,
        title: getValue(rawItem, ["product_name"], "Criativo visual"),
        subtitle: getValue(
          rawItem,
          ["art_headline", "visual_brief", "status"],
          "Prompt e direção visual"
        ),
        badge: getValue(rawItem, ["creative_style", "status"], "Creative"),
        meta: `${getValue(rawItem, ["niche"], "nicho")} • ${getValue(
          rawItem,
          ["platform"],
          "plataforma"
        )}`,
        created_at: getValue(rawItem, ["created_at"], ""),
        raw: rawItem,
      };
    }

    return {
      key: `${source.type}-${id}`,
      id,
      type: source.type,
      title: getValue(rawItem, ["product_name"], "Pacote de campanha"),
      subtitle: getValue(
        rawItem,
        ["decision", "status"],
        "Pacote final salvo"
      ),
      badge: getValue(rawItem, ["score", "status"], "Package"),
      meta: `${getValue(rawItem, ["niche"], "nicho")} • ${getValue(
        rawItem,
        ["marketplace"],
        "marketplace"
      )}`,
      created_at: getValue(rawItem, ["created_at"], ""),
      raw: rawItem,
    };
  }

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        throw new Error("Você precisa estar logado para carregar o histórico.");
      }

      const responses = await Promise.allSettled(
        HISTORY_SOURCES.map(async (source) => {
          const response = await fetch(`${API_URL}${source.historyEndpoint}`, {
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

          return data.map((entry) => normalizeItem(source, entry));
        })
      );

      const allItems = responses.flatMap((response) => {
        if (response.status === "fulfilled") {
          return response.value;
        }

        return [];
      });

      allItems.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();

        return dateB - dateA;
      });

      setItems(allItems);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar histórico.");
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadHistory();

    const events = [
      "autopilot-history-updated",
      "product-hunter-history-updated",
      "content-generator-history-updated",
      "creative-image-history-updated",
      "campaign-package-history-updated",
    ];

    events.forEach((eventName) => {
      window.addEventListener(eventName, loadHistory);
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, loadHistory);
      });
    };
  }, [loadHistory]);

  async function loadDetail(item: HistoryItem) {
    setDetailLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para abrir o histórico.");
      }

      const source = getSource(item.type);

      if (!source) {
        throw new Error("Tipo de histórico inválido.");
      }

      const response = await fetch(`${API_URL}${source.detailEndpoint(item.id)}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setSelectedDetail({
        item,
        data,
      });
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir detalhe do histórico.");
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function requestDeleteHistoryItem(item: HistoryItem) {
    setPendingDeleteItem(item);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");
  }

  function closeDeleteModal() {
    if (deletingKey) return;

    setPendingDeleteItem(null);
  }

  async function confirmDeleteHistoryItem() {
    if (!pendingDeleteItem) return;

    const item = pendingDeleteItem;

    setDeletingKey(item.key);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para excluir histórico.");
      }

      const source = getSource(item.type);

      if (!source) {
        throw new Error("Tipo de histórico inválido.");
      }

      const response = await fetch(`${API_URL}${source.deleteEndpoint(item.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      setItems((currentItems) =>
        currentItems.filter((historyItem) => historyItem.key !== item.key)
      );

      if (selectedDetail?.item.key === item.key) {
        setSelectedDetail(null);
      }

      setPendingDeleteItem(null);
      setSuccessMessage("Item removido do histórico com sucesso.");

      window.dispatchEvent(
        new Event(`${item.type.replace("_", "-")}-history-updated`)
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao excluir item do histórico.");
      }
    } finally {
      setDeletingKey("");
    }
  }

  async function copyDetail() {
    if (!selectedDetail) return;

    try {
      await navigator.clipboard.writeText(
        JSON.stringify(selectedDetail.data, null, 2)
      );

      setCopyMessage("Detalhe copiado.");
    } catch {
      setCopyMessage("Não foi possível copiar.");
    }
  }

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") {
      return items;
    }

    return items.filter((item) => item.type === activeFilter);
  }, [items, activeFilter]);

  const totalByType = useMemo(() => {
    return {
      all: items.length,
      autopilot: items.filter((item) => item.type === "autopilot").length,
      product_hunter: items.filter((item) => item.type === "product_hunter")
        .length,
      content_generator: items.filter(
        (item) => item.type === "content_generator"
      ).length,
      creative_image: items.filter((item) => item.type === "creative_image")
        .length,
      campaign_package: items.filter(
        (item) => item.type === "campaign_package"
      ).length,
    };
  }, [items]);

  const detailData = selectedDetail?.data || {};

  const detailMainText =
    getValue(
      detailData,
      [
        "summary",
        "package_text",
        "short_copy",
        "caption",
        "visual_brief",
        "decision",
      ],
      ""
    ) || "Abra um item para visualizar o conteúdo gerado.";

  const detailLists = [
    {
      title: "Pontos fortes",
      items: getListValue(detailData, ["strengths"]),
    },
    {
      title: "Oportunidades",
      items: getListValue(detailData, ["opportunities", "content_angles"]),
    },
    {
      title: "Riscos / Atenção",
      items: getListValue(detailData, ["risks", "weaknesses"]),
    },
    {
      title: "Canais recomendados",
      items: getListValue(detailData, ["recommended_channels", "hashtags"]),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section className="historyCenterPro">
      <div className="historyHeroCard">
        <div>
          <span className="historyEyebrow">Histórico Geral</span>

          <h2>Central de Histórico</h2>

          <p>
            Visualize, abra detalhes e exclua registros gerados pelos agentes do
            AffiliateAI Pro.
          </p>
        </div>

        <div className="historyHeroStats">
          <span>Total salvo</span>
          <strong>{items.length}</strong>
          <p>{loading ? "Atualizando histórico..." : "registros encontrados"}</p>
        </div>
      </div>

      <div className="historyQuickStats">
        <div>
          <span>Autopilot</span>
          <strong>{totalByType.autopilot}</strong>
        </div>

        <div>
          <span>Produtos</span>
          <strong>{totalByType.product_hunter}</strong>
        </div>

        <div>
          <span>Conteúdos</span>
          <strong>{totalByType.content_generator}</strong>
        </div>

        <div>
          <span>Criativos</span>
          <strong>{totalByType.creative_image}</strong>
        </div>

        <div>
          <span>Pacotes</span>
          <strong>{totalByType.campaign_package}</strong>
        </div>
      </div>

      <div className="historyFilterPills">
        <button
          className={activeFilter === "all" ? "active" : ""}
          onClick={() => setActiveFilter("all")}
        >
          Tudo <span>{totalByType.all}</span>
        </button>

        {HISTORY_SOURCES.map((source) => (
          <button
            key={source.type}
            className={activeFilter === source.type ? "active" : ""}
            onClick={() => setActiveFilter(source.type)}
          >
            {source.shortLabel} <span>{totalByType[source.type]}</span>
          </button>
        ))}

        <button onClick={loadHistory} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
      {successMessage && <p className="successMessage">{successMessage}</p>}
      {copyMessage && <p className="successMessage">{copyMessage}</p>}

      <div className="historyWorkspace">
        <div className="historyListPanel">
          <div className="historyPanelHeader">
            <div>
              <span>Registros</span>
              <h3>{filteredItems.length} itens encontrados</h3>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="historyEmptyBox">
              Nenhum histórico encontrado para esse filtro.
            </div>
          ) : (
            <div className="historyCardsList">
              {filteredItems.map((item) => (
                <div
                  key={item.key}
                  className={`historyCardItem ${
                    selectedDetail?.item.key === item.key ? "active" : ""
                  }`}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadDetail(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      loadDetail(item);
                    }
                  }}
                >
                  <div className="historyCardContent">
                    <div className="historyCardTop">
                      <span>{getTypeLabel(item.type)}</span>
                      <em>{item.badge}</em>
                    </div>

                    <strong>{item.title}</strong>

                    <p>{item.subtitle}</p>

                    <small>
                      {item.meta} • {formatDate(item.created_at)}
                    </small>
                  </div>

                  <div className="historyCardActions">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        loadDetail(item);
                      }}
                    >
                      Abrir
                    </button>

                    <button
                      type="button"
                      className="historyDeleteButton"
                      disabled={deletingKey === item.key}
                      onClick={(event) => {
                        event.stopPropagation();
                        requestDeleteHistoryItem(item);
                      }}
                    >
                      {deletingKey === item.key ? "Excluindo..." : "Excluir"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="historyDetailPanel">
          {!selectedDetail ? (
            <div className="historyEmptyDetail">
              <span>Detalhe</span>

              <h3>Selecione um registro</h3>

              <p>
                Clique em qualquer item da lista para abrir uma visualização mais
                limpa do histórico.
              </p>
            </div>
          ) : (
            <>
              <div className="historyDetailHeader">
                <div>
                  <span>{getTypeLabel(selectedDetail.item.type)}</span>

                  <h3>{selectedDetail.item.title}</h3>

                  <p>{formatDate(selectedDetail.item.created_at)}</p>
                </div>

                <button onClick={copyDetail}>Copiar JSON</button>
              </div>

              {detailLoading ? (
                <div className="historyEmptyBox">Carregando detalhe...</div>
              ) : (
                <>
                  <div className="historyDetailGrid">
                    <div>
                      <span>ID</span>
                      <strong>{selectedDetail.item.id}</strong>
                    </div>

                    <div>
                      <span>Status / Score</span>
                      <strong>{selectedDetail.item.badge}</strong>
                    </div>

                    <div>
                      <span>Categoria</span>
                      <strong>{getTypeLabel(selectedDetail.item.type)}</strong>
                    </div>

                    <div>
                      <span>Meta</span>
                      <strong>{selectedDetail.item.meta}</strong>
                    </div>
                  </div>

                  <div className="historyMainPreview">
                    <span>Resumo principal</span>
                    <p>{detailMainText}</p>
                  </div>

                  {detailLists.length > 0 && (
                    <div className="historyDetailLists">
                      {detailLists.map((group) => (
                        <div key={group.title}>
                          <h4>{group.title}</h4>

                          <ul>
                            {group.items.slice(0, 6).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  <details className="historyRawDetails">
                    <summary>Ver dados técnicos completos</summary>

                    <pre>{JSON.stringify(selectedDetail.data, null, 2)}</pre>
                  </details>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {pendingDeleteItem && (
        <div className="historyConfirmOverlay" onClick={closeDeleteModal}>
          <div
            className="historyConfirmModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="history-delete-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="historyConfirmTop">
              <div className="historyConfirmIcon">
                <span>!</span>
              </div>

              <div>
                <span className="historyConfirmEyebrow">
                  Confirmar exclusão
                </span>

                <h3 id="history-delete-title">Excluir este registro?</h3>
              </div>
            </div>

            <p>
              Você está prestes a remover este item do histórico. Essa ação não
              pode ser desfeita.
            </p>

            <div className="historyConfirmPreview">
              <span>{getTypeLabel(pendingDeleteItem.type)}</span>

              <strong>{pendingDeleteItem.title}</strong>

              <small>{pendingDeleteItem.meta}</small>
            </div>

            <div className="historyConfirmActions">
              <button
                type="button"
                className="historyCancelModalButton"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingKey)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="historyConfirmDeleteButton"
                onClick={confirmDeleteHistoryItem}
                disabled={Boolean(deletingKey)}
              >
                {deletingKey ? "Excluindo..." : "Excluir registro"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}