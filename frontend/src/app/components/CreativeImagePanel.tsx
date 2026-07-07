"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CreativeImagePanelProps = {
  token: string;
};

type CreativeImageResult = {
  id: number | null;
  agent: string;
  status: string;

  product_name: string;
  niche: string;
  target_audience: string | null;

  platform: string;
  creative_style: string;
  objective: string;

  art_headline: string;
  art_subtitle: string;
  cta: string;

  visual_brief: string;
  image_prompt: string;
  negative_prompt: string;

  layout_direction: string;
  background_style: string;
  typography_direction: string;

  color_palette: string[];
  checklist: string[];

  creative_package: Record<string, unknown>;

  created_at: string | null;
};

type UserPreferences = {
  defaultNiche?: string;
  defaultChannel?: string;
  defaultCampaignStyle?: string;
  defaultBudgetStyle?: string;
  defaultMarketplace?: string;
  language?: string;
};

export default function CreativeImagePanel({ token }: CreativeImagePanelProps) {
  const [productName, setProductName] = useState("escova secadora");
  const [niche, setNiche] = useState("beleza");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );

  const [platform, setPlatform] = useState("tiktok");
  const [creativeStyle, setCreativeStyle] = useState("viral");
  const [objective, setObjective] = useState("vender");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<CreativeImageResult | null>(null);

  useEffect(() => {
    loadSavedPreferences();
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function loadSavedPreferences() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
      return;
    }

    try {
      const preferences = JSON.parse(savedPreferences) as UserPreferences;

      if (preferences.defaultNiche) {
        setNiche(preferences.defaultNiche);
        setTargetAudience(
          `pessoas interessadas em soluções práticas no nicho de ${preferences.defaultNiche}`
        );

        if (preferences.defaultNiche === "beleza") {
          setProductName("escova secadora");
        } else if (preferences.defaultNiche === "fitness") {
          setProductName("mini elástico para treino");
        } else if (preferences.defaultNiche === "automotivo") {
          setProductName("aspirador portátil automotivo");
        } else if (preferences.defaultNiche === "casa") {
          setProductName("mini processador elétrico");
        } else if (preferences.defaultNiche === "pet") {
          setProductName("escova removedora de pelos pet");
        } else {
          setProductName(`produto tendência de ${preferences.defaultNiche}`);
        }
      }

      if (preferences.defaultChannel) {
        setPlatform(preferences.defaultChannel);
      }

      if (preferences.defaultCampaignStyle) {
        setCreativeStyle(preferences.defaultCampaignStyle);
      }
    } catch {
      return;
    }
  }

  async function generateCreativeImage() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para gerar criativos.");
      }

      const response = await fetch(`${API_URL}/api/creative-image/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          product_name: productName,
          niche,
          target_audience: targetAudience,
          platform,
          creative_style: creativeStyle,
          objective,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: CreativeImageResult = await response.json();

      setResult(data);

      window.dispatchEvent(new Event("creative-image-history-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao gerar criativo visual.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  function formatDate(date: string | null) {
    if (!date) {
      return "Agora";
    }

    return new Date(date).toLocaleString("pt-BR");
  }

  return (
    <section className="creativePanel">
      <div className="creativeHeader">
        <div>
          <span className="creativeEyebrow">Creative Image Agent</span>

          <h2>Gerador de Criativos Visuais</h2>

          <p>
            Gere briefing visual, prompt de imagem, textos da arte, CTA,
            direção de layout, estilo de fundo e checklist para criar artes
            verticais 9:16 para afiliados.
          </p>
        </div>

        <div className="creativeStatus">
          <span>Modo</span>
          <strong>Visual Builder</strong>
          <p>Conectado ao backend e salvando histórico no banco.</p>
        </div>
      </div>

      <div className="creativeFeatureGrid">
        <div>
          <span>01</span>
          <strong>Prompt visual</strong>
          <p>Prompt completo para gerar imagem ou guiar o design da arte.</p>
        </div>

        <div>
          <span>02</span>
          <strong>Texto da arte</strong>
          <p>Título, subtítulo e CTA prontos para colocar no criativo.</p>
        </div>

        <div>
          <span>03</span>
          <strong>Direção 9:16</strong>
          <p>Layout pensado para Reels, TikTok, Shorts e anúncios verticais.</p>
        </div>
      </div>

      <div className="creativeControls">
        <label>
          Produto
          <input
            value={productName}
            onChange={(event) => setProductName(event.target.value)}
            placeholder="Ex: escova secadora"
          />
        </label>

        <label>
          Nicho
          <input
            value={niche}
            onChange={(event) => setNiche(event.target.value)}
            placeholder="Ex: beleza"
          />
        </label>

        <label className="creativeWide">
          Público-alvo
          <input
            value={targetAudience}
            onChange={(event) => setTargetAudience(event.target.value)}
            placeholder="Ex: mulheres de 20 a 35 anos..."
          />
        </label>

        <label>
          Plataforma
          <select
            value={platform}
            onChange={(event) => setPlatform(event.target.value)}
          >
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="youtube_shorts">YouTube Shorts</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook_ads">Facebook Ads</option>
            <option value="google">Google</option>
            <option value="pinterest">Pinterest</option>
          </select>
        </label>

        <label>
          Estilo visual
          <select
            value={creativeStyle}
            onChange={(event) => setCreativeStyle(event.target.value)}
          >
            <option value="viral">Viral</option>
            <option value="direto">Direto</option>
            <option value="premium">Premium</option>
            <option value="popular">Popular</option>
            <option value="emocional">Emocional</option>
            <option value="agressivo">Agressivo</option>
            <option value="minimalista">Minimalista</option>
          </select>
        </label>

        <label>
          Objetivo
          <select
            value={objective}
            onChange={(event) => setObjective(event.target.value)}
          >
            <option value="vender">Vender</option>
            <option value="capturar_lead">Capturar lead</option>
            <option value="aquecer_audiencia">Aquecer audiência</option>
            <option value="validar_produto">Validar produto</option>
          </select>
        </label>

        <button
          className="primaryButton creativeButton"
          onClick={generateCreativeImage}
          disabled={loading}
        >
          {loading ? "Gerando criativo..." : "Gerar Criativo Visual"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      {!result && (
        <div className="creativePreviewPanel">
          <div>
            <span>Prévia do agente</span>
            <h3>O que será gerado</h3>
            <p>
              O agente vai criar uma estrutura visual completa para transformar
              o produto em uma arte de afiliado com aparência profissional.
            </p>
          </div>

          <div className="creativePreviewList">
            <div>Texto principal da arte</div>
            <div>Subtítulo curto</div>
            <div>CTA visual</div>
            <div>Briefing completo</div>
            <div>Prompt de imagem</div>
            <div>Checklist de execução</div>
          </div>
        </div>
      )}

      {result && (
        <div className="creativeResult">
          <div className="creativeScoreBox">
            <div>
              <span>Criativo gerado</span>
              <strong>{result.product_name}</strong>
              <small>
                {result.platform} • {result.creative_style} •{" "}
                {formatDate(result.created_at)}
              </small>
            </div>

            <div>
              <span>Status</span>
              <strong>{result.status}</strong>
              <small>Salvo no banco</small>
            </div>
          </div>

          <div className="creativeTextGrid">
            <div className="creativeCard highlight">
              <h3>Título da arte</h3>
              <p>{result.art_headline}</p>
              <button onClick={() => copyText(result.art_headline)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Subtítulo</h3>
              <p>{result.art_subtitle}</p>
              <button onClick={() => copyText(result.art_subtitle)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>CTA</h3>
              <p>{result.cta}</p>
              <button onClick={() => copyText(result.cta)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>Paleta de cores</h3>
              <p>{result.color_palette.join(", ")}</p>
              <button onClick={() => copyText(result.color_palette.join(", "))}>
                Copiar
              </button>
            </div>
          </div>

          <div className="creativeGrid">
            <div className="creativeCard">
              <h3>Briefing visual</h3>
              <p>{result.visual_brief}</p>
              <button onClick={() => copyText(result.visual_brief)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Prompt de imagem</h3>
              <p>{result.image_prompt}</p>
              <button onClick={() => copyText(result.image_prompt)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Negative prompt</h3>
              <p>{result.negative_prompt}</p>
              <button onClick={() => copyText(result.negative_prompt)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Direção de layout</h3>
              <p>{result.layout_direction}</p>
              <button onClick={() => copyText(result.layout_direction)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Estilo de fundo</h3>
              <p>{result.background_style}</p>
              <button onClick={() => copyText(result.background_style)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Tipografia</h3>
              <p>{result.typography_direction}</p>
              <button onClick={() => copyText(result.typography_direction)}>
                Copiar
              </button>
            </div>
          </div>

          <div className="creativeCard">
            <h3>Checklist de execução</h3>
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