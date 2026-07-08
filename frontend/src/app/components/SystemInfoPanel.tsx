"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SystemInfoPanelProps = {
  token?: string;
};

type HealthResponse = {
  status: string;
  services: {
    api: boolean;
    database: boolean;
    redis: boolean;
  };
};

type AIStatusResponse = {
  engine: string;
  provider: string;
  model: string;
  real_ai_enabled: boolean;
  mode: string;
};

type AITestResponse = {
  status: string;
  result: string;
  engine: AIStatusResponse;
};

type ExportSummary = {
  products: number;
  autopilot_runs: number;
  product_analyses: number;
  content_generations: number;
  creative_generations: number;
  campaign_packages: number;
  has_user_settings: boolean;
};

type ExportResponse = {
  status: string;
  export_name: string;
  export_version: string;
  exported_at: string;
  user: {
    id: number;
    name: string | null;
    email: string | null;
  };
  summary: ExportSummary;
  data: Record<string, unknown>;
};

export default function SystemInfoPanel({ token }: SystemInfoPanelProps) {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatusResponse | null>(null);
  const [aiTestResult, setAiTestResult] = useState<AITestResponse | null>(null);
  const [exportPreview, setExportPreview] = useState<ExportResponse | null>(
    null
  );

  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [testingAI, setTestingAI] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function formatDate(value?: string | null) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function getStatusLabel(value: boolean) {
    return value ? "Online" : "Offline";
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

  function formatAIMode(value?: string) {
    const labels: Record<string, string> = {
      safe_mock: "Modo seguro local",
      real_ai: "IA real ativa",
      real_ai_placeholder: "IA real preparada",
    };

    return labels[value || ""] || value || "Não informado";
  }

  const loadHealth = useCallback(async () => {
    setLoadingHealth(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/health`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: HealthResponse = await response.json();

      setHealth(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar status do sistema.");
      }

      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const loadAIStatus = useCallback(async () => {
    setLoadingAI(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/api/ai/status`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AIStatusResponse = await response.json();

      setAiStatus(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar status do AI Engine.");
      }

      setAiStatus(null);
    } finally {
      setLoadingAI(false);
    }
  }, []);

  useEffect(() => {
    loadHealth();
    loadAIStatus();
  }, [loadHealth, loadAIStatus]);

  async function refreshEverything() {
    await Promise.all([loadHealth(), loadAIStatus()]);
    setSuccessMessage("Status do sistema atualizado.");
  }

  async function testAIEngine() {
    setTestingAI(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`${API_URL}/api/ai/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt:
            "Teste rápido do AI Engine do AffiliateAI Pro para confirmar que o motor está respondendo.",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AITestResponse = await response.json();

      setAiTestResult(data);
      setAiStatus(data.engine);

      setSuccessMessage("AI Engine testado com sucesso.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao testar AI Engine.");
      }
    } finally {
      setTestingAI(false);
    }
  }

  async function exportUserBackup() {
    setExportingBackup(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para exportar o backup.");
      }

      const response = await fetch(`${API_URL}/api/user-export/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: ExportResponse = await response.json();

      setExportPreview(data);

      const jsonText = JSON.stringify(data, null, 2);

      const userPart = data.user.email
        ? getSafeFileName(data.user.email)
        : `user-${data.user.id}`;

      const datePart = new Date().toISOString().slice(0, 10);

      const fileName = `affiliateai-backup-${userPart}-${datePart}.json`;

      const blob = new Blob([jsonText], {
        type: "application/json;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();

      URL.revokeObjectURL(url);

      setSuccessMessage("Backup JSON exportado com sucesso.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao exportar backup.");
      }
    } finally {
      setExportingBackup(false);
    }
  }

  return (
    <section className="agentPanel systemInfoPanel">
      <div className="agentHero">
        <div>
          <span className="agentEyebrow">Sistema</span>

          <h2>AffiliateAI Pro</h2>

          <p>
            Status geral do programa, serviços locais, AI Engine, módulos ativos
            e exportação de backup dos dados do usuário.
          </p>
        </div>

        <div className="agentHeroStats">
          <span>Status</span>

          <strong>
            {health?.status ? health.status.toUpperCase() : "VERIFICANDO"}
          </strong>

          <p>
            {loadingHealth || loadingAI
              ? "Atualizando serviços..."
              : "backend, banco, Redis e AI Engine"}
          </p>
        </div>
      </div>

      <div className="agentWorkspace">
        <div className="agentFormCard">
          <div className="agentSectionHeader">
            <div>
              <span>Serviços locais</span>
              <h3>Status técnico</h3>
            </div>

            <button onClick={refreshEverything} disabled={loadingHealth || loadingAI}>
              {loadingHealth || loadingAI ? "Atualizando..." : "Atualizar tudo"}
            </button>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Backend API</span>
              <strong>{getStatusLabel(Boolean(health?.services.api))}</strong>
            </div>

            <div>
              <span>Banco PostgreSQL</span>
              <strong>
                {getStatusLabel(Boolean(health?.services.database))}
              </strong>
            </div>

            <div>
              <span>Redis</span>
              <strong>{getStatusLabel(Boolean(health?.services.redis))}</strong>
            </div>

            <div>
              <span>Frontend</span>
              <strong>Online</strong>
            </div>

            <div>
              <span>Ambiente</span>
              <strong>Local MVP</strong>
            </div>

            <div>
              <span>Versão</span>
              <strong>v1.0.0</strong>
            </div>
          </div>

          {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          {successMessage && <p className="successMessage">{successMessage}</p>}

          <div className="agentInfoBox">
            <span>Stack atual</span>

            <p>
              FastAPI, PostgreSQL, Redis, Docker, Next.js, React, TypeScript e
              exportações locais em TXT, PDF, ZIP e JSON.
            </p>
          </div>
        </div>

        <div className="agentHistoryCard">
          <div className="agentSectionHeader">
            <div>
              <span>AI Engine</span>
              <h3>Motor de inteligência</h3>
            </div>

            <button onClick={loadAIStatus} disabled={loadingAI}>
              {loadingAI ? "Carregando..." : "Atualizar IA"}
            </button>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Provider</span>
              <strong>{aiStatus?.provider || "mock"}</strong>
            </div>

            <div>
              <span>Modelo</span>
              <strong>{aiStatus?.model || "affiliateai-local-mock"}</strong>
            </div>

            <div>
              <span>Modo</span>
              <strong>{formatAIMode(aiStatus?.mode)}</strong>
            </div>

            <div>
              <span>IA real</span>
              <strong>{aiStatus?.real_ai_enabled ? "Ativa" : "Desligada"}</strong>
            </div>
          </div>

          <div className="agentActions">
            <button
              className="primaryButton"
              onClick={testAIEngine}
              disabled={testingAI}
            >
              {testingAI ? "Testando..." : "Testar AI Engine"}
            </button>
          </div>

          {aiTestResult ? (
            <div className="agentMainText">
              <span>Resposta do teste</span>
              <pre>{aiTestResult.result}</pre>
            </div>
          ) : (
            <div className="agentEmptyBox">
              Nenhum teste do AI Engine feito nesta sessão ainda.
            </div>
          )}
        </div>
      </div>

      <div className="agentWorkspace">
        <div className="agentFormCard">
          <div className="agentSectionHeader">
            <div>
              <span>Backup</span>
              <h3>Exportar dados do usuário</h3>
            </div>
          </div>

          <div className="agentInfoBox">
            <span>O que vai no backup</span>

            <p>
              Produtos, histórico dos agentes, Campaign Packages, preferências e
              dados técnicos do usuário logado.
            </p>
          </div>

          <div className="agentActions">
            <button
              className="primaryButton"
              onClick={exportUserBackup}
              disabled={exportingBackup}
            >
              {exportingBackup ? "Exportando..." : "Baixar backup JSON"}
            </button>
          </div>

          {exportPreview ? (
            <div className="agentResultStats">
              <div>
                <span>Produtos</span>
                <strong>{exportPreview.summary.products}</strong>
              </div>

              <div>
                <span>Autopilot</span>
                <strong>{exportPreview.summary.autopilot_runs}</strong>
              </div>

              <div>
                <span>Product Hunter</span>
                <strong>{exportPreview.summary.product_analyses}</strong>
              </div>

              <div>
                <span>Content Generator</span>
                <strong>{exportPreview.summary.content_generations}</strong>
              </div>

              <div>
                <span>Creative Image</span>
                <strong>{exportPreview.summary.creative_generations}</strong>
              </div>

              <div>
                <span>Campaign Packages</span>
                <strong>{exportPreview.summary.campaign_packages}</strong>
              </div>
            </div>
          ) : (
            <div className="agentEmptyBox">
              Nenhum backup exportado nesta sessão ainda.
            </div>
          )}
        </div>

        <div className="agentHistoryCard">
          <div className="agentSectionHeader">
            <div>
              <span>Próxima fase</span>
              <h3>Roadmap do programa</h3>
            </div>
          </div>

          <div className="agentResultLists">
            <div>
              <h4>Já funcionando</h4>

              <ul>
                <li>Login e cadastro com token JWT.</li>
                <li>Catálogo de produtos com Auto Pick.</li>
                <li>Product Hunter conectado ao catálogo.</li>
                <li>Autopilot com campanhas salvas.</li>
                <li>Campaign Flow em um clique.</li>
                <li>Exportação TXT, PDF, ZIP e backup JSON.</li>
                <li>Produtos demo e limpeza segura de demos.</li>
                <li>AI Engine central em modo seguro.</li>
              </ul>
            </div>

            <div>
              <h4>Depois do MVP</h4>

              <ul>
                <li>Instalador desktop do Windows.</li>
                <li>Modo de projeto por cliente/campanha.</li>
                <li>Conexão com IA real via chave configurada.</li>
                <li>Painel financeiro e métricas de conversão.</li>
                <li>Importação de backup.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {exportPreview && (
        <div className="agentResultCard">
          <div className="agentResultHeader">
            <div>
              <span>Último backup</span>
              <h3>{exportPreview.export_name}</h3>
              <p>
                Exportado em {formatDate(exportPreview.exported_at)} para{" "}
                {exportPreview.user.email || "usuário atual"}.
              </p>
            </div>
          </div>

          <details className="agentRawDetails">
            <summary>Ver resumo do último backup</summary>

            <pre>{JSON.stringify(exportPreview.summary, null, 2)}</pre>
          </details>
        </div>
      )}
    </section>
  );
}