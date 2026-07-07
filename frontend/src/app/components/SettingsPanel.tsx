"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type SettingsPanelProps = {
  token: string;
  userName: string;
  userEmail: string;
};

type UserPreferences = {
  defaultNiche: string;
  defaultChannel: string;
  defaultCampaignStyle: string;
  defaultBudgetStyle: string;
  defaultMarketplace: string;
  language: string;
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

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultNiche: "beleza",
  defaultChannel: "tiktok",
  defaultCampaignStyle: "viral",
  defaultBudgetStyle: "organico",
  defaultMarketplace: "shopee",
  language: "pt-BR",
};

export default function SettingsPanel({
  token,
  userName,
  userEmail,
}: SettingsPanelProps) {
  const [preferences, setPreferences] =
    useState<UserPreferences>(DEFAULT_PREFERENCES);

  const [savedMessage, setSavedMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    loadPreferencesFromApi();
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function mapApiToPreferences(data: UserSettingsResponse): UserPreferences {
    return {
      defaultNiche: data.default_niche,
      defaultChannel: data.default_channel,
      defaultCampaignStyle: data.default_campaign_style,
      defaultBudgetStyle: data.default_budget_style,
      defaultMarketplace: data.default_marketplace,
      language: data.language,
    };
  }

  function mapPreferencesToApiPayload(data: UserPreferences) {
    return {
      default_niche: data.defaultNiche,
      default_channel: data.defaultChannel,
      default_campaign_style: data.defaultCampaignStyle,
      default_budget_style: data.defaultBudgetStyle,
      default_marketplace: data.defaultMarketplace,
      language: data.language,
    };
  }

  function saveLocalCache(data: UserPreferences) {
    localStorage.setItem("affiliateai_preferences", JSON.stringify(data));
  }

  function loadLocalCache() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
      setPreferences(DEFAULT_PREFERENCES);
      return;
    }

    try {
      const parsedPreferences = JSON.parse(savedPreferences) as UserPreferences;

      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...parsedPreferences,
      });
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }

  async function loadPreferencesFromApi() {
    setLoadingSettings(true);
    setErrorMessage("");
    setSavedMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        loadLocalCache();
        return;
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        loadLocalCache();
        return;
      }

      const data: UserSettingsResponse = await response.json();
      const mappedPreferences = mapApiToPreferences(data);

      setPreferences(mappedPreferences);
      saveLocalCache(mappedPreferences);
    } catch {
      loadLocalCache();
    } finally {
      setLoadingSettings(false);
    }
  }

  function updatePreference(key: keyof UserPreferences, value: string) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }));

    setSavedMessage("");
    setErrorMessage("");
  }

  async function savePreferences() {
    setSavingSettings(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para salvar configurações.");
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(mapPreferencesToApiPayload(preferences)),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: UserSettingsResponse = await response.json();
      const mappedPreferences = mapApiToPreferences(data);

      setPreferences(mappedPreferences);
      saveLocalCache(mappedPreferences);

      setSavedMessage("Configurações salvas no banco com sucesso.");
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

  async function resetPreferences() {
    setSavingSettings(true);
    setSavedMessage("");
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        localStorage.removeItem("affiliateai_preferences");
        setPreferences(DEFAULT_PREFERENCES);
        setSavedMessage("Configurações restauradas localmente.");
        return;
      }

      const response = await fetch(`${API_URL}/api/user-settings/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify(mapPreferencesToApiPayload(DEFAULT_PREFERENCES)),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: UserSettingsResponse = await response.json();
      const mappedPreferences = mapApiToPreferences(data);

      setPreferences(mappedPreferences);
      saveLocalCache(mappedPreferences);

      setSavedMessage("Configurações restauradas para o padrão.");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao restaurar configurações.");
      }
    } finally {
      setSavingSettings(false);
    }
  }

  function copyTokenPreview() {
    const preview = token ? `${token.slice(0, 18)}...` : "sem token";
    navigator.clipboard.writeText(preview);
    setSavedMessage("Prévia do token copiada.");
  }

  return (
    <section className="settingsPanel">
      <div className="settingsHeader">
        <div>
          <span className="settingsEyebrow">Configurações</span>

          <h2>Central do SaaS</h2>

          <p>
            Ajuste preferências padrão do AffiliateAI Pro. Agora essas
            configurações são salvas no banco por usuário e também mantidas em
            cache local para alimentar os agentes.
          </p>
        </div>

        <div className="settingsStatus">
          <span>Status da sessão</span>
          <strong>{token ? "Autenticado" : "Sem token"}</strong>
          <p>
            {loadingSettings
              ? "Carregando preferências..."
              : "Preferências sincronizadas com o sistema."}
          </p>
        </div>
      </div>

      <div className="settingsLayout">
        <div className="settingsAccountCard">
          <span>Conta conectada</span>

          <div className="settingsAvatar">
            {userName?.slice(0, 1).toUpperCase() || "U"}
          </div>

          <h3>{userName}</h3>
          <p>{userEmail}</p>

          <div className="settingsAccountMeta">
            <div>
              <span>Plano atual</span>
              <strong>Local Dev</strong>
            </div>

            <div>
              <span>Workspace</span>
              <strong>AffiliateAI Pro</strong>
            </div>

            <div>
              <span>Fonte</span>
              <strong>Banco + cache</strong>
            </div>
          </div>

          <button onClick={copyTokenPreview}>Copiar prévia do token</button>
        </div>

        <div className="settingsMainCard">
          <div className="settingsSectionHeader">
            <div>
              <span>Preferências padrão</span>
              <h3>Configuração dos agentes</h3>
            </div>

            {savedMessage && <p>{savedMessage}</p>}
          </div>

          {errorMessage && <p className="errorMessage">{errorMessage}</p>}

          <div className="settingsFormGrid">
            <label>
              Nicho padrão
              <input
                value={preferences.defaultNiche}
                onChange={(event) =>
                  updatePreference("defaultNiche", event.target.value)
                }
                placeholder="Ex: beleza"
              />
            </label>

            <label>
              Canal principal
              <select
                value={preferences.defaultChannel}
                onChange={(event) =>
                  updatePreference("defaultChannel", event.target.value)
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
                value={preferences.defaultCampaignStyle}
                onChange={(event) =>
                  updatePreference("defaultCampaignStyle", event.target.value)
                }
              >
                <option value="viral">Viral</option>
                <option value="direto">Direto</option>
                <option value="premium">Premium</option>
                <option value="popular">Popular</option>
                <option value="emocional">Emocional</option>
                <option value="agressivo">Agressivo</option>
              </select>
            </label>

            <label>
              Orçamento padrão
              <select
                value={preferences.defaultBudgetStyle}
                onChange={(event) =>
                  updatePreference("defaultBudgetStyle", event.target.value)
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
                value={preferences.defaultMarketplace}
                onChange={(event) =>
                  updatePreference("defaultMarketplace", event.target.value)
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
                value={preferences.language}
                onChange={(event) =>
                  updatePreference("language", event.target.value)
                }
              >
                <option value="pt-BR">Português Brasil</option>
                <option value="en-US">Inglês Estados Unidos</option>
                <option value="es">Espanhol</option>
              </select>
            </label>
          </div>

          <div className="settingsActions">
            <button
              className="primaryButton"
              onClick={savePreferences}
              disabled={savingSettings || loadingSettings}
            >
              {savingSettings ? "Salvando..." : "Salvar configurações"}
            </button>

            <button
              className="settingsSecondaryButton"
              onClick={resetPreferences}
              disabled={savingSettings || loadingSettings}
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>

      <div className="settingsGrid">
        <div>
          <span>Banco de dados</span>
          <strong>Preferências por usuário</strong>
          <p>
            Cada conta pode ter seus próprios padrões salvos no backend do
            AffiliateAI Pro.
          </p>
        </div>

        <div>
          <span>Cache local</span>
          <strong>Agentes sincronizados</strong>
          <p>
            O sistema também atualiza o cache local para Autopilot, Product
            Hunter, Content Generator e Creative Image.
          </p>
        </div>

        <div>
          <span>Próxima evolução</span>
          <strong>Configurações avançadas</strong>
          <p>
            Depois podemos adicionar modelo de IA, tom padrão, limites de uso e
            plano do usuário.
          </p>
        </div>
      </div>
    </section>
  );
}