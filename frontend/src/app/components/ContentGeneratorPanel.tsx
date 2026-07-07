"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ContentGeneratorPanelProps = {
  token: string;
};

type ContentResult = Record<string, any>;

export default function ContentGeneratorPanel({
  token,
}: ContentGeneratorPanelProps) {
  const [productName, setProductName] = useState("escova secadora");
  const [niche, setNiche] = useState("beleza");
  const [targetAudience, setTargetAudience] = useState(
    "mulheres de 20 a 35 anos interessadas em autocuidado"
  );
  const [platform, setPlatform] = useState("tiktok");
  const [tone, setTone] = useState("viral");
  const [objective, setObjective] = useState("vender");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ContentResult | null>(null);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function getValue(keys: string[], fallback: string) {
    if (!result) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, result);

      if (value) return value;
    }

    return fallback;
  }

  function getList(keys: string[], fallback: string[]) {
    if (!result) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, result);

      if (Array.isArray(value)) return value;
    }

    return fallback;
  }

  async function generateContent() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para gerar conteúdo.");
      }

      const payload = {
        product_name: productName,
        niche,
        target_audience: targetAudience,
        platform,
        tone,
        objective,
      };

      const endpoints = [
        `${API_URL}/api/content-generator/generate`,
        `${API_URL}/api/content_generator/generate`,
        `${API_URL}/api/content/generate`,
      ];

      let lastError = "";

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          setResult(data);
          return;
        }

        lastError = await response.text();
      }

      throw new Error(lastError || "Erro ao gerar conteúdo.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao gerar conteúdo.");
      }
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  const headline = getValue(
    ["headline", "content.headline", "generated_content.headline"],
    `Conheça o ${productName}`
  );

  const shortCopy = getValue(
    ["short_copy", "copy", "content.short_copy", "generated_content.short_copy"],
    `Se você está no nicho de ${niche}, o ${productName} pode ser uma solução prática para facilitar sua rotina.`
  );

  const caption = getValue(
    ["caption", "legend", "content.caption", "generated_content.caption"],
    `Esse produto está chamando atenção no nicho de ${niche}. Veja se faz sentido para você e confira a oferta.`
  );

  const videoScript = getValue(
    [
      "video_script",
      "script",
      "content.video_script",
      "generated_content.video_script",
    ],
    `CENA 1: Mostre uma dor do público. CENA 2: Apresente o ${productName}. CENA 3: Mostre benefícios rápidos. CENA 4: Finalize com CTA.`
  );

  const whatsappText = getValue(
    ["whatsapp_text", "whatsapp", "content.whatsapp_text"],
    `Olha esse produto que encontrei: ${productName}. Pode ser uma boa opção para quem busca praticidade no nicho de ${niche}.`
  );

  const cta = getValue(
    ["cta", "content.cta", "generated_content.cta"],
    "Clique no link e confira a oferta."
  );

  const hashtags = getList(
    ["hashtags", "content.hashtags", "generated_content.hashtags"],
    ["#afiliados", "#marketingdigital", "#achadinhos", "#oferta", `#${niche}`]
  );

  const adVariations = getList(
    ["ad_variations", "ads", "content.ad_variations"],
    [
      `Variação 1: ${productName} para quem quer praticidade no dia a dia.`,
      `Variação 2: Veja por que esse produto está chamando atenção no nicho de ${niche}.`,
      `Variação 3: Uma solução simples para quem busca resultado rápido.`,
    ]
  );

  return (
    <section className="contentPanel">
      <div className="contentHeader">
        <div className="contentHeaderMain">
          <span className="contentEyebrow">Content Generator Agent</span>

          <h2>Gerador de Conteúdo</h2>

          <p>
            Crie um pacote completo de conteúdo para afiliados com headline,
            copy, legenda, roteiro, CTA, hashtags, WhatsApp e variações de
            anúncio.
          </p>

          <div className="contentHeroStats">
            <div>
              <strong>8+</strong>
              <span>formatos gerados</span>
            </div>

            <div>
              <strong>9:16</strong>
              <span>pensado para vídeos curtos</span>
            </div>

            <div>
              <strong>CTA</strong>
              <span>foco em conversão</span>
            </div>
          </div>
        </div>

        <div className="contentStatus">
          <span>Modo ativo</span>
          <strong>Creative Builder</strong>
          <p>Pronto para montar campanhas rápidas para TikTok, Reels e Shorts.</p>
        </div>
      </div>

      <div className="contentFeatureGrid">
        <div>
          <span>01</span>
          <strong>Copy de venda</strong>
          <p>Texto curto, direto e pronto para usar na oferta.</p>
        </div>

        <div>
          <span>02</span>
          <strong>Roteiro de vídeo</strong>
          <p>Estrutura rápida para vídeo de afiliado com começo, meio e CTA.</p>
        </div>

        <div>
          <span>03</span>
          <strong>Pacote social</strong>
          <p>Legenda, hashtags, WhatsApp e variações para anúncios.</p>
        </div>
      </div>

      <div className="contentControls">
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

        <label className="contentWide">
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
          </select>
        </label>

        <label>
          Tom
          <select value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="viral">Viral</option>
            <option value="direto">Direto</option>
            <option value="premium">Premium</option>
            <option value="emocional">Emocional</option>
            <option value="agressivo">Agressivo</option>
            <option value="popular">Popular</option>
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
          className="primaryButton contentButton"
          onClick={generateContent}
          disabled={loading}
        >
          {loading ? "Gerando conteúdo..." : "Gerar Pacote de Conteúdo"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      {!result && (
        <div className="contentPreviewPanel">
          <div>
            <span>Prévia do pacote</span>
            <h3>O que será criado</h3>
            <p>
              Depois de clicar em gerar, o agente vai montar um pacote completo
              para usar na campanha do produto informado.
            </p>
          </div>

          <div className="contentPreviewList">
            <div>Headline de impacto</div>
            <div>Copy curta de venda</div>
            <div>Legenda para rede social</div>
            <div>Roteiro de vídeo curto</div>
            <div>Texto para WhatsApp</div>
            <div>CTA e hashtags</div>
          </div>
        </div>
      )}

      {result && (
        <div className="contentResult">
          <div className="contentScoreBox">
            <div>
              <span>Pacote gerado</span>
              <strong>{productName}</strong>
              <small>
                {platform} • {tone} • {objective}
              </small>
            </div>

            <div>
              <span>Status</span>
              <strong>Pronto</strong>
              <small>Copie e use na campanha</small>
            </div>
          </div>

          <div className="contentGrid">
            <div className="contentCard highlight">
              <h3>Headline</h3>
              <p>{headline}</p>
              <button onClick={() => copyText(headline)}>Copiar</button>
            </div>

            <div className="contentCard">
              <h3>Copy curta</h3>
              <p>{shortCopy}</p>
              <button onClick={() => copyText(shortCopy)}>Copiar</button>
            </div>

            <div className="contentCard">
              <h3>Legenda</h3>
              <p>{caption}</p>
              <button onClick={() => copyText(caption)}>Copiar</button>
            </div>

            <div className="contentCard">
              <h3>Roteiro de vídeo</h3>
              <p>{videoScript}</p>
              <button onClick={() => copyText(videoScript)}>Copiar</button>
            </div>

            <div className="contentCard">
              <h3>Texto para WhatsApp</h3>
              <p>{whatsappText}</p>
              <button onClick={() => copyText(whatsappText)}>Copiar</button>
            </div>

            <div className="contentCard">
              <h3>CTA</h3>
              <p>{cta}</p>
              <button onClick={() => copyText(cta)}>Copiar</button>
            </div>
          </div>

          <div className="contentGrid">
            <div className="contentCard">
              <h3>Hashtags</h3>
              <p>{hashtags.join(" ")}</p>
              <button onClick={() => copyText(hashtags.join(" "))}>
                Copiar
              </button>
            </div>

            <div className="contentCard">
              <h3>Variações de anúncio</h3>
              <ul>
                {adVariations.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}