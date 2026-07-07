"use client";

import { useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type CampaignPackagePanelProps = {
  token: string;
};

type AnyData = Record<string, any>;

export default function CampaignPackagePanel({ token }: CampaignPackagePanelProps) {
  const [autopilot, setAutopilot] = useState<AnyData | null>(null);
  const [productHunter, setProductHunter] = useState<AnyData | null>(null);
  const [contentGenerator, setContentGenerator] = useState<AnyData | null>(null);
  const [creativeImage, setCreativeImage] = useState<AnyData | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");

  useEffect(() => {
    loadPackage();
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  async function fetchLatestDetail(
    historyEndpoint: string,
    detailEndpoint: string
  ) {
    const currentToken = getToken();

    const historyResponse = await fetch(`${API_URL}${historyEndpoint}`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!historyResponse.ok) {
      return null;
    }

    const historyData = await historyResponse.json();

    if (!Array.isArray(historyData) || historyData.length === 0) {
      return null;
    }

    const latestItem = historyData[0];
    const id = latestItem.id ?? latestItem.analysis_id;

    if (!id) {
      return latestItem;
    }

    const detailResponse = await fetch(`${API_URL}${detailEndpoint}/${id}`, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!detailResponse.ok) {
      return latestItem;
    }

    return await detailResponse.json();
  }

  async function loadPackage() {
    setLoading(true);
    setErrorMessage("");
    setCopyMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para montar o pacote.");
      }

      const [
        autopilotResult,
        productHunterResult,
        contentGeneratorResult,
        creativeImageResult,
      ] = await Promise.allSettled([
        fetchLatestDetail("/api/autopilot/history", "/api/autopilot"),
        fetchLatestDetail("/api/product-hunter/history", "/api/product-hunter"),
        fetchLatestDetail(
          "/api/content-generator/history",
          "/api/content-generator"
        ),
        fetchLatestDetail("/api/creative-image/history", "/api/creative-image"),
      ]);

      setAutopilot(
        autopilotResult.status === "fulfilled" ? autopilotResult.value : null
      );

      setProductHunter(
        productHunterResult.status === "fulfilled"
          ? productHunterResult.value
          : null
      );

      setContentGenerator(
        contentGeneratorResult.status === "fulfilled"
          ? contentGeneratorResult.value
          : null
      );

      setCreativeImage(
        creativeImageResult.status === "fulfilled"
          ? creativeImageResult.value
          : null
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao montar pacote de campanha.");
      }

      setAutopilot(null);
      setProductHunter(null);
      setContentGenerator(null);
      setCreativeImage(null);
    } finally {
      setLoading(false);
    }
  }

  function copyText(text: string, message = "Copiado com sucesso.") {
    navigator.clipboard.writeText(text);
    setCopyMessage(message);
  }

  function getValue(data: AnyData | null, keys: string[], fallback = "") {
    if (!data) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, data);

      if (value) return String(value);
    }

    return fallback;
  }

  function getList(data: AnyData | null, keys: string[], fallback: string[] = []) {
    if (!data) return fallback;

    for (const key of keys) {
      const value = key.split(".").reduce<any>((acc, part) => {
        if (!acc) return undefined;
        return acc[part];
      }, data);

      if (Array.isArray(value)) {
        return value.map(String);
      }
    }

    return fallback;
  }

  const packageText = useMemo(() => {
    const productName =
      getValue(autopilot, ["selected_product"]) ||
      getValue(contentGenerator, ["product_name"]) ||
      getValue(creativeImage, ["product_name"]) ||
      getValue(productHunter, ["product_name", "product.name", "name"]) ||
      "Produto ainda não definido";

    const niche =
      getValue(autopilot, ["niche"]) ||
      getValue(contentGenerator, ["niche"]) ||
      getValue(creativeImage, ["niche"]) ||
      getValue(productHunter, ["niche", "category"]) ||
      "Nicho ainda não definido";

    const marketplace =
      getValue(autopilot, ["marketplace"]) ||
      getValue(productHunter, ["marketplace"]) ||
      "Marketplace não definido";

    const score =
      getValue(autopilot, ["score"]) ||
      getValue(productHunter, [
        "score.final_score",
        "final_score",
        "score",
        "analysis.score.final_score",
      ]) ||
      "--";

    const decision =
      getValue(autopilot, ["decision"]) ||
      getValue(productHunter, ["decision", "analysis.decision"]) ||
      "Decisão ainda não definida";

    const strategy = getValue(autopilot, ["strategy"], "Estratégia não gerada.");

    const headline =
      getValue(contentGenerator, ["headline"]) ||
      getValue(autopilot, ["headline"]) ||
      "Headline não gerada.";

    const shortCopy =
      getValue(contentGenerator, ["short_copy"]) ||
      getValue(autopilot, ["short_copy"]) ||
      "Copy curta não gerada.";

    const caption = getValue(
      contentGenerator,
      ["caption"],
      "Legenda não gerada."
    );

    const videoScript =
      getValue(contentGenerator, ["video_script"]) ||
      getValue(autopilot, ["video_script"]) ||
      "Roteiro não gerado.";

    const whatsappText = getValue(
      contentGenerator,
      ["whatsapp_text"],
      "Texto para WhatsApp não gerado."
    );

    const cta =
      getValue(contentGenerator, ["cta"]) ||
      getValue(creativeImage, ["cta"]) ||
      "CTA não gerado.";

    const hashtags = getList(contentGenerator, ["hashtags"]).join(" ");

    const artHeadline = getValue(
      creativeImage,
      ["art_headline"],
      "Título da arte não gerado."
    );

    const artSubtitle = getValue(
      creativeImage,
      ["art_subtitle"],
      "Subtítulo da arte não gerado."
    );

    const visualBrief = getValue(
      creativeImage,
      ["visual_brief"],
      "Briefing visual não gerado."
    );

    const imagePrompt = getValue(
      creativeImage,
      ["image_prompt"],
      "Prompt de imagem não gerado."
    );

    const negativePrompt = getValue(
      creativeImage,
      ["negative_prompt"],
      "Negative prompt não gerado."
    );

    const checklist = [
      ...getList(autopilot, ["checklist"]),
      ...getList(creativeImage, ["checklist"]),
    ];

    return `PACOTE DE CAMPANHA - AFFILIATEAI PRO

PRODUTO:
${productName}

NICHO:
${niche}

MARKETPLACE:
${marketplace}

SCORE:
${score}/100

DECISÃO:
${decision}

ESTRATÉGIA:
${strategy}

HEADLINE:
${headline}

COPY CURTA:
${shortCopy}

LEGENDA:
${caption}

ROTEIRO DE VÍDEO:
${videoScript}

TEXTO PARA WHATSAPP:
${whatsappText}

CTA:
${cta}

HASHTAGS:
${hashtags || "Hashtags não geradas."}

TEXTO DA ARTE:
Título: ${artHeadline}
Subtítulo: ${artSubtitle}
CTA visual: ${getValue(creativeImage, ["cta"], cta)}

BRIEFING VISUAL:
${visualBrief}

PROMPT DE IMAGEM:
${imagePrompt}

NEGATIVE PROMPT:
${negativePrompt}

CHECKLIST:
${
  checklist.length > 0
    ? checklist.map((item, index) => `${index + 1}. ${item}`).join("\n")
    : "Checklist não gerado."
}`;
  }, [autopilot, productHunter, contentGenerator, creativeImage]);

  const hasAnyData = autopilot || productHunter || contentGenerator || creativeImage;

  return (
    <section className="packagePanel">
      <div className="packageHeader">
        <div>
          <span className="packageEyebrow">Campaign Package</span>

          <h2>Pacote Completo de Campanha</h2>

          <p>
            Junte automaticamente a última campanha, análise, conteúdo e criativo
            visual em uma entrega única pronta para copiar e postar.
          </p>
        </div>

        <div className="packageStatus">
          <span>Status</span>
          <strong>{loading ? "Montando" : "Pronto"}</strong>
          <p>Usando os últimos dados salvos no histórico.</p>
        </div>
      </div>

      <div className="packageActions">
        <button onClick={loadPackage} disabled={loading}>
          {loading ? "Atualizando..." : "Atualizar pacote"}
        </button>

        <button
          className="primaryButton"
          onClick={() =>
            copyText(packageText, "Campanha completa copiada.")
          }
          disabled={!hasAnyData}
        >
          Copiar campanha completa
        </button>
      </div>

      {errorMessage && <p className="errorMessage">{errorMessage}</p>}
      {copyMessage && <p className="successMessage">{copyMessage}</p>}

      {!hasAnyData && !loading && (
        <div className="packageEmpty">
          Gere pelo menos uma campanha no Autopilot, um conteúdo no Content
          Generator e um criativo no Creative Image para montar o pacote completo.
        </div>
      )}

      {hasAnyData && (
        <>
          <div className="packageMetrics">
            <div className={autopilot ? "active" : ""}>
              <span>Autopilot</span>
              <strong>{autopilot ? "Conectado" : "Vazio"}</strong>
            </div>

            <div className={productHunter ? "active" : ""}>
              <span>Product Hunter</span>
              <strong>{productHunter ? "Conectado" : "Vazio"}</strong>
            </div>

            <div className={contentGenerator ? "active" : ""}>
              <span>Content Generator</span>
              <strong>{contentGenerator ? "Conectado" : "Vazio"}</strong>
            </div>

            <div className={creativeImage ? "active" : ""}>
              <span>Creative Image</span>
              <strong>{creativeImage ? "Conectado" : "Vazio"}</strong>
            </div>
          </div>

          <div className="packageGrid">
            <div className="packageCard highlight">
              <h3>Resumo da campanha</h3>

              <p>
                <strong>Produto:</strong>{" "}
                {getValue(autopilot, ["selected_product"]) ||
                  getValue(contentGenerator, ["product_name"]) ||
                  getValue(creativeImage, ["product_name"]) ||
                  "Produto não encontrado"}
              </p>

              <p>
                <strong>Nicho:</strong>{" "}
                {getValue(autopilot, ["niche"]) ||
                  getValue(contentGenerator, ["niche"]) ||
                  getValue(creativeImage, ["niche"]) ||
                  "Nicho não encontrado"}
              </p>

              <p>
                <strong>Score:</strong>{" "}
                {getValue(autopilot, ["score"], "--")}/100
              </p>

              <p>
                <strong>Decisão:</strong>{" "}
                {getValue(autopilot, ["decision"], "Sem decisão")}
              </p>
            </div>

            <div className="packageCard">
              <h3>Estratégia</h3>
              <p>{getValue(autopilot, ["strategy"], "Estratégia não gerada.")}</p>

              <button
                onClick={() =>
                  copyText(
                    getValue(autopilot, ["strategy"], "Estratégia não gerada."),
                    "Estratégia copiada."
                  )
                }
              >
                Copiar
              </button>
            </div>

            <div className="packageCard">
              <h3>Copy principal</h3>
              <p>
                {getValue(contentGenerator, ["short_copy"]) ||
                  getValue(autopilot, ["short_copy"]) ||
                  "Copy não gerada."}
              </p>

              <button
                onClick={() =>
                  copyText(
                    getValue(contentGenerator, ["short_copy"]) ||
                      getValue(autopilot, ["short_copy"]) ||
                      "Copy não gerada.",
                    "Copy copiada."
                  )
                }
              >
                Copiar
              </button>
            </div>

            <div className="packageCard">
              <h3>Roteiro de vídeo</h3>
              <p>
                {getValue(contentGenerator, ["video_script"]) ||
                  getValue(autopilot, ["video_script"]) ||
                  "Roteiro não gerado."}
              </p>

              <button
                onClick={() =>
                  copyText(
                    getValue(contentGenerator, ["video_script"]) ||
                      getValue(autopilot, ["video_script"]) ||
                      "Roteiro não gerado.",
                    "Roteiro copiado."
                  )
                }
              >
                Copiar
              </button>
            </div>

            <div className="packageCard">
              <h3>Prompt visual</h3>
              <p>
                {getValue(
                  creativeImage,
                  ["image_prompt"],
                  "Prompt de imagem não gerado."
                )}
              </p>

              <button
                onClick={() =>
                  copyText(
                    getValue(
                      creativeImage,
                      ["image_prompt"],
                      "Prompt de imagem não gerado."
                    ),
                    "Prompt visual copiado."
                  )
                }
              >
                Copiar
              </button>
            </div>

            <div className="packageCard">
              <h3>Texto da arte</h3>

              <p>
                <strong>Título:</strong>{" "}
                {getValue(creativeImage, ["art_headline"], "Não gerado.")}
              </p>

              <p>
                <strong>Subtítulo:</strong>{" "}
                {getValue(creativeImage, ["art_subtitle"], "Não gerado.")}
              </p>

              <p>
                <strong>CTA:</strong>{" "}
                {getValue(creativeImage, ["cta"], "Não gerado.")}
              </p>
            </div>
          </div>

          <div className="packageFinalBox">
            <div>
              <span>Entrega final</span>
              <h3>Campanha completa pronta para copiar</h3>
              <p>
                Esse bloco junta todos os agentes em uma única entrega. Depois a
                gente pode transformar isso em PDF, ZIP ou página de exportação.
              </p>
            </div>

            <textarea readOnly value={packageText} />

            <button
              className="primaryButton"
              onClick={() =>
                copyText(packageText, "Campanha completa copiada.")
              }
            >
              Copiar tudo
            </button>
          </div>
        </>
      )}
    </section>
  );
}