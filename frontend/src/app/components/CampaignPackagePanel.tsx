"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CampaignPackagePanelProps = {
  token: string;
};

type CampaignPackageHistoryItem = {
  id: number;
  product_name: string;
  niche: string;
  marketplace: string;
  score: string;
  decision: string;
  status: string;
  created_at: string;
};

type CampaignPackageDetail = {
  id: number;
  user_id: number;
  product_name: string;
  niche: string;
  marketplace: string;
  score: string;
  decision: string;
  package_text: string;
  source_data: Record<string, unknown>;
  status: string;
  created_at: string;
};

type CampaignFlowResponse = {
  status: string;
  message: string;
  saved_package_id: number;
  product: {
    id: number | null;
    product_name: string;
    niche: string;
    marketplace: string;
    average_price: number;
    commission_percent: number;
    product_url: string | null;
    affiliate_link: string | null;
    source: string;
  };
  score: string;
  decision: string;
  headline: string;
  short_copy: string;
  video_script: string;
  image_brief: string;
  voiceover_script: string;
  package_text: string;
  source_data: Record<string, unknown>;
  created_at: string;
};

const DEFAULT_FORM = {
  niche: "beleza",
  target_audience: "",
  objective: "vender",
  main_channel: "tiktok",
  budget_style: "organico",
  campaign_style: "viral",
  use_auto_pick: true,
  product_id: "",
};

