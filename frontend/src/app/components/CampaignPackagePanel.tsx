"use client";

import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CampaignPackagePanelProps = {
  token: string;
};

type CampaignPackageResponse = {
  id: number;
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

type CampaignPackageSummary = {
  id: number;
  product_name: string;
  niche: string;
  marketplace: string;
  score: string;
  decision: string;
  status: string;
  created_at: string | null;
};

type RankedItem = {
  name: string;
  count: number;
};

type CampaignPackageStatsResponse = {
  status: string;
  message: string;
  total: number;
  status_counts: Record<string, number>;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  top_niches: RankedItem[];
  top_marketplaces: RankedItem[];
  latest_package: CampaignPackageSummary | null;
  best_package: CampaignPackageSummary | null;
};

const DEFAULT_FORM = {
  product_name: "Escova secadora 3 em 1",
  niche: "beleza",
  marketplace: "shopee",
  average_price: "119.90",
  commission_percent: "12",
  target_audience:
    "pessoas que querem praticidade, beleza e produtos fáceis de usar no dia a dia",
  objective: "vender",
  main_channel: "tiktok",
  campaign_style: "viral",
  budget_style: "organico",
  product_url: "",
  affiliate_link: "",
};

const DEFAULT_EDIT_FORM = {
  product_name: "",
  niche: "",
  marketplace: "",
  score: "",
  decision: "",
  status: "",
  package_text: "",
};

export default function CampaignPackagePanel({
  token,
}: CampaignPackagePanelProps) {
  const [form, setForm] = useState(DEFAULT_FORM);

  const [packages, setPackages] = useState<CampaignPackageResponse[]>([]);
  const [selectedPackage, setSelectedPackage] =
    useState<CampaignPackageResponse | null>(null);

  const [packageStats, setPackageStats] =
    useState<CampaignPackageStatsResponse | null>(null);

  const [editForm, setEditForm] = useState(DEFAULT_EDIT_FORM);
  const [editingPackage, setEditingPackage] = useState(false);

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [generatingPackage, setGeneratingPackage] = useState(false);
  const [runningFlow, setRunningFlow] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
  }

  function updateEditForm(key: keyof typeof DEFAULT_EDIT_FORM, value: string) {
    setEditForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function fillEditForm(packageItem: CampaignPackageResponse) {
    setEditForm({
      product_name: packageItem.product_name || "",
      niche: packageItem.niche || "",
      marketplace: packageItem.marketplace || "",
      score: packageItem.score || "",
      decision: packageItem.decision || "",
      status: packageItem.status || "",
      package_text: packageItem.package_text || "",
    });
  }

  function formatDate(value?: string | null) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function getSafeFileName(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 90);
  }

  function downloadFile(fileName: string, content: string, type: string) {
    const blob = new Blob([content], {
      type,
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  function buildExportName(packageItem: CampaignPackageResponse, ext: string) {
    const baseName = getSafeFileName(
      `${packageItem.id}-${packageItem.product_name}-${packageItem.niche}`
    );

    return `campaign-package-${baseName}.${ext}`;
  }

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

      const data: CampaignPackageResponse[] = await response.json();

      setPackages(data);

      if (!selectedPackage && data.length > 0) {
        setSelectedPackage(data[0]);
        fillEditForm(data[0]);
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar Campaign Packages.");
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [token, selectedPackage]);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setErrorMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        throw new Error(
          "Você precisa estar logado para carregar estatísticas."
        );
      }

      const response = await fetch(`${API_URL}/api/campaign-package/stats`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: CampaignPackageStatsResponse = await response.json();

      setPackageStats(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar estatísticas dos pacotes.");
      }
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  useEffect(() => {
    loadHistory();
    loadStats();

    function handleUpdated() {
      loadHistory();
      loadStats();
    }

    window.addEventListener("campaign-packages-updated", handleUpdated);

    return () => {
      window.removeEventListener("campaign-packages-updated", handleUpdated);
    };
  }, [loadHistory, loadStats]);

  async function refreshAll() {
    await Promise.all([loadHistory(), loadStats()]);
    setSuccessMessage("Histórico e estatísticas atualizados.");
  }

  async function generateManualPackage() {
    setGeneratingPackage(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para gerar o pacote.");
      }

      const payload = {
        product_name: form.product_name,
        niche: form.niche,
        marketplace: form.marketplace,
        average_price: Number(form.average_price) || 0,
        commission_percent: Number(form.commission_percent) || 0,
        target_audience: form.target_audience,
        objective: form.objective,
        main_channel: form.main_channel,
        campaign_style: form.campaign_style,
        budget_style: form.budget_style,
        product_url: form.product_url || null,
        affiliate_link: form.affiliate_link || null,
      };

      const response = await fetch(`${API_URL}/api/campaign-package/generate`, {
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

      const data: CampaignPackageResponse = await response.json();

      setSelectedPackage(data);
      fillEditForm(data);
      setEditingPackage(false);

      setSuccessMessage("Campaign Package gerado com sucesso.");

      await Promise.all([loadHistory(), loadStats()]);

      window.dispatchEvent(new Event("campaign-packages-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao gerar Campaign Package.");
      }
    } finally {
      setGeneratingPackage(false);
    }
  }

  async function runCampaignFlow() {
    setRunningFlow(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para rodar o Campaign Flow.");
      }

      const payload = {
        use_auto_pick: true,
        niche: form.niche,
        target_audience: form.target_audience,
        objective: form.objective,
        main_channel: form.main_channel,
        budget_style: form.budget_style,
        campaign_style: form.campaign_style,
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

      await response.json();

      setSuccessMessage(
        "Campaign Flow executado com sucesso. O pacote foi salvo no histórico."
      );

      await Promise.all([loadHistory(), loadStats()]);

      window.dispatchEvent(new Event("campaign-packages-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao rodar Campaign Flow.");
      }
    } finally {
      setRunningFlow(false);
    }
  }

  async function duplicatePackage(packageId: number) {
    const confirmed = window.confirm(
      "Duplicar este Campaign Package? Uma nova cópia será criada no histórico."
    );

    if (!confirmed) return;

    setDuplicatingId(packageId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para duplicar o pacote.");
      }

      const response = await fetch(
        `${API_URL}/api/campaign-package/${packageId}/duplicate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: CampaignPackageResponse = await response.json();

      setSelectedPackage(data);
      fillEditForm(data);
      setEditingPackage(false);

      setSuccessMessage("Campaign Package duplicado com sucesso.");

      await Promise.all([loadHistory(), loadStats()]);

      window.dispatchEvent(new Event("campaign-packages-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao duplicar Campaign Package.");
      }
    } finally {
      setDuplicatingId(null);
    }
  }

  async function savePackageEdit() {
    if (!selectedPackage) {
      setErrorMessage("Selecione um pacote antes de salvar edição.");
      return;
    }

    setSavingEdit(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para editar o pacote.");
      }

      const payload = {
        product_name: editForm.product_name,
        niche: editForm.niche,
        marketplace: editForm.marketplace,
        score: editForm.score,
        decision: editForm.decision,
        status: editForm.status || "edited",
        package_text: editForm.package_text,
      };

      const response = await fetch(
        `${API_URL}/api/campaign-package/${selectedPackage.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: CampaignPackageResponse = await response.json();

      setSelectedPackage(data);
      fillEditForm(data);
      setEditingPackage(false);

      setSuccessMessage("Campaign Package editado com sucesso.");

      await Promise.all([loadHistory(), loadStats()]);

      window.dispatchEvent(new Event("campaign-packages-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao editar Campaign Package.");
      }
    } finally {
      setSavingEdit(false);
    }
  }

  async function deletePackage(packageId: number) {
    const confirmed = window.confirm(
      "Tem certeza que deseja remover este Campaign Package?"
    );

    if (!confirmed) return;

    setDeletingId(packageId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para remover o pacote.");
      }

      const response = await fetch(
        `${API_URL}/api/campaign-package/${packageId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      if (selectedPackage?.id === packageId) {
        setSelectedPackage(null);
        setEditForm(DEFAULT_EDIT_FORM);
        setEditingPackage(false);
      }

      setSuccessMessage("Campaign Package removido com sucesso.");

      await Promise.all([loadHistory(), loadStats()]);

      window.dispatchEvent(new Event("campaign-packages-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao remover Campaign Package.");
      }
    } finally {
      setDeletingId(null);
    }
  }

  function startEditingPackage() {
    if (!selectedPackage) return;

    fillEditForm(selectedPackage);
    setEditingPackage(true);
    setErrorMessage("");
    setSuccessMessage("Modo edição ativado.");
  }

  function cancelEditingPackage() {
    if (selectedPackage) {
      fillEditForm(selectedPackage);
    }

    setEditingPackage(false);
    setErrorMessage("");
    setSuccessMessage("Edição cancelada.");
  }

  function exportTXT(packageItem: CampaignPackageResponse) {
    downloadFile(
      buildExportName(packageItem, "txt"),
      packageItem.package_text,
      "text/plain;charset=utf-8"
    );
  }

  function exportJSON(packageItem: CampaignPackageResponse) {
    downloadFile(
      buildExportName(packageItem, "json"),
      JSON.stringify(packageItem, null, 2),
      "application/json;charset=utf-8"
    );
  }

  function exportPDF(packageItem: CampaignPackageResponse) {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setErrorMessage("Não foi possível abrir a janela de PDF.");
      return;
    }

    const escapedText = packageItem.package_text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    printWindow.document.write(`
      <html>
        <head>
          <title>Campaign Package ${packageItem.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #111827;
              line-height: 1.5;
            }

            h1 {
              font-size: 24px;
              margin-bottom: 8px;
            }

            .meta {
              color: #4b5563;
              margin-bottom: 24px;
            }

            pre {
              white-space: pre-wrap;
              font-family: Arial, sans-serif;
              font-size: 14px;
            }
          </style>
        </head>

        <body>
          <h1>AffiliateAI Pro — Campaign Package</h1>
          <div class="meta">
            Produto: ${packageItem.product_name}<br />
            Nicho: ${packageItem.niche}<br />
            Marketplace: ${packageItem.marketplace}<br />
            Score: ${packageItem.score}<br />
            Decisão: ${packageItem.decision}<br />
            Criado em: ${formatDate(packageItem.created_at)}
          </div>

          <pre>${escapedText}</pre>

          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  async function exportZIP(packageItem: CampaignPackageResponse) {
    const zip = new JSZip();

    zip.file("campaign-package.txt", packageItem.package_text);

    zip.file(
      "campaign-package.json",
      JSON.stringify(packageItem, null, 2)
    );

    zip.file(
      "source-data.json",
      JSON.stringify(packageItem.source_data || {}, null, 2)
    );

    zip.file(
      "metadata.txt",
      `AffiliateAI Pro
ID: ${packageItem.id}
Produto: ${packageItem.product_name}
Nicho: ${packageItem.niche}
Marketplace: ${packageItem.marketplace}
Score: ${packageItem.score}
Decisão: ${packageItem.decision}
Status: ${packageItem.status}
Criado em: ${formatDate(packageItem.created_at)}
`
    );

    const blob = await zip.generateAsync({
      type: "blob",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = buildExportName(packageItem, "zip");
    link.click();

    URL.revokeObjectURL(url);
  }

  function selectPackage(packageItem: CampaignPackageResponse) {
    setSelectedPackage(packageItem);
    fillEditForm(packageItem);
    setEditingPackage(false);
    setErrorMessage("");
    setSuccessMessage("Campaign Package carregado.");
  }

  return (
    <section className="agentPanel campaignPackagePanel">
      <div className="agentHero">
        <div>
          <span className="agentEyebrow">Campaign Package</span>

          <h2>Pacotes completos de campanha</h2>

          <p>
            Gere, salve, duplique, edite, exporte e acompanhe estatísticas das
            campanhas completas para afiliados.
          </p>
        </div>

        <div className="agentHeroStats">
          <span>Pacotes salvos</span>
          <strong>{packageStats ? packageStats.total : packages.length}</strong>
          <p>
            {selectedPackage
              ? `Selecionado: #${selectedPackage.id}`
              : "Nenhum pacote selecionado"}
          </p>
        </div>
      </div>

      <div className="agentResultCard">
        <div className="agentResultHeader">
          <div>
            <span>Estatísticas</span>
            <h3>Visão dos Campaign Packages</h3>
            <p>
              Acompanhe volume, score médio, melhor pacote, último pacote e os
              nichos/marketplaces mais usados.
            </p>
          </div>

          <button onClick={refreshAll} disabled={loadingStats || loadingHistory}>
            {loadingStats || loadingHistory ? "Atualizando..." : "Atualizar dados"}
          </button>
        </div>

        <div className="agentResultStats">
          <div>
            <span>Total</span>
            <strong>{packageStats?.total ?? 0}</strong>
          </div>

          <div>
            <span>Score médio</span>
            <strong>{packageStats?.average_score ?? 0}</strong>
          </div>

          <div>
            <span>Maior score</span>
            <strong>{packageStats?.highest_score ?? 0}</strong>
          </div>

          <div>
            <span>Menor score</span>
            <strong>{packageStats?.lowest_score ?? 0}</strong>
          </div>

          <div>
            <span>Melhor pacote</span>
            <strong>
              {packageStats?.best_package
                ? `#${packageStats.best_package.id}`
                : "--"}
            </strong>
          </div>

          <div>
            <span>Último pacote</span>
            <strong>
              {packageStats?.latest_package
                ? `#${packageStats.latest_package.id}`
                : "--"}
            </strong>
          </div>
        </div>

        <div className="agentResultLists">
          <div>
            <h4>Status dos pacotes</h4>

            <ul>
              {packageStats ? (
                Object.entries(packageStats.status_counts).map(
                  ([status, count]) => (
                    <li key={status}>
                      {status}: {count}
                    </li>
                  )
                )
              ) : (
                <li>Nenhum dado carregado.</li>
              )}
            </ul>
          </div>

          <div>
            <h4>Top nichos</h4>

            <ul>
              {packageStats && packageStats.top_niches.length > 0 ? (
                packageStats.top_niches.map((item) => (
                  <li key={item.name}>
                    {item.name}: {item.count}
                  </li>
                ))
              ) : (
                <li>Nenhum nicho ainda.</li>
              )}
            </ul>
          </div>

          <div>
            <h4>Top marketplaces</h4>

            <ul>
              {packageStats && packageStats.top_marketplaces.length > 0 ? (
                packageStats.top_marketplaces.map((item) => (
                  <li key={item.name}>
                    {item.name}: {item.count}
                  </li>
                ))
              ) : (
                <li>Nenhum marketplace ainda.</li>
              )}
            </ul>
          </div>

          <div>
            <h4>Resumo rápido</h4>

            <ul>
              <li>
                Melhor:{" "}
                {packageStats?.best_package
                  ? `${packageStats.best_package.product_name} — Score ${packageStats.best_package.score}`
                  : "Nenhum pacote"}
              </li>

              <li>
                Último:{" "}
                {packageStats?.latest_package
                  ? `${packageStats.latest_package.product_name} — ${formatDate(
                      packageStats.latest_package.created_at
                    )}`
                  : "Nenhum pacote"}
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="agentWorkspace">
        <div className="agentFormCard">
          <div className="agentSectionHeader">
            <div>
              <span>Gerador</span>
              <h3>Novo Campaign Package</h3>
            </div>

            <button onClick={refreshAll} disabled={loadingHistory || loadingStats}>
              {loadingHistory || loadingStats ? "Carregando..." : "Atualizar"}
            </button>
          </div>

          <div className="agentFormGrid">
            <label>
              Produto
              <input
                value={form.product_name}
                onChange={(event) =>
                  updateForm("product_name", event.target.value)
                }
                placeholder="Nome do produto"
              />
            </label>

            <label>
              Nicho
              <input
                value={form.niche}
                onChange={(event) => updateForm("niche", event.target.value)}
                placeholder="beleza, pet, casa..."
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
                placeholder="119.90"
              />
            </label>

            <label>
              Comissão %
              <input
                value={form.commission_percent}
                onChange={(event) =>
                  updateForm("commission_percent", event.target.value)
                }
                placeholder="12"
              />
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
                <option value="whatsapp">WhatsApp</option>
                <option value="pinterest">Pinterest</option>
                <option value="facebook_ads">Facebook Ads</option>
              </select>
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
                <option value="validar">Validar produto</option>
                <option value="gerar_cliques">Gerar cliques</option>
                <option value="capturar_leads">Capturar leads</option>
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
                <option value="educativo">Educativo</option>
                <option value="emocional">Emocional</option>
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

            <label className="productsWide">
              Público-alvo
              <textarea
                value={form.target_audience}
                onChange={(event) =>
                  updateForm("target_audience", event.target.value)
                }
                placeholder="Descreva quem vai comprar esse produto"
              />
            </label>

            <label className="productsWide">
              Link do produto
              <input
                value={form.product_url}
                onChange={(event) =>
                  updateForm("product_url", event.target.value)
                }
                placeholder="https://..."
              />
            </label>

            <label className="productsWide">
              Link de afiliado
              <input
                value={form.affiliate_link}
                onChange={(event) =>
                  updateForm("affiliate_link", event.target.value)
                }
                placeholder="Cole o link de afiliado"
              />
            </label>
          </div>

          <div className="agentActions">
            <button
              className="primaryButton"
              onClick={runCampaignFlow}
              disabled={runningFlow}
            >
              {runningFlow ? "Rodando Flow..." : "Gerar Campaign Flow"}
            </button>

            <button
              onClick={generateManualPackage}
              disabled={generatingPackage}
            >
              {generatingPackage ? "Gerando..." : "Gerar manual"}
            </button>
          </div>

          {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          {successMessage && <p className="successMessage">{successMessage}</p>}
        </div>

        <div className="agentHistoryCard">
          <div className="agentSectionHeader">
            <div>
              <span>Histórico</span>
              <h3>Campaign Packages salvos</h3>
            </div>

            <button onClick={refreshAll} disabled={loadingHistory || loadingStats}>
              {loadingHistory || loadingStats ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {packages.length === 0 ? (
            <div className="agentEmptyBox">
              Nenhum Campaign Package salvo ainda.
            </div>
          ) : (
            <div className="agentHistoryList">
              {packages.map((packageItem) => (
                <button
                  key={packageItem.id}
                  className={`agentHistoryItem ${
                    selectedPackage?.id === packageItem.id ? "active" : ""
                  }`}
                  onClick={() => selectPackage(packageItem)}
                >
                  <span>
                    #{packageItem.id} • {packageItem.status}
                  </span>

                  <strong>{packageItem.product_name}</strong>

                  <p>
                    {packageItem.niche} • {packageItem.marketplace} • Score{" "}
                    {packageItem.score}
                  </p>

                  <small>{formatDate(packageItem.created_at)}</small>
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
              <span>Campaign Package selecionado</span>
              <h3>{selectedPackage.product_name}</h3>
              <p>
                ID #{selectedPackage.id} • {selectedPackage.niche} •{" "}
                {selectedPackage.marketplace} • {formatDate(selectedPackage.created_at)}
              </p>
            </div>

            <div className="agentHeroStats">
              <span>Score</span>
              <strong>{selectedPackage.score}</strong>
              <p>{selectedPackage.decision}</p>
            </div>
          </div>

          <div className="agentActions">
            {!editingPackage ? (
              <button className="primaryButton" onClick={startEditingPackage}>
                Editar pacote
              </button>
            ) : (
              <button
                className="primaryButton"
                onClick={savePackageEdit}
                disabled={savingEdit}
              >
                {savingEdit ? "Salvando..." : "Salvar edição"}
              </button>
            )}

            {editingPackage && (
              <button onClick={cancelEditingPackage} disabled={savingEdit}>
                Cancelar edição
              </button>
            )}

            <button
              onClick={() => duplicatePackage(selectedPackage.id)}
              disabled={duplicatingId === selectedPackage.id}
            >
              {duplicatingId === selectedPackage.id
                ? "Duplicando..."
                : "Duplicar pacote"}
            </button>

            <button onClick={() => exportTXT(selectedPackage)}>
              Exportar TXT
            </button>

            <button onClick={() => exportPDF(selectedPackage)}>
              Exportar PDF
            </button>

            <button onClick={() => exportZIP(selectedPackage)}>
              Exportar ZIP
            </button>

            <button onClick={() => exportJSON(selectedPackage)}>
              Exportar JSON
            </button>

            <button
              onClick={() => deletePackage(selectedPackage.id)}
              disabled={deletingId === selectedPackage.id}
            >
              {deletingId === selectedPackage.id ? "Removendo..." : "Remover"}
            </button>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Produto</span>
              <strong>{selectedPackage.product_name}</strong>
            </div>

            <div>
              <span>Nicho</span>
              <strong>{selectedPackage.niche}</strong>
            </div>

            <div>
              <span>Marketplace</span>
              <strong>{selectedPackage.marketplace}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedPackage.status}</strong>
            </div>

            <div>
              <span>Score</span>
              <strong>{selectedPackage.score}</strong>
            </div>

            <div>
              <span>Decisão</span>
              <strong>{selectedPackage.decision}</strong>
            </div>
          </div>

          {editingPackage ? (
            <div className="agentFormCard">
              <div className="agentSectionHeader">
                <div>
                  <span>Editor</span>
                  <h3>Editando pacote #{selectedPackage.id}</h3>
                </div>
              </div>

              <div className="agentFormGrid">
                <label>
                  Produto
                  <input
                    value={editForm.product_name}
                    onChange={(event) =>
                      updateEditForm("product_name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Nicho
                  <input
                    value={editForm.niche}
                    onChange={(event) =>
                      updateEditForm("niche", event.target.value)
                    }
                  />
                </label>

                <label>
                  Marketplace
                  <input
                    value={editForm.marketplace}
                    onChange={(event) =>
                      updateEditForm("marketplace", event.target.value)
                    }
                  />
                </label>

                <label>
                  Score
                  <input
                    value={editForm.score}
                    onChange={(event) =>
                      updateEditForm("score", event.target.value)
                    }
                  />
                </label>

                <label>
                  Decisão
                  <input
                    value={editForm.decision}
                    onChange={(event) =>
                      updateEditForm("decision", event.target.value)
                    }
                  />
                </label>

                <label>
                  Status
                  <select
                    value={editForm.status}
                    onChange={(event) =>
                      updateEditForm("status", event.target.value)
                    }
                  >
                    <option value="saved">Salvo</option>
                    <option value="edited">Editado</option>
                    <option value="draft">Rascunho</option>
                    <option value="approved">Aprovado</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </label>

                <label className="productsWide">
                  Texto completo do pacote
                  <textarea
                    value={editForm.package_text}
                    onChange={(event) =>
                      updateEditForm("package_text", event.target.value)
                    }
                    rows={22}
                  />
                </label>
              </div>

              <div className="agentActions">
                <button
                  className="primaryButton"
                  onClick={savePackageEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Salvando..." : "Salvar edição"}
                </button>

                <button onClick={cancelEditingPackage} disabled={savingEdit}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="agentMainText">
              <span>Texto completo do pacote</span>
              <pre>{selectedPackage.package_text}</pre>
            </div>
          )}

          <details className="agentRawDetails">
            <summary>Ver dados técnicos</summary>

            <pre>{JSON.stringify(selectedPackage.source_data, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}