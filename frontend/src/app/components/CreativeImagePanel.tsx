"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CreativeImagePanelProps = {
  token: string;
};

type CreativeResult = Record<string, any>;
type CreativeHistoryItem = Record<string, any>;

type UserPreferences = {
  defaultNiche?: string;
  defaultChannel?: string;
  defaultCampaignStyle?: string;
  defaultBudgetStyle?: string;
  defaultMarketplace?: string;
  language?: string;
};

type UserSettingsApiResponse = {
  id: number;
  user_id: number;
  default_niche: string;
  default_channel: string;
  default_campaign_style: string;
  default_budget_style: string;
  default_marketplace: string;
  language: string;
  created_at: string;
  updated_at: string;
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
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [result, setResult] = useState<CreativeResult | null>(null);
  const [history, setHistory] = useState<CreativeHistoryItem[]>([]);

  useEffect(() => {
    loadUserSettings();
    loadHistory();
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function mapApiSettingsToPreferences(
    data: UserSettingsApiResponse
  ): UserPreferences {
    return {
      defaultNiche: data.default_niche,
      defaultChannel: data.default_channel,
      defaultCampaignStyle: data.default_campaign_style,
      defaultBudgetStyle: data.default_budget_style,
      defaultMarketplace: data.default_marketplace,
      language: data.language,
    };
  }

  function saveLocalPreferences(preferences: UserPreferences) {
    localStorage.setItem("affiliateai_preferences", JSON.stringify(preferences));
  }

  function loadLocalPreferences() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
      return null;
    }

    try {
      return JSON.parse(savedPreferences) as UserPreferences;
    } catch {
      return null;
    }
  }

  function normalizePlatform(savedPlatform?: string) {
    const allowedPlatforms = [
      "tiktok",
      "instagram",
      "youtube_shorts",
      "whatsapp",
      "facebook_ads",
      "google",
      "pinterest",
    ];

    if (savedPlatform && allowedPlatforms.includes(savedPlatform)) {
      return savedPlatform;
    }

    return "tiktok";
  }

  function normalizeCreativeStyle(savedStyle?: string) {
    const allowedStyles = [
      "viral",
      "direto",
      "premium",
      "popular",
      "emocional",
      "agressivo",
      "minimalista",
    ];

    if (savedStyle && allowedStyles.includes(savedStyle)) {
      return savedStyle;
    }

    return "viral";
  }

  function applyProductPresetByNiche(selectedNiche: string) {
    if (selectedNiche === "beleza") {
      setProductName("escova secadora");
      return;
    }

    if (selectedNiche === "fitness") {
      setProductName("mini elástico para treino");
      return;
    }

    if (selectedNiche === "automotivo") {
      setProductName("aspirador portátil automotivo");
      return;
    }

    if (selectedNiche === "casa") {
      setProductName("mini processador elétrico");
      return;
    }

    if (selectedNiche === "pet") {
      setProductName("escova removedora de pelos pet");
      return;
    }

    setProductName(`produto tendência de ${selectedNiche}`);
  }

  function applyPreferences(preferences: UserPreferences) {
    if (preferences.defaultNiche) {
      setNiche(preferences.defaultNiche);
      setTargetAudience(
        `pessoas interessadas em soluções práticas no nicho de ${preferences.defaultNiche}`
      );
      applyProductPresetByNiche(preferences.defaultNiche);
    }

    if (preferences.defaultChannel) {
      setPlatform(normalizePlatform(preferences.defaultChannel));
    }

    if (preferences.defaultCampaignStyle) {
      setCreativeStyle(normalizeCreativeStyle(preferences.defaultCampaignStyle));
    }
  }

  async function loadUserSettings() {
    setLoadingSettings(true);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        const localPreferences = loadLocalPreferences();

        if (localPreferences) {
          applyPreferences(localPreferences);
        }

        return;
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const localPreferences = loadLocalPreferences();

        if (localPreferences) {
          applyPreferences(localPreferences);
        }

        return;
      }

      const data: UserSettingsApiResponse = await response.json();
      const preferences = mapApiSettingsToPreferences(data);

      saveLocalPreferences(preferences);
      applyPreferences(preferences);
    } catch {
      const localPreferences = loadLocalPreferences();

      if (localPreferences) {
        applyPreferences(localPreferences);
      }
    } finally {
      setLoadingSettings(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        setHistory([]);
        return;
      }

      const response = await fetch(`${API_URL}/api/creative-image/history`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        setHistory([]);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function generateCreative() {
    setLoading(true);
    setErrorMessage("");
    setResult(null);

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para gerar criativo visual.");
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

      const data = await response.json();

      setResult(data);
      await loadHistory();

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

  async function openHistoryItem(id: number) {
    setLoading(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado.");
      }

      const response = await fetch(`${API_URL}/api/creative-image/${id}`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data = await response.json();

      setResult(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao abrir criativo.");
      }
    } finally {
      setLoading(false);
    }
  }

  function getValue(keys: string[], fallback: string) {
    if (!result) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, result);

      if (value) return String(value);
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

      if (Array.isArray(value)) {
        return value.map(String);
      }
    }

    return fallback;
  }

  function copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  const artHeadline = getValue(
    ["art_headline", "headline", "creative_package.art_headline"],
    `Transforme sua rotina com ${productName}`
  );

  const artSubtitle = getValue(
    ["art_subtitle", "subtitle", "creative_package.art_subtitle"],
    `Uma solução prática para quem busca resultado no nicho de ${niche}.`
  );

  const cta = getValue(
    ["cta", "creative_package.cta"],
    "Confira a oferta agora"
  );

  const visualBrief = getValue(
    ["visual_brief", "brief", "creative_package.visual_brief"],
    "Criativo vertical 9:16 com produto em destaque, fundo moderno, texto forte e CTA visível."
  );

  const imagePrompt = getValue(
    ["image_prompt", "prompt", "creative_package.image_prompt"],
    `Crie uma arte vertical 9:16 para vender ${productName} no nicho de ${niche}, com visual ${creativeStyle}, composição profissional, produto em destaque, iluminação moderna, título chamativo e CTA claro.`
  );

  const negativePrompt = getValue(
    ["negative_prompt", "creative_package.negative_prompt"],
    "baixa qualidade, texto ilegível, elementos cortados, excesso de informação, layout poluído"
  );

  const layoutDirection = getValue(
    ["layout_direction", "creative_package.layout_direction"],
    "Produto centralizado, título forte no topo, benefício no meio e botão de CTA na parte inferior."
  );

  const backgroundStyle = getValue(
    ["background_style", "creative_package.background_style"],
    "Fundo moderno com contraste, profundidade e aparência premium."
  );

  const typographyDirection = getValue(
    ["typography_direction", "creative_package.typography_direction"],
    "Tipografia grande, forte, legível e com hierarquia clara."
  );

  const colorPalette = getList(
    ["color_palette", "creative_package.color_palette"],
    ["verde neon", "preto", "branco", "cinza escuro"]
  );

  const checklist = getList(
    ["checklist", "creative_package.checklist"],
    [
      "Produto grande e visível",
      "Título legível em tela pequena",
      "CTA claro",
      "Formato vertical 9:16",
      "Pouca poluição visual",
    ]
  );

  return (
    <section className="creativePanel">
      <div className="creativeHeader">
        <div>
          <span className="creativeEyebrow">Creative Image Agent</span>

          <h2>Gerador de Criativo Visual</h2>

          <p>
            Crie a direção completa da arte para afiliados: título, subtítulo,
            CTA, briefing visual, prompt de imagem, negative prompt, layout,
            fundo, tipografia, paleta e checklist. Agora ele também busca
            nicho, canal e estilo direto da API de configurações do usuário.
          </p>
        </div>

        <div className="creativeStatus">
          <span>Configurações</span>
          <strong>{loadingSettings ? "Sincronizando" : "Sincronizadas"}</strong>
          <p>Preferências carregadas direto do banco do usuário.</p>
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
          onClick={generateCreative}
          disabled={loading || loadingSettings}
        >
          {loading ? "Gerando criativo..." : "Gerar Criativo Visual"}
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}

      {!result && (
        <div className="creativePreviewPanel">
          <div>
            <span>Prévia do agente</span>
            <h3>O que será criado</h3>
            <p>
              O agente vai montar uma direção visual completa para transformar o
              produto em uma arte de venda pronta para gerar em IA ou passar
              para design.
            </p>
          </div>

          <div className="creativePreviewList">
            <div>Título da arte</div>
            <div>Subtítulo e CTA</div>
            <div>Briefing visual</div>
            <div>Prompt de imagem</div>
            <div>Negative prompt</div>
            <div>Checklist de qualidade</div>
          </div>
        </div>
      )}

      {result && (
        <div className="creativeResult">
          <div className="creativeScoreBox">
            <div>
              <span>Criativo gerado</span>
              <strong>{productName}</strong>
              <small>
                {platform} • {creativeStyle} • {objective}
              </small>
            </div>

            <div>
              <span>Status</span>
              <strong>Pronto</strong>
              <small>Salvo no histórico</small>
            </div>
          </div>

          <div className="creativeGrid">
            <div className="creativeCard highlight">
              <h3>Título da arte</h3>
              <p>{artHeadline}</p>
              <button onClick={() => copyText(artHeadline)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>Subtítulo</h3>
              <p>{artSubtitle}</p>
              <button onClick={() => copyText(artSubtitle)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>CTA</h3>
              <p>{cta}</p>
              <button onClick={() => copyText(cta)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>Briefing visual</h3>
              <p>{visualBrief}</p>
              <button onClick={() => copyText(visualBrief)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>Direção de layout</h3>
              <p>{layoutDirection}</p>
              <button onClick={() => copyText(layoutDirection)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>Fundo</h3>
              <p>{backgroundStyle}</p>
              <button onClick={() => copyText(backgroundStyle)}>Copiar</button>
            </div>

            <div className="creativeCard">
              <h3>Tipografia</h3>
              <p>{typographyDirection}</p>
              <button onClick={() => copyText(typographyDirection)}>
                Copiar
              </button>
            </div>

            <div className="creativeCard">
              <h3>Paleta</h3>

              <div className="creativePalette">
                {colorPalette.map((color) => (
                  <span key={color}>{color}</span>
                ))}
              </div>

              <button onClick={() => copyText(colorPalette.join(", "))}>
                Copiar
              </button>
            </div>
          </div>

          <div className="creativePromptBox">
            <div>
              <span>Prompt final</span>
              <h3>Prompt de imagem</h3>
              <p>
                Esse é o prompt principal para usar em geradores de imagem ou
                como briefing para criar a arte.
              </p>
            </div>

            <textarea readOnly value={imagePrompt} />

            <button
              className="primaryButton"
              onClick={() => copyText(imagePrompt)}
            >
              Copiar prompt
            </button>
          </div>

          <div className="creativePromptBox">
            <div>
              <span>Controle de qualidade</span>
              <h3>Negative prompt</h3>
            </div>

            <textarea readOnly value={negativePrompt} />

            <button onClick={() => copyText(negativePrompt)}>
              Copiar negative prompt
            </button>
          </div>

          <div className="creativeCard">
            <h3>Checklist da arte</h3>

            <ul>
              {checklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="creativeHistory">
        <div className="creativeHistoryHeader">
          <div>
            <h3>Histórico de criativos</h3>
            <p>Criativos salvos automaticamente no banco.</p>
          </div>

          <button onClick={loadHistory} disabled={loadingHistory}>
            {loadingHistory ? "Atualizando..." : "Atualizar"}
          </button>
        </div>

        {history.length === 0 ? (
          <div className="creativeEmpty">
            Nenhum criativo encontrado ainda. Gere o primeiro criativo visual.
          </div>
        ) : (
          <div className="creativeHistoryList">
            {history.map((item) => {
              const id = item.id ?? item.creative_id;

              return (
                <button
                  key={id}
                  className="creativeHistoryItem"
                  onClick={() => openHistoryItem(Number(id))}
                >
                  <div>
                    <strong>{item.product_name ?? "Produto"}</strong>
                    <span>
                      {item.niche ?? "nicho"} •{" "}
                      {item.platform ?? "plataforma"} •{" "}
                      {item.creative_style ?? "estilo"}
                    </span>
                  </div>

                  <div>
                    <strong>{item.art_headline ?? "Criativo"}</strong>
                    <span>{item.status ?? "salvo"}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}