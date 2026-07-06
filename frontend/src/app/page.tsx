"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ProductHunterResponse = {
  agent: string;
  niche: string;
  product_name: string;
  marketplace: string;
  decision: string;
  score: {
    demand_score: number;
    virality_score: number;
    profit_score: number;
    competition_score: number;
    saturation_risk: number;
    final_score: number;
  };
  strategy: {
    positioning: string;
    sales_angle: string;
    content_ideas: string[];
    offer_structure: string;
    recommended_channels: string[];
    warnings: string[];
  };
};

export default function Home() {
  const [niche, setNiche] = useState("beleza");
  const [productName, setProductName] = useState("escova secadora");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );
  const [marketplace, setMarketplace] = useState("shopee");
  const [mainChannel, setMainChannel] = useState("tiktok");
  const [averagePrice, setAveragePrice] = useState("119.90");
  const [commissionPercent, setCommissionPercent] = useState("12");
  const [estimatedCompetition, setEstimatedCompetition] = useState("58");
  const [trendSignal, setTrendSignal] = useState("82");

  const [result, setResult] = useState<ProductHunterResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function analyzeProduct() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const response = await fetch(`${API_URL}/api/product-hunter/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          niche,
          product_name: productName,
          target_audience: targetAudience,
          marketplace,
          main_channel: mainChannel,
          average_price: Number(averagePrice),
          commission_percent: Number(commissionPercent),
          estimated_competition: Number(estimatedCompetition),
          trend_signal: Number(trendSignal),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao analisar produto.");
      }

      const data = await response.json();
      setResult(data);
    } catch {
      setErrorMessage(
        "Não foi possível conectar com o backend. Confirme se http://localhost:8000 está rodando."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="gridGlow" />

      <section className="hero">
        <div className="badge">
          <span className="pulse" />
          AI Affiliate Marketing SaaS
        </div>

        <h1>
          AffiliateAI <span>Pro</span>
        </h1>

        <p className="subtitle">
          Descubra produtos, analise oportunidades e gere estratégias de venda
          com agentes inteligentes para marketing de afiliados.
        </p>

        <div className="productHunterLayout">
          <section className="formPanel">
            <div className="panelHeader">
              <span className="dot" />
              Product Hunter Agent
            </div>

            <div className="formGrid">
              <label>
                Nicho
                <input value={niche} onChange={(e) => setNiche(e.target.value)} />
              </label>

              <label>
                Produto
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </label>

              <label className="full">
                Público-alvo
                <input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </label>

              <label>
                Marketplace
                <select
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                >
                  <option value="shopee">Shopee</option>
                  <option value="mercado_livre">Mercado Livre</option>
                  <option value="amazon">Amazon</option>
                  <option value="hotmart">Hotmart</option>
                  <option value="kiwify">Kiwify</option>
                  <option value="monetizze">Monetizze</option>
                  <option value="generic">Genérico</option>
                </select>
              </label>

              <label>
                Canal principal
                <select
                  value={mainChannel}
                  onChange={(e) => setMainChannel(e.target.value)}
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
                Preço médio
                <input
                  type="number"
                  value={averagePrice}
                  onChange={(e) => setAveragePrice(e.target.value)}
                />
              </label>

              <label>
                Comissão %
                <input
                  type="number"
                  value={commissionPercent}
                  onChange={(e) => setCommissionPercent(e.target.value)}
                />
              </label>

              <label>
                Concorrência 0-100
                <input
                  type="number"
                  value={estimatedCompetition}
                  onChange={(e) => setEstimatedCompetition(e.target.value)}
                />
              </label>

              <label>
                Tendência 0-100
                <input
                  type="number"
                  value={trendSignal}
                  onChange={(e) => setTrendSignal(e.target.value)}
                />
              </label>
            </div>

            <button className="primaryButton analyzeButton" onClick={analyzeProduct}>
              {loading ? "Analisando..." : "Analisar oportunidade"}
            </button>

            {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          </section>

          <section className="resultPanel">
            <div className="panelHeader">
              <span className="dot" />
              Resultado da Análise
            </div>

            {!result && (
              <div className="emptyState">
                <p>
                  Preencha os dados do produto e clique em analisar para gerar a
                  estratégia.
                </p>
              </div>
            )}

            {result && (
              <div className="resultContent">
                <div className="scoreCircle">
                  <span>{result.score.final_score}</span>
                  <small>/100</small>
                </div>

                <h2>{result.decision}</h2>

                <p className="resultProduct">
                  {result.product_name} · {result.marketplace}
                </p>

                <div className="scoreGrid">
                  <div>
                    <strong>{result.score.demand_score}</strong>
                    <span>Demanda</span>
                  </div>
                  <div>
                    <strong>{result.score.virality_score}</strong>
                    <span>Viralização</span>
                  </div>
                  <div>
                    <strong>{result.score.profit_score}</strong>
                    <span>Lucro</span>
                  </div>
                  <div>
                    <strong>{result.score.competition_score}</strong>
                    <span>Concorrência</span>
                  </div>
                </div>

                <div className="strategyBlock">
                  <h3>Posicionamento</h3>
                  <p>{result.strategy.positioning}</p>
                </div>

                <div className="strategyBlock">
                  <h3>Ângulo de venda</h3>
                  <p>{result.strategy.sales_angle}</p>
                </div>

                <div className="strategyBlock">
                  <h3>Ideias de conteúdo</h3>
                  <ul>
                    {result.strategy.content_ideas.map((idea) => (
                      <li key={idea}>{idea}</li>
                    ))}
                  </ul>
                </div>

                <div className="strategyBlock">
                  <h3>Alertas</h3>
                  <ul>
                    {result.strategy.warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}