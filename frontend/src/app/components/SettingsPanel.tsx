"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    loadPreferences();
  }, []);

  function loadPreferences() {
    const savedPreferences = localStorage.getItem("affiliateai_preferences");

    if (!savedPreferences) {
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

  function updatePreference(key: keyof UserPreferences, value: string) {
    setPreferences((currentPreferences) => ({
      ...currentPreferences,
      [key]: value,
    }));

    setSavedMessage("");
  }

  function savePreferences() {
    localStorage.setItem(
      "affiliateai_preferences",
      JSON.stringify(preferences)
    );

    setSavedMessage("Configurações salvas com sucesso.");
  }

  function resetPreferences() {
    localStorage.removeItem("affiliateai_preferences");
    setPreferences(DEFAULT_PREFERENCES);
    setSavedMessage("Configurações restauradas para o padrão.");
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
            Ajuste preferências padrão do AffiliateAI Pro, dados da conta,
            canais principais, marketplace e estilo de campanha.
          </p>
        </div>

        <div className="settingsStatus">
          <span>Status da sessão</span>
          <strong>{token ? "Autenticado" : "Sem token"}</strong>
          <p>Sua conta está conectada ao painel local do AffiliateAI Pro.</p>
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
              <span>Token</span>
              <strong>{token ? "Ativo" : "Ausente"}</strong>
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
            <button className="primaryButton" onClick={savePreferences}>
              Salvar configurações
            </button>

            <button
              className="settingsSecondaryButton"
              onClick={resetPreferences}
            >
              Restaurar padrão
            </button>
          </div>
        </div>
      </div>

      <div className="settingsGrid">
        <div>
          <span>Próxima integração</span>
          <strong>Preferências nos agentes</strong>
          <p>
            Depois vamos fazer Autopilot, Product Hunter e Content Generator
            carregarem esses padrões automaticamente.
          </p>
        </div>

        <div>
          <span>Plano futuro</span>
          <strong>Free / Pro / Premium</strong>
          <p>
            Essa área vai receber limites de uso, créditos de IA e assinatura
            quando o SaaS evoluir.
          </p>
        </div>

        <div>
          <span>IA futura</span>
          <strong>Modelo e tom padrão</strong>
          <p>
            Aqui vamos configurar comportamento da IA, estilo de resposta e
            formato das campanhas.
          </p>
        </div>
      </div>
    </section>
  );
}