export default function CampaignPackagePanel({
  token,
}: CampaignPackagePanelProps) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [history, setHistory] = useState<CampaignPackageHistoryItem[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<CampaignPackageDetail | null>(null);

  const [flowResult, setFlowResult] = useState<CampaignFlowResponse | null>(
    null
  );

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [generatingFlow, setGeneratingFlow] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function updateForm(
    key: keyof typeof DEFAULT_FORM,
    value: string | boolean
  ) {
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
      generic: "Genérico",
      outro: "Outro",
    };

    return labels[value] || value;
  }

  function getSafeFileName(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    setErrorMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        return;
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const localNiche = localStorage.getItem("affiliateai_default_niche");
        const localChannel = localStorage.getItem(
          "affiliateai_default_channel"
        );
        const localCampaignStyle = localStorage.getItem(
          "affiliateai_default_campaign_style"
        );
        const localBudgetStyle = localStorage.getItem(
          "affiliateai_default_budget_style"
        );

        setForm((currentForm) => ({
          ...currentForm,
          niche: localNiche || currentForm.niche,
          main_channel: localChannel || currentForm.main_channel,
          campaign_style: localCampaignStyle || currentForm.campaign_style,
          budget_style: localBudgetStyle || currentForm.budget_style,
        }));

        return;
      }

      const settings = await response.json();

      setForm((currentForm) => ({
        ...currentForm,
        niche:
          settings.default_niche ||
          localStorage.getItem("affiliateai_default_niche") ||
          currentForm.niche,
        main_channel:
          settings.default_channel ||
          localStorage.getItem("affiliateai_default_channel") ||
          currentForm.main_channel,
        campaign_style:
          settings.default_campaign_style ||
          localStorage.getItem("affiliateai_default_campaign_style") ||
          currentForm.campaign_style,
        budget_style:
          settings.default_budget_style ||
          localStorage.getItem("affiliateai_default_budget_style") ||
          currentForm.budget_style,
      }));

      setSuccessMessage("Preferências carregadas no Campaign Package.");
    } catch {
      const localNiche = localStorage.getItem("affiliateai_default_niche");
      const localChannel = localStorage.getItem("affiliateai_default_channel");
      const localCampaignStyle = localStorage.getItem(
        "affiliateai_default_campaign_style"
      );
      const localBudgetStyle = localStorage.getItem(
        "affiliateai_default_budget_style"
      );

      setForm((currentForm) => ({
        ...currentForm,
        niche: localNiche || currentForm.niche,
        main_channel: localChannel || currentForm.main_channel,
        campaign_style: localCampaignStyle || currentForm.campaign_style,
        budget_style: localBudgetStyle || currentForm.budget_style,
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

      const response = await fetch(`${API_URL}/api/campaign-package/history`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: CampaignPackageHistoryItem[] = await response.json();

      setHistory(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar histórico de pacotes.");
      }

      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token]);

  useEffect(() => {
    loadSettings();
    loadHistory();

    window.addEventListener("campaign-package-history-updated", loadHistory);

    return () => {
      window.removeEventListener(
        "campaign-package-history-updated",
        loadHistory
      );
    };
  }, [loadSettings, loadHistory]);

  async function runCampaignFlow() {
    setGeneratingFlow(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para gerar o Campaign Flow.");
      }

      const payload = {
        niche: form.niche || null,
        target_audience: form.target_audience || null,
        objective: form.objective,
        main_channel: form.main_channel,
        budget_style: form.budget_style,
        campaign_style: form.campaign_style,
        use_auto_pick: Boolean(form.use_auto_pick),
        product_id: form.product_id ? Number(form.product_id) : null,
      };

      const response = await fetch(`${API_URL}/api/campaign-flow/run`, {
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

      const data: CampaignFlowResponse = await response.json();

      setFlowResult(data);

      const packageDetail: CampaignPackageDetail = {
        id: data.saved_package_id,
        user_id: 0,
        product_name: data.product.product_name,
        niche: data.product.niche,
        marketplace: data.product.marketplace,
        score: data.score,
        decision: data.decision,
        package_text: data.package_text,
        source_data: data.source_data,
        status: "saved",
        created_at: data.created_at,
      };

      setSelectedPackage(packageDetail);

      setSuccessMessage(
        `Campaign Flow gerado e salvo com sucesso. Pacote #${data.saved_package_id}.`
      );

      await loadHistory();

      window.dispatchEvent(new Event("campaign-package-history-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao gerar Campaign Flow.");
      }
    } finally {
      setGeneratingFlow(false);
    }
  }

  async function openPackage(packageId: number) {
    setOpeningId(packageId);
    setErrorMessage("");
    setSuccessMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para abrir o pacote.");
      }

      const response = await fetch(
        `${API_URL}/api/campaign-package/${packageId}`,
        {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: CampaignPackageDetail = await response.json();

      setSelectedPackage(data);
      setFlowResult(null);
      setSuccessMessage("Pacote carregado com sucesso.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir pacote.");
      }
    } finally {
      setOpeningId(null);
    }
  }

  async function copyPackageText() {
    if (!selectedPackage) return;

    try {
      await navigator.clipboard.writeText(selectedPackage.package_text);
      setCopyMessage("Pacote copiado.");
    } catch {
      setCopyMessage("Não foi possível copiar.");
    }
  }

  function exportTxt() {
    if (!selectedPackage) return;

    const fileName = `affiliateai-campaign-package-${selectedPackage.id}.txt`;

    const blob = new Blob([selectedPackage.package_text], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);

    setSuccessMessage("Arquivo TXT exportado.");
  }

  function exportPdf() {
    if (!selectedPackage) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const title = "AffiliateAI Pro - Campaign Package";
    const subtitle = `${selectedPackage.product_name} • ${selectedPackage.decision}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(subtitle, 14, 26);

    doc.setDrawColor(0, 180, 100);
    doc.line(14, 31, 196, 31);

    const lines = doc.splitTextToSize(selectedPackage.package_text, 182);

    let y = 40;

    doc.setFontSize(9);

    lines.forEach((line: string) => {
      if (y > 285) {
        doc.addPage();
        y = 18;
      }

      doc.text(line, 14, y);
      y += 5;
    });

    doc.save(`affiliateai-campaign-package-${selectedPackage.id}.pdf`);

    setSuccessMessage("PDF exportado.");
  }

  async function exportZip() {
    if (!selectedPackage) return;

    const zip = new JSZip();

    const safeProductName = getSafeFileName(selectedPackage.product_name);
    const baseName = `affiliateai-package-${selectedPackage.id}-${safeProductName}`;

    const summary = {
      id: selectedPackage.id,
      product_name: selectedPackage.product_name,
      niche: selectedPackage.niche,
      marketplace: selectedPackage.marketplace,
      score: selectedPackage.score,
      decision: selectedPackage.decision,
      status: selectedPackage.status,
      created_at: selectedPackage.created_at,
    };

    zip.file("campanha-completa.txt", selectedPackage.package_text);
    zip.file("resumo.json", JSON.stringify(summary, null, 2));
    zip.file(
      "dados-tecnicos.json",
      JSON.stringify(selectedPackage.source_data, null, 2)
    );

    const content = await zip.generateAsync({ type: "blob" });

    const url = URL.createObjectURL(content);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseName}.zip`;
    link.click();

    URL.revokeObjectURL(url);

    setSuccessMessage("ZIP exportado com sucesso.");
  }

  const selectedSource = useMemo(() => {
    if (!selectedPackage?.source_data) return "";

    const flow = selectedPackage.source_data["flow"];

    if (!flow || typeof flow !== "object") return "";

    const flowData = flow as Record<string, unknown>;

    return String(flowData.name || "");
  }, [selectedPackage]);

  return (
    <section className="agentPanel campaignPackagePanel">
      <div className="agentHero">
        <div>
          <span className="agentEyebrow">Campaign Package</span>

          <h2>Pacote de Campanha</h2>

          <p>
            Gere um pacote completo com produto, análise, copy, roteiro,
            briefing visual, narração e checklist. Agora com Campaign Flow em
            um clique.
          </p>
        </div>

        <div className="agentHeroStats">
          <span>Pacotes salvos</span>
          <strong>{history.length}</strong>
          <p>
            {loadingHistory
              ? "Atualizando histórico..."
              : "pacotes no histórico"}
          </p>
        </div>
      </div>

      <div className="agentWorkspace">
        <div className="agentFormCard">
          <div className="agentSectionHeader">
            <div>
              <span>Campaign Flow</span>
              <h3>Gerar campanha rápida</h3>
            </div>

            <button onClick={loadSettings} disabled={loadingSettings}>
              {loadingSettings ? "Carregando..." : "Usar preferências"}
            </button>
          </div>

          <div className="agentFormGrid">
            <label>
              Nicho
              <input
                value={form.niche}
                onChange={(event) => updateForm("niche", event.target.value)}
                placeholder="Ex: beleza, tecnologia, casa..."
              />
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
              Objetivo
              <select
                value={form.objective}
                onChange={(event) =>
                  updateForm("objective", event.target.value)
                }
              >
                <option value="vender">Vender</option>
                <option value="validar_produto">Validar produto</option>
                <option value="aquecer_audiencia">Aquecer audiência</option>
                <option value="capturar_lead">Capturar lead</option>
              </select>
            </label>

            <label>
              Canal principal
              <select
                value={form.main_channel}
                onChange={(event) =>
                  updateForm("main_channel", event.target.value)
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
              Orçamento
              <select
                value={form.budget_style}
                onChange={(event) =>
                  updateForm("budget_style", event.target.value)
                }
              >
                <option value="organico">Orgânico</option>
                <option value="baixo_orcamento">Baixo orçamento</option>
                <option value="trafego_pago">Tráfego pago</option>
              </select>
            </label>

            <label>
              Estilo
              <select
                value={form.campaign_style}
                onChange={(event) =>
                  updateForm("campaign_style", event.target.value)
                }
              >
                <option value="viral">Viral</option>
                <option value="direto">Direto</option>
                <option value="premium">Premium</option>
                <option value="popular">Popular</option>
                <option value="emocional">Emocional</option>
                <option value="agressivo">Agressivo</option>
              </select>
            </label>

            <label>
              ID do produto específico
              <input
                value={form.product_id}
                onChange={(event) =>
                  updateForm("product_id", event.target.value)
                }
                placeholder="Opcional. Ex: 3"
              />
            </label>

            <label>
              Usar Auto Pick
              <select
                value={form.use_auto_pick ? "true" : "false"}
                onChange={(event) =>
                  updateForm("use_auto_pick", event.target.value === "true")
                }
              >
                <option value="true">Sim, escolher do catálogo</option>
                <option value="false">Não, usar fallback</option>
              </select>
            </label>
          </div>

          <div className="agentActions">
            <button
              className="primaryButton"
              onClick={runCampaignFlow}
              disabled={generatingFlow}
            >
              {generatingFlow ? "Gerando pacote..." : "Gerar Campaign Flow"}
            </button>

            <button onClick={loadHistory} disabled={loadingHistory}>
              {loadingHistory ? "Atualizando..." : "Atualizar histórico"}
            </button>
          </div>

          {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          {successMessage && <p className="successMessage">{successMessage}</p>}
          {copyMessage && <p className="successMessage">{copyMessage}</p>}

          <div className="agentInfoBox">
            <span>Fluxo rápido</span>

            <p>
              O Campaign Flow usa suas preferências, escolhe uma oferta com Auto
              Pick, monta a campanha e salva tudo direto no histórico de
              pacotes.
            </p>
          </div>
        </div>

        <div className="agentHistoryCard">
          <div className="agentSectionHeader">
            <div>
              <span>Histórico</span>
              <h3>Pacotes salvos</h3>
            </div>

            <button onClick={loadHistory} disabled={loadingHistory}>
              {loadingHistory ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {history.length === 0 ? (
            <div className="agentEmptyBox">
              Nenhum pacote salvo ainda. Gere um Campaign Flow para começar.
            </div>
          ) : (
            <div className="agentHistoryList">
              {history.map((item) => (
                <button
                  key={item.id}
                  className={`agentHistoryItem ${
                    selectedPackage?.id === item.id ? "active" : ""
                  }`}
                  onClick={() => openPackage(item.id)}
                  disabled={openingId === item.id}
                >
                  <div>
                    <span>{item.decision}</span>
                    <strong>{item.product_name}</strong>
                    <p>
                      {item.niche} • {formatMarketplace(item.marketplace)}
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

      {selectedPackage && (
        <div className="agentResultCard">
          <div className="agentResultHeader">
            <div>
              <span>
                {selectedSource ? selectedSource : "Pacote selecionado"}
              </span>

              <h3>{selectedPackage.product_name}</h3>

              <p>
                {selectedPackage.decision} • Score {selectedPackage.score} •{" "}
                {formatDate(selectedPackage.created_at)}
              </p>
            </div>

            <button onClick={copyPackageText}>Copiar pacote</button>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Nicho</span>
              <strong>{selectedPackage.niche}</strong>
            </div>

            <div>
              <span>Marketplace</span>
              <strong>{formatMarketplace(selectedPackage.marketplace)}</strong>
            </div>

            <div>
              <span>Decisão</span>
              <strong>{selectedPackage.decision}</strong>
            </div>

            <div>
              <span>Score</span>
              <strong>{selectedPackage.score}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedPackage.status}</strong>
            </div>

            <div>
              <span>ID</span>
              <strong>#{selectedPackage.id}</strong>
            </div>
          </div>

          {flowResult && (
            <div className="agentResultGrid">
              <div>
                <span>Headline</span>
                <p>{flowResult.headline}</p>
              </div>

              <div>
                <span>Copy curta</span>
                <p>{flowResult.short_copy}</p>
              </div>

              <div>
                <span>Roteiro</span>
                <p>{flowResult.video_script}</p>
              </div>

              <div>
                <span>Briefing de imagem</span>
                <p>{flowResult.image_brief}</p>
              </div>
            </div>
          )}

          <div className="agentActions">
            <button className="primaryButton" onClick={copyPackageText}>
              Copiar campanha completa
            </button>

            <button onClick={exportTxt}>Exportar TXT</button>

            <button onClick={exportPdf}>Exportar PDF</button>

            <button onClick={exportZip}>Exportar ZIP</button>
          </div>

          <div className="agentMainText">
            <span>Campanha completa</span>

            <pre>{selectedPackage.package_text}</pre>
          </div>

          <details className="agentRawDetails">
            <summary>Ver dados técnicos completos</summary>

            <pre>{JSON.stringify(selectedPackage.source_data, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}