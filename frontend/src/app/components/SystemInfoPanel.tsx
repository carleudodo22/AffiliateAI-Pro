"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type HealthResponse = {
  status: string;
  services: {
    api: boolean;
    database: boolean;
    redis: boolean;
  };
};

export default function SystemInfoPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [frontendUrl, setFrontendUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setFrontendUrl(window.location.origin);
    loadHealth();
  }, []);

  async function loadHealth() {
    setLoading(true);
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
        setErrorMessage("Erro ao verificar status do sistema.");
      }

      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(value?: boolean) {
    return value ? "Online" : "Offline";
  }

  function getStatusClass(value?: boolean) {
    return value ? "online" : "offline";
  }

  return (
    <section className="systemPanel">
      <div className="systemHeader">
        <div>
          <span className="systemEyebrow">Sistema</span>

          <h2>AffiliateAI Pro</h2>

          <p>
            Central técnica do sistema. Aqui você acompanha o status do app,
            backend, banco, Redis, módulos ativos e preparação para transformar
            o projeto em um programa real.
          </p>
        </div>

        <div className="systemVersionCard">
          <span>Versão atual</span>
          <strong>v1.0.0 MVP Local</strong>
          <p>Base funcional para evoluir para SaaS e app desktop.</p>
        </div>
      </div>

      <div className="systemActions">
        <button onClick={loadHealth} disabled={loading}>
          {loading ? "Verificando..." : "Verificar status"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      <div className="systemStatusGrid">
        <div className={`systemStatusCard ${getStatusClass(health?.services.api)}`}>
          <span>API Backend</span>
          <strong>{getStatusLabel(health?.services.api)}</strong>
          <p>{API_URL}</p>
        </div>

        <div
          className={`systemStatusCard ${getStatusClass(
            health?.services.database
          )}`}
        >
          <span>Banco de dados</span>
          <strong>{getStatusLabel(health?.services.database)}</strong>
          <p>PostgreSQL salvando usuários, campanhas e históricos.</p>
        </div>

        <div
          className={`systemStatusCard ${getStatusClass(health?.services.redis)}`}
        >
          <span>Redis</span>
          <strong>{getStatusLabel(health?.services.redis)}</strong>
          <p>Base preparada para cache, fila e automações futuras.</p>
        </div>

        <div className="systemStatusCard online">
          <span>Frontend</span>
          <strong>Online</strong>
          <p>{frontendUrl || "http://localhost:3000"}</p>
        </div>
      </div>

      <div className="systemGrid">
        <div className="systemBox large">
          <span>Módulos ativos</span>
          <h3>Estrutura do programa</h3>

          <div className="systemModuleList">
            <div>
              <strong>Dashboard</strong>
              <p>Central de comando com métricas e status dos agentes.</p>
            </div>

            <div>
              <strong>Autopilot</strong>
              <p>Gera estratégia, produto, copy, roteiro e checklist.</p>
            </div>

            <div>
              <strong>Product Hunter</strong>
              <p>Analisa produtos, score, oportunidade e ideias de venda.</p>
            </div>

            <div>
              <strong>Content Generator</strong>
              <p>Cria copy, legenda, roteiro, WhatsApp, CTA e hashtags.</p>
            </div>

            <div>
              <strong>Creative Image</strong>
              <p>Gera briefing visual, prompt de imagem e direção 9:16.</p>
            </div>

            <div>
              <strong>Campaign Package</strong>
              <p>Junta os agentes em uma campanha completa pronta para copiar.</p>
            </div>

            <div>
              <strong>Histórico Geral</strong>
              <p>Central unificada de campanhas, análises, conteúdos e criativos.</p>
            </div>

            <div>
              <strong>Configurações</strong>
              <p>Preferências do usuário alimentando os agentes.</p>
            </div>
          </div>
        </div>

        <div className="systemBox">
          <span>Stack</span>
          <h3>Tecnologias</h3>

          <div className="systemStackList">
            <div>
              <strong>Frontend</strong>
              <p>Next.js, React, TypeScript e CSS puro.</p>
            </div>

            <div>
              <strong>Backend</strong>
              <p>Python, FastAPI, SQLAlchemy e JWT.</p>
            </div>

            <div>
              <strong>Banco</strong>
              <p>PostgreSQL com histórico por usuário.</p>
            </div>

            <div>
              <strong>Infra local</strong>
              <p>Docker Compose, Redis e ambiente local.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="systemRoadmap">
        <div>
          <span>Próxima fase</span>
          <h3>Transformar em programa instalável</h3>
          <p>
            A base atual roda no navegador, mas a arquitetura já pode evoluir
            para um app desktop usando Electron ou Tauri, mantendo o painel,
            backend, banco e agentes como núcleo do AffiliateAI Pro.
          </p>
        </div>

        <div className="systemRoadmapSteps">
          <div>1. Fechar MVP local</div>
          <div>2. Integrar IA real</div>
          <div>3. Criar exportação PDF/ZIP</div>
          <div>4. Preparar modo desktop</div>
          <div>5. Gerar instalador Windows</div>
        </div>
      </div>
    </section>
  );
}