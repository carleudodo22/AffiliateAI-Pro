"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ContentGeneratorResponse = {
  id: number | null;
  source_analysis_id: number | null;
  agent: string;
  niche: string;
  product_name: string;
  platform: string;
  tone: string;
  objective: string;
  content: {
    headline: string;
    product_description: string;
    short_sales_copy: string;
    video_hooks: string[];
    video_scripts: string[];
    instagram_caption: string;
    tiktok_caption: string;
    whatsapp_message: string;
    ad_copy: string;
    ctas: string[];
    hashtags: string[];
  };
};

type ContentGeneratorPanelProps = {
  token: string;
  productName: string;
  niche: string;
  targetAudience: string;
  marketplace: string;
  mainChannel: string;
  analysisId?: number | null;
};

export default function ContentGeneratorPanel({
  token,
  productName,
  niche,
  targetAudience,
  marketplace,
  mainChannel,
  analysisId,
}: ContentGeneratorPanelProps) {
  const [platform, setPlatform] = useState("all");
  const [tone, setTone] = useState("direto");
  const [objective, setObjective] = useState("vender");

  const [contentResult, setContentResult] =
    useState<ContentGeneratorResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function generateContent() {
    setLoading(true);
    setErrorMessage("");
    setCopyMessage("");

    try {
      const response = await fetch(`${API_URL}/api/content-generator/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          analysis_id: analysisId || null,
          niche,
          product_name: productName,
          target_audience: targetAudience,
          marketplace,
          main_channel: mainChannel,
          platform,
          tone,
          objective,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend respondeu erro ${response.status}: ${errorText}`);
      }

      const data: ContentGeneratorResponse = await response.json();
      setContentResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro desconhecido ao gerar conteúdo.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    setCopyMessage("Texto copiado!");
    setTimeout(() => setCopyMessage(""), 1800);
  }

  function joinLines(items: string[]) {
    return items.join("\n");
  }

  return (
    <section className="contentPanel">
      <div className="panelHeader">
        <span className="dot" />
        Content Generator Agent
      </div>

      <div className="contentIntro">
        <div>
          <h2>Gerador de conteúdo de venda</h2>
          <p>
            Gere copies, ganchos, roteiros, legendas, CTA e mensagens para vender
            o produto analisado.
          </p>
        </div>

        <button
          className="primaryButton contentMainButton"
          onClick={generateContent}
          disabled={loading}
        >
          {loading ? "Gerando conteúdo..." : "Gerar conteúdo de venda"}
        </button>
      </div>

      <div className="generatorControls">
        <label>
          Plataforma
          <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
            <option value="all">Todas</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="instagram_reels">Instagram Reels</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook_ads">Facebook Ads</option>
          </select>
        </label>

        <label>
          Tom
          <select value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="direto">Direto</option>
            <option value="emocional">Emocional</option>
            <option value="urgente">Urgente</option>
            <option value="premium">Premium</option>
            <option value="popular">Popular</option>
            <option value="engracado">Engraçado</option>
          </select>
        </label>

        <label>
          Objetivo
          <select
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
          >
            <option value="vender">Vender</option>
            <option value="validar_produto">Validar produto</option>
            <option value="aquecer_audiencia">Aquecer audiência</option>
            <option value="capturar_lead">Capturar lead</option>
          </select>
        </label>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
      {copyMessage && <p className="copyMessage">{copyMessage}</p>}

      {!contentResult && (
        <div className="contentEmpty">
          <p>
            Produto atual: <strong>{productName}</strong> · Nicho:{" "}
            <strong>{niche}</strong>
          </p>
        </div>
      )}

      {contentResult && (
        <div className="contentResultGrid">
          <article className="contentCard featured">
            <div className="contentCardHeader">
              <span>Título principal</span>
              <button onClick={() => copyText(contentResult.content.headline)}>
                Copiar
              </button>
            </div>

            <h3>{contentResult.content.headline}</h3>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Descrição do produto</span>
              <button
                onClick={() => copyText(contentResult.content.product_description)}
              >
                Copiar
              </button>
            </div>

            <p>{contentResult.content.product_description}</p>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Copy curta</span>
              <button onClick={() => copyText(contentResult.content.short_sales_copy)}>
                Copiar
              </button>
            </div>

            <p>{contentResult.content.short_sales_copy}</p>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Ganchos para vídeo</span>
              <button
                onClick={() => copyText(joinLines(contentResult.content.video_hooks))}
              >
                Copiar
              </button>
            </div>

            <ul>
              {contentResult.content.video_hooks.map((hook) => (
                <li key={hook}>{hook}</li>
              ))}
            </ul>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Roteiros curtos</span>
              <button
                onClick={() => copyText(joinLines(contentResult.content.video_scripts))}
              >
                Copiar
              </button>
            </div>

            <ul>
              {contentResult.content.video_scripts.map((script) => (
                <li key={script}>{script}</li>
              ))}
            </ul>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Legenda Instagram</span>
              <button onClick={() => copyText(contentResult.content.instagram_caption)}>
                Copiar
              </button>
            </div>

            <p>{contentResult.content.instagram_caption}</p>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Legenda TikTok</span>
              <button onClick={() => copyText(contentResult.content.tiktok_caption)}>
                Copiar
              </button>
            </div>

            <p>{contentResult.content.tiktok_caption}</p>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Mensagem WhatsApp</span>
              <button onClick={() => copyText(contentResult.content.whatsapp_message)}>
                Copiar
              </button>
            </div>

            <p>{contentResult.content.whatsapp_message}</p>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Copy de anúncio</span>
              <button onClick={() => copyText(contentResult.content.ad_copy)}>
                Copiar
              </button>
            </div>

            <p>{contentResult.content.ad_copy}</p>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>CTAs</span>
              <button onClick={() => copyText(joinLines(contentResult.content.ctas))}>
                Copiar
              </button>
            </div>

            <ul>
              {contentResult.content.ctas.map((cta) => (
                <li key={cta}>{cta}</li>
              ))}
            </ul>
          </article>

          <article className="contentCard">
            <div className="contentCardHeader">
              <span>Hashtags</span>
              <button
                onClick={() => copyText(contentResult.content.hashtags.join(" "))}
              >
                Copiar
              </button>
            </div>

            <p>{contentResult.content.hashtags.join(" ")}</p>
          </article>
        </div>
      )}
    </section>
  );
}