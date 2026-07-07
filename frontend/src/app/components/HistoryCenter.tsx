"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type HistoryCenterProps = {
  token: string;
};

type HistoryType = "all" | "autopilot" | "product_hunter" | "content_generator";

type HistoryRecord = {
  id: number;
  type: "autopilot" | "product_hunter" | "content_generator";
  title: string;
  subtitle: string;
  score?: number | string;
  status: string;
  created_at?: string;
  raw: Record<string, any>;
};

export default function HistoryCenter({ token }: HistoryCenterProps) {
  const [activeType, setActiveType] = useState<HistoryType>("all");
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(
    null
  );
  const [selectedDetails, setSelectedDetails] = useState<Record<string, any> | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadHistory();

    function refreshHistory() {
      loadHistory();
    }

    window.addEventListener("autopilot-history-updated", refreshHistory);
    window.addEventListener("product-hunter-history-updated", refreshHistory);
    window.addEventListener("content-generator-history-updated", refreshHistory);

    return () => {
      window.removeEventListener("autopilot-history-updated", refreshHistory);
      window.removeEventListener(
        "product-hunter-history-updated",
        refreshHistory
      );
      window.removeEventListener(
        "content-generator-history-updated",
        refreshHistory
      );
    };
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function formatDate(date?: string) {
    if (!date) {
      return "Sem data";
    }

    return new Date(date).toLocaleString("pt-BR");
  }

  function formatType(type: HistoryRecord["type"]) {
    if (type === "autopilot") return "Autopilot";
    if (type === "product_hunter") return "Product Hunter";
    return "Content Generator";
  }

  function getEndpointByType(type: HistoryRecord["type"], id: number) {
    if (type === "autopilot") return `${API_URL}/api/autopilot/${id}`;
    if (type === "product_hunter") return `${API_URL}/api/product-hunter/${id}`;
    return `${API_URL}/api/content-generator/${id}`;
  }

  async function loadHistory() {
    setLoading(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        setRecords([]);
        return;
      }

      const requestHeaders = {
        Authorization: `Bearer ${currentToken}`,
      };

      const [autopilotResponse, productHunterResponse, contentResponse] =
        await Promise.allSettled([
          fetch(`${API_URL}/api/autopilot/history`, {
            headers: requestHeaders,
          }),
          fetch(`${API_URL}/api/product-hunter/history`, {
            headers: requestHeaders,
          }),
          fetch(`${API_URL}/api/content-generator/history`, {
            headers: requestHeaders,
          }),
        ]);

      const allRecords: HistoryRecord[] = [];

      if (
        autopilotResponse.status === "fulfilled" &&
        autopilotResponse.value.ok
      ) {
        const autopilotData = await autopilotResponse.value.json();

        if (Array.isArray(autopilotData)) {
          for (const item of autopilotData) {
            allRecords.push({
              id: Number(item.id),
              type: "autopilot",
              title: item.selected_product || "Campanha Autopilot",
              subtitle: `${item.niche || "nicho"} • ${
                item.marketplace || "marketplace"
              } • ${item.main_channel || "canal"}`,
              score: item.score,
              status: item.status || "completed",
              created_at: item.created_at,
              raw: item,
            });
          }
        }
      }

      if (
        productHunterResponse.status === "fulfilled" &&
        productHunterResponse.value.ok
      ) {
        const productHunterData = await productHunterResponse.value.json();

        if (Array.isArray(productHunterData)) {
          for (const item of productHunterData) {
            allRecords.push({
              id: Number(item.id ?? item.analysis_id),
              type: "product_hunter",
              title:
                item.product_name ||
                item.selected_product ||
                item.name ||
                "Análise de produto",
              subtitle: `${item.niche || item.category || "nicho"} • ${
                item.marketplace || "marketplace"
              } • ${item.traffic_channel || item.main_channel || "canal"}`,
              score:
                item?.score?.final_score ??
                item.final_score ??
                item.score ??
                "--",
              status: item.status || "completed",
              created_at: item.created_at,
              raw: item,
            });
          }
        }
      }

      if (contentResponse.status === "fulfilled" && contentResponse.value.ok) {
        const contentData = await contentResponse.value.json();

        if (Array.isArray(contentData)) {
          for (const item of contentData) {
            allRecords.push({
              id: Number(item.id),
              type: "content_generator",
              title: item.product_name || "Conteúdo gerado",
              subtitle: `${item.niche || "nicho"} • ${
                item.platform || "plataforma"
              } • ${item.tone || "tom"}`,
              status: item.status || "completed",
              created_at: item.created_at,
              raw: item,
            });
          }
        }
      }

      allRecords.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setRecords(allRecords);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar histórico.");
      }

      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  async function openRecord(record: HistoryRecord) {
    setSelectedRecord(record);
    setSelectedDetails(null);
    setLoadingDetails(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado.");
      }

      const response = await fetch(getEndpointByType(record.type, record.id), {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();
      setSelectedDetails(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir item do histórico.");
      }
    } finally {
      setLoadingDetails(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function getDetailValue(keys: string[], fallback = "") {
    if (!selectedDetails) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, selectedDetails);

      if (value) return String(value);
    }

    return fallback;
  }

  function getDetailList(keys: string[], fallback: string[] = []) {
    if (!selectedDetails) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, selectedDetails);

      if (Array.isArray(value)) return value.map(String);
    }

    return fallback;
  }

  const filteredRecords = useMemo(() => {
    if (activeType === "all") {
      return records;
    }

    return records.filter((record) => record.type === activeType);
  }, [records, activeType]);

  const counters = useMemo(() => {
    return {
      all: records.length,
      autopilot: records.filter((record) => record.type === "autopilot").length,
      product_hunter: records.filter(
        (record) => record.type === "product_hunter"
      ).length,
      content_generator: records.filter(
        (record) => record.type === "content_generator"
      ).length,
    };
  }, [records]);

  return (
    <section className="historyCenterPanel">
      <div className="historyCenterHeader">
        <div>
          <span className="historyEyebrow">Histórico Geral</span>

          <h2>Central de Histórico</h2>

          <p>
            Veja campanhas do Autopilot, análises do Product Hunter e conteúdos
            gerados pelo Content Generator em um só lugar.
          </p>
        </div>

        <button onClick={loadHistory} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar histórico"}
        </button>
      </div>

      <div className="historyTabs">
        <button
          className={activeType === "all" ? "active" : ""}
          onClick={() => setActiveType("all")}
        >
          Tudo <span>{counters.all}</span>
        </button>

        <button
          className={activeType === "autopilot" ? "active" : ""}
          onClick={() => setActiveType("autopilot")}
        >
          Autopilot <span>{counters.autopilot}</span>
        </button>

        <button
          className={activeType === "product_hunter" ? "active" : ""}
          onClick={() => setActiveType("product_hunter")}
        >
          Product Hunter <span>{counters.product_hunter}</span>
        </button>

        <button
          className={activeType === "content_generator" ? "active" : ""}
          onClick={() => setActiveType("content_generator")}
        >
          Content Generator <span>{counters.content_generator}</span>
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      <div className="historyLayout">
        <div className="historyListPanel">
          {filteredRecords.length === 0 ? (
            <div className="historyEmpty">
              Nenhum item encontrado nessa categoria ainda.
            </div>
          ) : (
            <div className="historyList">
              {filteredRecords.map((record) => (
                <button
                  key={`${record.type}-${record.id}`}
                  className={`historyItem ${
                    selectedRecord?.id === record.id &&
                    selectedRecord?.type === record.type
                      ? "active"
                      : ""
                  }`}
                  onClick={() => openRecord(record)}
                >
                  <div>
                    <span>{formatType(record.type)}</span>
                    <strong>{record.title}</strong>
                    <p>{record.subtitle}</p>
                  </div>

                  <div>
                    {record.score !== undefined && (
                      <strong>{record.score}/100</strong>
                    )}
                    <span>{formatDate(record.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="historyDetailsPanel">
          {!selectedRecord && (
            <div className="historyEmpty">
              Selecione um item do histórico para ver os detalhes.
            </div>
          )}

          {selectedRecord && loadingDetails && (
            <div className="historyEmpty">Carregando detalhes...</div>
          )}

          {selectedRecord && selectedDetails && (
            <div className="historyDetails">
              <div className="historyDetailsHeader">
                <div>
                  <span>{formatType(selectedRecord.type)}</span>
                  <h3>{selectedRecord.title}</h3>
                  <p>{selectedRecord.subtitle}</p>
                </div>

                <strong>{selectedRecord.status}</strong>
              </div>

              {selectedRecord.type === "autopilot" && (
                <div className="historyDetailsGrid">
                  <div>
                    <h4>Estratégia</h4>
                    <p>{getDetailValue(["strategy"])}</p>
                    <button onClick={() => copyText(getDetailValue(["strategy"]))}>
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Headline</h4>
                    <p>{getDetailValue(["headline"])}</p>
                    <button onClick={() => copyText(getDetailValue(["headline"]))}>
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Copy curta</h4>
                    <p>{getDetailValue(["short_copy"])}</p>
                    <button
                      onClick={() => copyText(getDetailValue(["short_copy"]))}
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Roteiro</h4>
                    <p>{getDetailValue(["video_script"])}</p>
                    <button
                      onClick={() => copyText(getDetailValue(["video_script"]))}
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Brief de imagem</h4>
                    <p>{getDetailValue(["image_brief"])}</p>
                    <button
                      onClick={() => copyText(getDetailValue(["image_brief"]))}
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Narração</h4>
                    <p>{getDetailValue(["voiceover_script"])}</p>
                    <button
                      onClick={() =>
                        copyText(getDetailValue(["voiceover_script"]))
                      }
                    >
                      Copiar
                    </button>
                  </div>
                </div>
              )}

              {selectedRecord.type === "product_hunter" && (
                <div className="historyDetailsGrid">
                  <div>
                    <h4>Produto</h4>
                    <p>
                      {getDetailValue(
                        ["product_name", "product.name", "name"],
                        selectedRecord.title
                      )}
                    </p>
                  </div>

                  <div>
                    <h4>Decisão</h4>
                    <p>
                      {getDetailValue(
                        ["decision", "analysis.decision", "recommendation"],
                        "Análise concluída."
                      )}
                    </p>
                  </div>

                  <div>
                    <h4>Estratégia</h4>
                    <p>
                      {getDetailValue(
                        [
                          "strategy.positioning",
                          "strategy",
                          "analysis.strategy.positioning",
                          "sales_strategy",
                        ],
                        "Use dor clara, demonstração visual e CTA direto."
                      )}
                    </p>
                  </div>

                  <div>
                    <h4>Ideias</h4>
                    <ul>
                      {getDetailList(
                        [
                          "strategy.content_ideas",
                          "analysis.strategy.content_ideas",
                          "content_ideas",
                        ],
                        [
                          "Mostrar antes e depois.",
                          "Fazer demonstração rápida.",
                          "Finalizar com CTA direto.",
                        ]
                      ).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {selectedRecord.type === "content_generator" && (
                <div className="historyDetailsGrid">
                  <div>
                    <h4>Headline</h4>
                    <p>{getDetailValue(["headline"])}</p>
                    <button onClick={() => copyText(getDetailValue(["headline"]))}>
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Copy curta</h4>
                    <p>{getDetailValue(["short_copy"])}</p>
                    <button
                      onClick={() => copyText(getDetailValue(["short_copy"]))}
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Legenda</h4>
                    <p>{getDetailValue(["caption"])}</p>
                    <button onClick={() => copyText(getDetailValue(["caption"]))}>
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Roteiro de vídeo</h4>
                    <p>{getDetailValue(["video_script"])}</p>
                    <button
                      onClick={() => copyText(getDetailValue(["video_script"]))}
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>WhatsApp</h4>
                    <p>{getDetailValue(["whatsapp_text"])}</p>
                    <button
                      onClick={() => copyText(getDetailValue(["whatsapp_text"]))}
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>CTA</h4>
                    <p>{getDetailValue(["cta"])}</p>
                    <button onClick={() => copyText(getDetailValue(["cta"]))}>
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Hashtags</h4>
                    <p>{getDetailList(["hashtags"]).join(" ")}</p>
                    <button
                      onClick={() =>
                        copyText(getDetailList(["hashtags"]).join(" "))
                      }
                    >
                      Copiar
                    </button>
                  </div>

                  <div>
                    <h4>Variações de anúncio</h4>
                    <ul>
                      {getDetailList(["ad_variations"]).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}