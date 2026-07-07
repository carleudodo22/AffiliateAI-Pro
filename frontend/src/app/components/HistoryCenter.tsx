"use client";

import { useEffect, useState } from "react";

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

type HistoryCenterProps = {
  token: string;
};

export default function HistoryCenter({ token }: HistoryCenterProps) {
  const [history, setHistory] = useState<AutopilotHistoryItem[]>([]);
  const [selectedRun, setSelectedRun] = useState<AutopilotResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [opening, setOpening] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadHistory();

    function refreshHistory() {
      loadHistory();
    }

    window.addEventListener("autopilot-history-updated", refreshHistory);

    return () => {
      window.removeEventListener("autopilot-history-updated", refreshHistory);
    };
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  async function loadHistory() {
    setLoading(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/autopilot/history`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AutopilotHistoryItem[] = await response.json();
      setHistory(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar histórico.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function openRun(id: number) {
    setOpening(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado.");
      }

      const response = await fetch(`${API_URL}/api/autopilot/${id}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AutopilotResult = await response.json();
      setSelectedRun(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir campanha.");
      }
    } finally {
      setOpening(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Data não disponível";
    }

    return new Date(date).toLocaleString("pt-BR");
  }

  return (
    <section className="historyCenterPanel">
      <div className="historyCenterHeader">
        <div>
          <span className="historyEyebrow">Central de histórico</span>
          <h2>Histórico Geral</h2>
          <p>
            Consulte todas as campanhas criadas pelo Autopilot, abra detalhes e
            copie os materiais gerados.
          </p>
        </div>

        <button onClick={loadHistory} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar histórico"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      <div className="historyCenterLayout">
        <div className="historyListPanel">
          <div className="historyListHeader">
            <strong>Campanhas salvas</strong>
            <span>{history.length} registro(s)</span>
          </div>

          {history.length === 0 ? (
            <div className="historyEmpty">
              Nenhuma campanha encontrada. Rode o Autopilot para criar o primeiro
              registro.
            </div>
          ) : (
            <div className="historyList">
              {history.map((item) => (
                <button
                  key={item.id}
                  className={
                    selectedRun?.id === item.id
                      ? "historyItem active"
                      : "historyItem"
                  }
                  onClick={() => openRun(item.id)}
                  disabled={opening}
                >
                  <div>
                    <strong>{item.selected_product}</strong>
                    <span>
                      {item.niche} • {item.marketplace} • {item.main_channel}
                    </span>
                    <small>{formatDate(item.created_at)}</small>
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

        <div className="historyDetailsPanel">
          {!selectedRun ? (
            <div className="historyDetailsEmpty">
              <span>Selecione uma campanha</span>
              <h3>Abra um item do histórico</h3>
              <p>
                Ao abrir uma campanha, os detalhes aparecem aqui com estratégia,
                copy, roteiro, brief de imagem, narração e checklist.
              </p>
            </div>
          ) : (
            <>
              <div className="historyDetailsHero">
                <div>
                  <span>Campanha selecionada</span>
                  <h3>{selectedRun.selected_product}</h3>
                  <p>
                    {selectedRun.niche} • {selectedRun.marketplace} •{" "}
                    {formatDate(selectedRun.created_at)}
                  </p>
                </div>

                <div>
                  <span>Score</span>
                  <strong>{selectedRun.score}/100</strong>
                  <small>{selectedRun.decision}</small>
                </div>
              </div>

              <div className="historyDetailMetrics">
                <div>
                  <span>Demanda</span>
                  <strong>
                    {selectedRun.campaign_package.market_analysis
                      ?.demand_score ?? "--"}
                  </strong>
                </div>

                <div>
                  <span>Concorrência</span>
                  <strong>
                    {selectedRun.campaign_package.market_analysis
                      ?.competition_score ?? "--"}
                  </strong>
                </div>

                <div>
                  <span>Visual</span>
                  <strong>
                    {selectedRun.campaign_package.market_analysis
                      ?.visual_strength ?? "--"}
                  </strong>
                </div>

                <div>
                  <span>Impulso</span>
                  <strong>
                    {selectedRun.campaign_package.market_analysis?.impulse_buy ??
                      "--"}
                  </strong>
                </div>
              </div>

              <div className="historyDetailGrid">
                <div className="historyDetailCard">
                  <h4>Estratégia</h4>
                  <p>{selectedRun.strategy}</p>
                  <button onClick={() => copyText(selectedRun.strategy)}>
                    Copiar
                  </button>
                </div>

                <div className="historyDetailCard">
                  <h4>Headline</h4>
                  <p>{selectedRun.headline}</p>
                  <button onClick={() => copyText(selectedRun.headline)}>
                    Copiar
                  </button>
                </div>

                <div className="historyDetailCard">
                  <h4>Copy curta</h4>
                  <p>{selectedRun.short_copy}</p>
                  <button onClick={() => copyText(selectedRun.short_copy)}>
                    Copiar
                  </button>
                </div>

                <div className="historyDetailCard">
                  <h4>Roteiro de vídeo</h4>
                  <p>{selectedRun.video_script}</p>
                  <button onClick={() => copyText(selectedRun.video_script)}>
                    Copiar
                  </button>
                </div>

                <div className="historyDetailCard">
                  <h4>Brief de imagem</h4>
                  <p>{selectedRun.image_brief}</p>
                  <button onClick={() => copyText(selectedRun.image_brief)}>
                    Copiar
                  </button>
                </div>

                <div className="historyDetailCard">
                  <h4>Narração</h4>
                  <p>{selectedRun.voiceover_script}</p>
                  <button onClick={() => copyText(selectedRun.voiceover_script)}>
                    Copiar
                  </button>
                </div>
              </div>

              <div className="historyDetailCard">
                <h4>Checklist</h4>
                <ul>
                  {selectedRun.checklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}