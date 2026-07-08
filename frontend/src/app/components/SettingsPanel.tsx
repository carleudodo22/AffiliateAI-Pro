"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SettingsPanelProps = {
  token: string;
  userName?: string;
  userEmail?: string;
};

type UserSettingsResponse = {
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

type WorkspaceProfileResponse = {
  id: number;
  user_id: number;

  project_name: string;
  brand_name: string;

  default_target_audience: string;
  default_cta: string;

  tone: string;
  visual_style: string;
  language: string;

  preferred_words: string[];
  forbidden_words: string[];

  notes: string | null;
  extra_data: Record<string, unknown>;

  created_at: string;
  updated_at: string;
};

type WorkspacePreviewResponse = {
  status: string;
  message: string;
  completion: {
    completed_count: number;
    total_count: number;
    completion_percent: number;
    items: Record<string, boolean>;
  };
  workspace: {
    id: number;
    project_name: string;
    brand_name: string;
    default_target_audience: string;
    default_cta: string;
    tone: string;
    visual_style: string;
    language: string;
    preferred_words: string[];
    forbidden_words: string[];
    notes: string;
  };
  agent_preview: {
    headline: string;
    copy: string;
    visual_direction: string;
    content_rules: string[];
  };
};

type WorkspacePreset = {
  key: string;
  name: string;
  description: string;
  tone: string;
  visual_style: string;
  default_cta: string;
};

type WorkspacePresetsResponse = {
  status: string;
  message: string;
  total: number;
  presets: WorkspacePreset[];
};

const DEFAULT_SETTINGS_FORM = {
  default_niche: "beleza",
  default_channel: "tiktok",
  default_campaign_style: "viral",
  default_budget_style: "organico",
  default_marketplace: "shopee",
  language: "pt-BR",
};

const DEFAULT_WORKSPACE_FORM = {
  project_name: "AffiliateAI Pro",
  brand_name: "",
  default_target_audience:
    "pessoas interessadas em soluções práticas e ofertas úteis",
  default_cta: "Clique no link e confira a oferta.",
  tone: "direto",
  visual_style: "premium_dark",
  language: "pt-BR",
  preferred_words: "estratégia, oferta, resultado, prático",
  forbidden_words: "milagre, dinheiro fácil, garantido",
  notes:
    "Gerar campanhas com aparência profissional, direta e sem promessas exageradas.",
};

export default function SettingsPanel({
  token,
  userName,
  userEmail,
}: SettingsPanelProps) {
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS_FORM);
  const [workspaceForm, setWorkspaceForm] = useState(DEFAULT_WORKSPACE_FORM);

  const [settingsData, setSettingsData] = useState<UserSettingsResponse | null>(
    null
  );

  const [workspaceData, setWorkspaceData] =
    useState<WorkspaceProfileResponse | null>(null);

  const [workspacePreview, setWorkspacePreview] =
    useState<WorkspacePreviewResponse | null>(null);

  const [workspacePresets, setWorkspacePresets] = useState<WorkspacePreset[]>(
    []
  );

  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const [loadingPresets, setLoadingPresets] = useState(false);
  const [applyingPreset, setApplyingPreset] = useState("");
  const [resettingWorkspace, setResettingWorkspace] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function updateSettingsForm(
    key: keyof typeof DEFAULT_SETTINGS_FORM,
    value: string
  ) {
    setSettingsForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function updateWorkspaceForm(
    key: keyof typeof DEFAULT_WORKSPACE_FORM,
    value: string
  ) {
    setWorkspaceForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function formatDate(value?: string | null) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function parseWords(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index);
  }

  function wordsToText(value: string[] | undefined | null) {
    if (!value || value.length === 0) return "";

    return value.join(", ");
  }

  function syncSettingsToLocalStorage(data: UserSettingsResponse) {
    localStorage.setItem("affiliateai_default_niche", data.default_niche);
    localStorage.setItem("affiliateai_default_channel", data.default_channel);
    localStorage.setItem(
      "affiliateai_default_campaign_style",
      data.default_campaign_style
    );
    localStorage.setItem(
      "affiliateai_default_budget_style",
      data.default_budget_style
    );
    localStorage.setItem(
      "affiliateai_default_marketplace",
      data.default_marketplace
    );
    localStorage.setItem("affiliateai_language", data.language);
  }

  function syncWorkspaceToLocalStorage(data: WorkspaceProfileResponse) {
    localStorage.setItem("affiliateai_project_name", data.project_name);
    localStorage.setItem("affiliateai_brand_name", data.brand_name);
    localStorage.setItem(
      "affiliateai_default_target_audience",
      data.default_target_audience
    );
    localStorage.setItem("affiliateai_default_cta", data.default_cta);
    localStorage.setItem("affiliateai_workspace_tone", data.tone);
    localStorage.setItem("affiliateai_visual_style", data.visual_style);
    localStorage.setItem(
      "affiliateai_preferred_words",
      wordsToText(data.preferred_words)
    );
    localStorage.setItem(
      "affiliateai_forbidden_words",
      wordsToText(data.forbidden_words)
    );
  }

  function applyWorkspaceDataToScreen(data: WorkspaceProfileResponse) {
    setWorkspaceData(data);

    setWorkspaceForm({
      project_name: data.project_name || "AffiliateAI Pro",
      brand_name: data.brand_name || "",
      default_target_audience:
        data.default_target_audience ||
        "pessoas interessadas em soluções práticas e ofertas úteis",
      default_cta: data.default_cta || "Clique no link e confira a oferta.",
      tone: data.tone || "direto",
      visual_style: data.visual_style || "premium_dark",
      language: data.language || "pt-BR",
      preferred_words: wordsToText(data.preferred_words),
      forbidden_words: wordsToText(data.forbidden_words),
      notes: data.notes || "",
    });

    syncWorkspaceToLocalStorage(data);
  }

  const loadSettings = useCallback(async () => {
    setLoadingSettings(true);
    setErrorMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        throw new Error(
          "Você precisa estar logado para carregar configurações."
        );
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: UserSettingsResponse = await response.json();

      setSettingsData(data);

      setSettingsForm({
        default_niche: data.default_niche || "beleza",
        default_channel: data.default_channel || "tiktok",
        default_campaign_style: data.default_campaign_style || "viral",
        default_budget_style: data.default_budget_style || "organico",
        default_marketplace: data.default_marketplace || "shopee",
        language: data.language || "pt-BR",
      });

      syncSettingsToLocalStorage(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar configurações.");
      }
    } finally {
      setLoadingSettings(false);
    }
  }, [token]);

  const loadWorkspace = useCallback(async () => {
    setLoadingWorkspace(true);
    setErrorMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        throw new Error("Você precisa estar logado para carregar o Workspace.");
      }

      const response = await fetch(`${API_URL}/api/workspace-profile/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: WorkspaceProfileResponse = await response.json();

      applyWorkspaceDataToScreen(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar Workspace Profile.");
      }
    } finally {
      setLoadingWorkspace(false);
    }
  }, [token]);

  const loadWorkspacePreview = useCallback(async () => {
    setLoadingPreview(true);
    setErrorMessage("");

    try {
      const currentToken =
        token || localStorage.getItem("affiliateai_token") || "";

      if (!currentToken) {
        throw new Error("Você precisa estar logado para carregar a prévia.");
      }

      const response = await fetch(`${API_URL}/api/workspace-profile/preview`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: WorkspacePreviewResponse = await response.json();

      setWorkspacePreview(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar prévia do Workspace.");
      }
    } finally {
      setLoadingPreview(false);
    }
  }, [token]);

  const loadWorkspacePresets = useCallback(async () => {
    setLoadingPresets(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_URL}/api/workspace-profile/presets`);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: WorkspacePresetsResponse = await response.json();

      setWorkspacePresets(data.presets || []);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar presets do Workspace.");
      }
    } finally {
      setLoadingPresets(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadWorkspace();
    loadWorkspacePreview();
    loadWorkspacePresets();
  }, [
    loadSettings,
    loadWorkspace,
    loadWorkspacePreview,
    loadWorkspacePresets,
  ]);

  async function saveSettings() {
    setSavingSettings(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para salvar configurações.");
      }

      const payload = {
        default_niche: settingsForm.default_niche,
        default_channel: settingsForm.default_channel,
        default_campaign_style: settingsForm.default_campaign_style,
        default_budget_style: settingsForm.default_budget_style,
        default_marketplace: settingsForm.default_marketplace,
        language: settingsForm.language,
      };

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        method: "PUT",
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

      const data: UserSettingsResponse = await response.json();

      setSettingsData(data);
      syncSettingsToLocalStorage(data);

      setSuccessMessage("Preferências rápidas salvas com sucesso.");

      window.dispatchEvent(new Event("user-settings-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao salvar configurações.");
      }
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveWorkspace() {
    setSavingWorkspace(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para salvar o Workspace.");
      }

      const payload = {
        project_name: workspaceForm.project_name,
        brand_name: workspaceForm.brand_name,
        default_target_audience: workspaceForm.default_target_audience,
        default_cta: workspaceForm.default_cta,
        tone: workspaceForm.tone,
        visual_style: workspaceForm.visual_style,
        language: workspaceForm.language,
        preferred_words: parseWords(workspaceForm.preferred_words),
        forbidden_words: parseWords(workspaceForm.forbidden_words),
        notes: workspaceForm.notes || null,
        extra_data: {},
      };

      const response = await fetch(`${API_URL}/api/workspace-profile/me`, {
        method: "PUT",
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

      const data: WorkspaceProfileResponse = await response.json();

      applyWorkspaceDataToScreen(data);

      await loadWorkspacePreview();

      setSuccessMessage("Workspace Profile salvo com sucesso.");

      window.dispatchEvent(new Event("workspace-profile-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao salvar Workspace Profile.");
      }
    } finally {
      setSavingWorkspace(false);
    }
  }

  async function applyWorkspacePreset(presetKey: string, presetName: string) {
    const confirmed = window.confirm(
      `Aplicar o preset "${presetName}"? Ele vai alterar tom, visual, CTA, público-alvo, palavras e observações. Nome da marca e projeto serão mantidos.`
    );

    if (!confirmed) return;

    setApplyingPreset(presetKey);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para aplicar um preset.");
      }

      const response = await fetch(
        `${API_URL}/api/workspace-profile/presets/${presetKey}`,
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

      const data: WorkspaceProfileResponse = await response.json();

      applyWorkspaceDataToScreen(data);

      await loadWorkspacePreview();

      setSuccessMessage(`Preset "${presetName}" aplicado com sucesso.`);

      window.dispatchEvent(new Event("workspace-profile-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao aplicar preset do Workspace.");
      }
    } finally {
      setApplyingPreset("");
    }
  }

  async function resetWorkspaceProfile() {
    const confirmed = window.confirm(
      "Resetar o Workspace para o padrão? Isso mantém nome do projeto e nome da marca, mas volta tom, visual, CTA, palavras e observações para o padrão."
    );

    if (!confirmed) return;

    setResettingWorkspace(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para resetar o Workspace.");
      }

      const response = await fetch(
        `${API_URL}/api/workspace-profile/reset?keep_brand=true`,
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

      const data: WorkspaceProfileResponse = await response.json();

      applyWorkspaceDataToScreen(data);

      await loadWorkspacePreview();

      setSuccessMessage("Workspace resetado para o padrão com sucesso.");

      window.dispatchEvent(new Event("workspace-profile-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao resetar Workspace Profile.");
      }
    } finally {
      setResettingWorkspace(false);
    }
  }

  async function reloadEverything() {
    await Promise.all([
      loadSettings(),
      loadWorkspace(),
      loadWorkspacePreview(),
      loadWorkspacePresets(),
    ]);

    setSuccessMessage("Configurações recarregadas.");
  }

  return (
    <section className="agentPanel settingsPanel">
      <div className="agentHero">
        <div>
          <span className="agentEyebrow">Configurações</span>

          <h2>Personalização do Workspace</h2>

          <p>
            Controle as preferências padrão do AffiliateAI Pro e defina a
            identidade que os agentes vão usar para gerar campanhas mais
            alinhadas com sua marca.
          </p>
        </div>

        <div className="agentHeroStats">
          <span>Personalização</span>
          <strong>
            {workspacePreview
              ? `${workspacePreview.completion.completion_percent}%`
              : "0%"}
          </strong>
          <p>{userEmail || "Conta local do AffiliateAI Pro"}</p>
        </div>
      </div>

      <div className="agentWorkspace">
        <div className="agentFormCard">
          <div className="agentSectionHeader">
            <div>
              <span>Preferências rápidas</span>
              <h3>Padrões dos agentes</h3>
            </div>

            <button
              onClick={loadSettings}
              disabled={loadingSettings || savingSettings}
            >
              {loadingSettings ? "Carregando..." : "Recarregar"}
            </button>
          </div>

          <div className="agentFormGrid">
            <label>
              Nicho padrão
              <input
                value={settingsForm.default_niche}
                onChange={(event) =>
                  updateSettingsForm("default_niche", event.target.value)
                }
                placeholder="Ex: beleza, casa, pet..."
              />
            </label>

            <label>
              Canal padrão
              <select
                value={settingsForm.default_channel}
                onChange={(event) =>
                  updateSettingsForm("default_channel", event.target.value)
                }
              >
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="youtube_shorts">YouTube Shorts</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="pinterest">Pinterest</option>
                <option value="facebook_ads">Facebook Ads</option>
                <option value="google">Google</option>
              </select>
            </label>

            <label>
              Estilo de campanha
              <select
                value={settingsForm.default_campaign_style}
                onChange={(event) =>
                  updateSettingsForm(
                    "default_campaign_style",
                    event.target.value
                  )
                }
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
              Orçamento padrão
              <select
                value={settingsForm.default_budget_style}
                onChange={(event) =>
                  updateSettingsForm("default_budget_style", event.target.value)
                }
              >
                <option value="organico">Orgânico</option>
                <option value="baixo_orcamento">Baixo orçamento</option>
                <option value="trafego_pago">Tráfego pago</option>
              </select>
            </label>

            <label>
              Marketplace padrão
              <select
                value={settingsForm.default_marketplace}
                onChange={(event) =>
                  updateSettingsForm("default_marketplace", event.target.value)
                }
              >
                <option value="shopee">Shopee</option>
                <option value="mercado_livre">Mercado Livre</option>
                <option value="amazon">Amazon</option>
                <option value="hotmart">Hotmart</option>
                <option value="kiwify">Kiwify</option>
                <option value="monetizze">Monetizze</option>
              </select>
            </label>

            <label>
              Idioma
              <select
                value={settingsForm.language}
                onChange={(event) =>
                  updateSettingsForm("language", event.target.value)
                }
              >
                <option value="pt-BR">Português BR</option>
                <option value="en-US">Inglês</option>
                <option value="es">Espanhol</option>
              </select>
            </label>
          </div>

          <div className="agentActions">
            <button
              className="primaryButton"
              onClick={saveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? "Salvando..." : "Salvar preferências"}
            </button>

            <button onClick={reloadEverything}>Recarregar tudo</button>
          </div>

          <div className="agentInfoBox">
            <span>Uso no sistema</span>

            <p>
              Essas preferências alimentam Autopilot, Product Hunter, Content
              Generator, Creative Image e Campaign Package.
            </p>
          </div>
        </div>

        <div className="agentHistoryCard">
          <div className="agentSectionHeader">
            <div>
              <span>Resumo</span>
              <h3>Status da personalização</h3>
            </div>

            <button onClick={loadWorkspacePreview} disabled={loadingPreview}>
              {loadingPreview ? "Atualizando..." : "Ver prévia"}
            </button>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Nicho</span>
              <strong>{settingsForm.default_niche}</strong>
            </div>

            <div>
              <span>Canal</span>
              <strong>{settingsForm.default_channel}</strong>
            </div>

            <div>
              <span>Marca</span>
              <strong>{workspaceForm.brand_name || "Não definida"}</strong>
            </div>

            <div>
              <span>Tom</span>
              <strong>{workspaceForm.tone}</strong>
            </div>

            <div>
              <span>Visual</span>
              <strong>{workspaceForm.visual_style}</strong>
            </div>

            <div>
              <span>Completo</span>
              <strong>
                {workspacePreview
                  ? `${workspacePreview.completion.completion_percent}%`
                  : "--"}
              </strong>
            </div>
          </div>

          <div className="agentInfoBox">
            <span>Última atualização</span>

            <p>
              Preferências: {formatDate(settingsData?.updated_at)} • Workspace:{" "}
              {formatDate(workspaceData?.updated_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="agentResultCard">
        <div className="agentResultHeader">
          <div>
            <span>Presets de Workspace</span>
            <h3>Escolha um estilo pronto</h3>
            <p>
              Aplique uma personalidade pronta para acelerar a configuração dos
              agentes. O preset mantém o nome da sua marca e do projeto.
            </p>
          </div>

          <button onClick={loadWorkspacePresets} disabled={loadingPresets}>
            {loadingPresets ? "Carregando..." : "Recarregar presets"}
          </button>
        </div>

        {workspacePresets.length === 0 ? (
          <div className="agentEmptyBox">
            Nenhum preset carregado ainda. Clique em Recarregar presets.
          </div>
        ) : (
          <div className="agentResultLists">
            {workspacePresets.map((preset) => (
              <div key={preset.key}>
                <h4>{preset.name}</h4>

                <p>{preset.description}</p>

                <ul>
                  <li>Tom: {preset.tone}</li>
                  <li>Visual: {preset.visual_style}</li>
                  <li>CTA: {preset.default_cta}</li>
                </ul>

                <button
                  className="primaryButton"
                  onClick={() =>
                    applyWorkspacePreset(preset.key, preset.name)
                  }
                  disabled={Boolean(applyingPreset)}
                >
                  {applyingPreset === preset.key
                    ? "Aplicando..."
                    : `Aplicar ${preset.name}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="agentResultCard">
        <div className="agentResultHeader">
          <div>
            <span>Workspace Profile</span>
            <h3>Identidade padrão da marca</h3>
            <p>
              Essa parte define como o AffiliateAI Pro deve escrever, vender e
              montar campanhas para você.
            </p>
          </div>

          <button onClick={loadWorkspace} disabled={loadingWorkspace}>
            {loadingWorkspace ? "Carregando..." : "Recarregar Workspace"}
          </button>
        </div>

        <div className="agentFormGrid">
          <label>
            Nome do projeto
            <input
              value={workspaceForm.project_name}
              onChange={(event) =>
                updateWorkspaceForm("project_name", event.target.value)
              }
              placeholder="Ex: AffiliateAI Pro"
            />
          </label>

          <label>
            Nome da marca
            <input
              value={workspaceForm.brand_name}
              onChange={(event) =>
                updateWorkspaceForm("brand_name", event.target.value)
              }
              placeholder="Ex: Nexus Global"
            />
          </label>

          <label>
            Tom de voz
            <select
              value={workspaceForm.tone}
              onChange={(event) =>
                updateWorkspaceForm("tone", event.target.value)
              }
            >
              <option value="direto">Direto</option>
              <option value="premium">Premium</option>
              <option value="viral">Viral</option>
              <option value="emocional">Emocional</option>
              <option value="agressivo">Agressivo</option>
              <option value="educativo">Educativo</option>
              <option value="minimalista">Minimalista</option>
            </select>
          </label>

          <label>
            Estilo visual
            <select
              value={workspaceForm.visual_style}
              onChange={(event) =>
                updateWorkspaceForm("visual_style", event.target.value)
              }
            >
              <option value="premium_dark">Premium dark</option>
              <option value="clean_light">Clean light</option>
              <option value="neon">Neon</option>
              <option value="luxury">Luxo</option>
              <option value="popular">Popular</option>
              <option value="automotivo">Automotivo</option>
              <option value="beleza">Beleza</option>
            </select>
          </label>

          <label>
            Idioma do Workspace
            <select
              value={workspaceForm.language}
              onChange={(event) =>
                updateWorkspaceForm("language", event.target.value)
              }
            >
              <option value="pt-BR">Português BR</option>
              <option value="en-US">Inglês</option>
              <option value="es">Espanhol</option>
            </select>
          </label>

          <label>
            CTA padrão
            <input
              value={workspaceForm.default_cta}
              onChange={(event) =>
                updateWorkspaceForm("default_cta", event.target.value)
              }
              placeholder="Ex: Clique no link e veja a oferta agora."
            />
          </label>

          <label className="productsWide">
            Público-alvo padrão
            <textarea
              value={workspaceForm.default_target_audience}
              onChange={(event) =>
                updateWorkspaceForm(
                  "default_target_audience",
                  event.target.value
                )
              }
              placeholder="Ex: pessoas que querem ganhar dinheiro com afiliados..."
            />
          </label>

          <label className="productsWide">
            Palavras preferidas
            <input
              value={workspaceForm.preferred_words}
              onChange={(event) =>
                updateWorkspaceForm("preferred_words", event.target.value)
              }
              placeholder="Separe por vírgula. Ex: estratégia, oferta, resultado"
            />
          </label>

          <label className="productsWide">
            Palavras proibidas
            <input
              value={workspaceForm.forbidden_words}
              onChange={(event) =>
                updateWorkspaceForm("forbidden_words", event.target.value)
              }
              placeholder="Separe por vírgula. Ex: milagre, garantido"
            />
          </label>

          <label className="productsWide">
            Observações da marca
            <textarea
              value={workspaceForm.notes}
              onChange={(event) =>
                updateWorkspaceForm("notes", event.target.value)
              }
              placeholder="Ex: campanhas diretas, sem promessas exageradas..."
            />
          </label>
        </div>

        <div className="agentActions">
          <button
            className="primaryButton"
            onClick={saveWorkspace}
            disabled={savingWorkspace}
          >
            {savingWorkspace ? "Salvando..." : "Salvar Workspace Profile"}
          </button>

          <button onClick={loadWorkspacePreview} disabled={loadingPreview}>
            {loadingPreview ? "Gerando prévia..." : "Gerar prévia"}
          </button>

          <button
            onClick={resetWorkspaceProfile}
            disabled={resettingWorkspace}
          >
            {resettingWorkspace ? "Resetando..." : "Resetar Workspace"}
          </button>

          <button onClick={reloadEverything}>Recarregar tudo</button>
        </div>

        {errorMessage && <p className="errorMessage">{errorMessage}</p>}
        {successMessage && <p className="successMessage">{successMessage}</p>}

        <div className="agentMainText">
          <span>Prévia da identidade</span>

          <pre>{`Projeto: ${workspaceForm.project_name}
Marca: ${workspaceForm.brand_name || "Não definida"}
Tom: ${workspaceForm.tone}
Visual: ${workspaceForm.visual_style}
Público-alvo: ${workspaceForm.default_target_audience}
CTA: ${workspaceForm.default_cta}
Palavras preferidas: ${workspaceForm.preferred_words || "Nenhuma"}
Palavras proibidas: ${workspaceForm.forbidden_words || "Nenhuma"}
Observações: ${workspaceForm.notes || "Nenhuma"}`}</pre>
        </div>
      </div>

      {workspacePreview && (
        <div className="agentResultCard">
          <div className="agentResultHeader">
            <div>
              <span>Prévia dos agentes</span>
              <h3>Como o sistema está enxergando sua marca</h3>
              <p>
                Essa prévia vem direto do backend e mostra como Autopilot,
                Product Hunter, Content Generator, Creative Image e Campaign
                Flow vão usar o Workspace.
              </p>
            </div>

            <div className="agentHeroStats">
              <span>Completo</span>
              <strong>
                {workspacePreview.completion.completion_percent}%
              </strong>
              <p>
                {workspacePreview.completion.completed_count}/
                {workspacePreview.completion.total_count} campos preenchidos
              </p>
            </div>
          </div>

          <div className="agentResultStats">
            <div>
              <span>Projeto</span>
              <strong>{workspacePreview.workspace.project_name}</strong>
            </div>

            <div>
              <span>Marca</span>
              <strong>{workspacePreview.workspace.brand_name}</strong>
            </div>

            <div>
              <span>Tom</span>
              <strong>{workspacePreview.workspace.tone}</strong>
            </div>

            <div>
              <span>Visual</span>
              <strong>{workspacePreview.workspace.visual_style}</strong>
            </div>

            <div>
              <span>Idioma</span>
              <strong>{workspacePreview.workspace.language}</strong>
            </div>

            <div>
              <span>CTA</span>
              <strong>Definido</strong>
            </div>
          </div>

          <div className="agentMainText">
            <span>Headline que os agentes podem usar</span>
            <pre>{workspacePreview.agent_preview.headline}</pre>
          </div>

          <div className="agentMainText">
            <span>Copy base personalizada</span>
            <pre>{workspacePreview.agent_preview.copy}</pre>
          </div>

          <div className="agentMainText">
            <span>Direção visual</span>
            <pre>{workspacePreview.agent_preview.visual_direction}</pre>
          </div>

          <div className="agentResultLists">
            <div>
              <h4>Regras de conteúdo</h4>

              <ul>
                {workspacePreview.agent_preview.content_rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Checklist do perfil</h4>

              <ul>
                {Object.entries(workspacePreview.completion.items).map(
                  ([key, value]) => (
                    <li key={key}>
                      {value ? "✅" : "⚠️"} {key}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}