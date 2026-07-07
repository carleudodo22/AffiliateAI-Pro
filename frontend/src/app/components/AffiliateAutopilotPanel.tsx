"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AutopilotResult = {
  agent: string;
  status: string;
  niche: string;
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
};

export default function AffiliateAutopilotPanel() {
  const [niche, setNiche] = useState("beleza");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );
  const [mainChannel, setMainChannel] = useState("tiktok");
  const [campaignStyle, setCampaignStyle] = useState("viral");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<AutopilotResult | null>(null);

  async function runAutopilot() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const token = localStorage.getItem("affiliateai_token");

      if (!token) {
        throw new Error("Você precisa estar logado para rodar o Autopilot.");
      }

      const response = await fetch(`${API_URL}/api/autopilot/run`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          niche,
          target_audience: targetAudience,
          objective: "vender",
          main_channel: mainChannel,
          budget_style: "organico",
          campaign_style: campaignStyle,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AutopilotResult = await response.json();
      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao rodar Autopilot.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <section className="autopilotPanel">
      <div className="panelHeader">
        <span className="dot" />
        Affiliate Autopilot Agent
      </div>

      <div className="autopilotIntro">
        <div>
          <h2>Autopilot de Afiliados</h2>
          <p>
            A IA escolhe um produto simulado, analisa a oportunidade e monta
            estratégia, copy, roteiro, imagem e narração.
          </p>
        </div>
      </div>

      <div className="autopilotControls">
        <label>
          Nicho
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="Ex: beleza, fitness, casa, automotivo"
          />
        </label>

        <label>
          Público-alvo
          <input
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            placeholder="Ex: mulheres de 20 a 35 anos..."
          />
        </label>

        <label>
          Canal principal
          <select
            value={mainChannel}
            onChange={(event) => setMainChannel(event.target.value)}
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="pinterest">Pinterest</option>
            <option value="google">Google</option>
            <option value="facebook_ads">Facebook Ads</option>
          </select>
        </label>

        <label>
          Estilo da campanha
          <select
            value={campaignStyle}
            onChange={(event) => setCampaignStyle(event.target.value)}
          >
            <option value="viral">Viral</option>
            <option value="direto">Direto</option>
            <option value="premium">Premium</option>
            <option value="popular">Popular</option>
            <option value="emocional">Emocional</option>
            <option value="agressivo">Agressivo</option>
          </select>
        </label>

        <button
          className="primaryButton autopilotButton"
          onClick={runAutopilot}
          disabled={loading}
        >
          {loading ? "Rodando Autopilot..." : "Rodar Autopilot"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      {result && (
        <div className="autopilotResult">
          <div className="autopilotScoreBox">
            <div>
              <span>Produto escolhido</span>
              <strong>{result.selected_product}</strong>
              <small>{result.marketplace}</small>
            </div>

            <div>
              <span>Score</span>
              <strong>{result.score}/100</strong>
              <small>{result.decision}</small>
            </div>
          </div>

          <div className="autopilotGrid">
            <div className="autopilotCard">
              <h3>Estratégia</h3>
              <p>{result.strategy}</p>
              <button onClick={() => copyText(result.strategy)}>Copiar</button>
            </div>

            <div className="autopilotCard">
              <h3>Headline</h3>
              <p>{result.headline}</p>
              <button onClick={() => copyText(result.headline)}>Copiar</button>
            </div>

            <div className="autopilotCard">
              <h3>Copy curta</h3>
              <p>{result.short_copy}</p>
              <button onClick={() => copyText(result.short_copy)}>Copiar</button>
            </div>

            <div className="autopilotCard">
              <h3>Roteiro de vídeo</h3>
              <p>{result.video_script}</p>
              <button onClick={() => copyText(result.video_script)}>
                Copiar
              </button>
            </div>

            <div className="autopilotCard">
              <h3>Brief de imagem</h3>
              <p>{result.image_brief}</p>
              <button onClick={() => copyText(result.image_brief)}>
                Copiar
              </button>
            </div>

            <div className="autopilotCard">
              <h3>Narração</h3>
              <p>{result.voiceover_script}</p>
              <button onClick={() => copyText(result.voiceover_script)}>
                Copiar
              </button>
            </div>
          </div>

          <div className="autopilotCard">
            <h3>Checklist</h3>
            <ul>
              {result.checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}