"use client";

import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type AffiliateProductsPanelProps = {
  token: string;
};

type AffiliateProduct = {
  id: number;
  user_id: number;

  product_name: string;
  niche: string;
  marketplace: string;

  product_url: string | null;
  affiliate_link: string | null;

  average_price: number;
  commission_percent: number;

  status: string;
  notes: string | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
};

const DEFAULT_FORM = {
  product_name: "Escova secadora",
  niche: "beleza",
  marketplace: "shopee",
  product_url: "",
  affiliate_link: "",
  average_price: "119.90",
  commission_percent: "12",
  status: "precisa_se_afiliar",
  notes: "",
};

export default function AffiliateProductsPanel({
  token,
}: AffiliateProductsPanelProps) {
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<AffiliateProduct | null>(null);

  const [form, setForm] = useState(DEFAULT_FORM);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [autoPicking, setAutoPicking] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadProducts();
  }, [token]);

  function getToken() {
    return token || localStorage.getItem("affiliateai_token") || "";
  }

  function updateForm(key: keyof typeof DEFAULT_FORM, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  function fillFormWithProduct(product: AffiliateProduct) {
    setSelectedProduct(product);

    setForm({
      product_name: product.product_name || "",
      niche: product.niche || "",
      marketplace: product.marketplace || "shopee",
      product_url: product.product_url || "",
      affiliate_link: product.affiliate_link || "",
      average_price: String(product.average_price || 0),
      commission_percent: String(product.commission_percent || 0),
      status: product.status || "precisa_se_afiliar",
      notes: product.notes || "",
    });
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setSelectedProduct(null);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function formatDate(value?: string) {
    if (!value) return "Sem data";

    try {
      return new Date(value).toLocaleString("pt-BR");
    } catch {
      return value;
    }
  }

  function formatMarketplace(value: string) {
    const labels: Record<string, string> = {
      shopee: "Shopee",
      mercado_livre: "Mercado Livre",
      amazon: "Amazon",
      hotmart: "Hotmart",
      kiwify: "Kiwify",
      monetizze: "Monetizze",
      outro: "Outro",
    };

    return labels[value] || value;
  }

  function formatStatus(value: string) {
    const labels: Record<string, string> = {
      afiliado: "Afiliado",
      precisa_se_afiliar: "Precisa se afiliar",
      pesquisando: "Pesquisando",
      pausado: "Pausado",
    };

    return labels[value] || value;
  }

  async function loadProducts() {
    setLoading(true);
    setErrorMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para carregar produtos.");
      }

      const response = await fetch(`${API_URL}/api/affiliate-products/`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AffiliateProduct[] = await response.json();
      setProducts(data);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao carregar produtos.");
      }

      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  async function autoPickBestProduct() {
    setAutoPicking(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para usar o Auto Pick.");
      }

      const response = await fetch(`${API_URL}/api/affiliate-products/auto-pick`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AffiliateProduct = await response.json();

      fillFormWithProduct(data);

      setSuccessMessage(
        `Auto Pick escolheu: ${data.product_name}. Agora você pode analisar no Product Hunter.`
      );
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao escolher melhor produto.");
      }
    } finally {
      setAutoPicking(false);
    }
  }

  async function saveProduct() {
    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para salvar produtos.");
      }

      const payload = {
        product_name: form.product_name,
        niche: form.niche,
        marketplace: form.marketplace,
        product_url: form.product_url || null,
        affiliate_link: form.affiliate_link || null,
        average_price: Number(form.average_price) || 0,
        commission_percent: Number(form.commission_percent) || 0,
        status: form.status,
        notes: form.notes || null,
      };

      const isEditing = Boolean(selectedProduct);

      const response = await fetch(
        isEditing
          ? `${API_URL}/api/affiliate-products/${selectedProduct?.id}`
          : `${API_URL}/api/affiliate-products/`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      const data: AffiliateProduct = await response.json();

      setSelectedProduct(data);
      setSuccessMessage(
        isEditing
          ? "Produto atualizado com sucesso."
          : "Produto cadastrado com sucesso."
      );

      await loadProducts();

      window.dispatchEvent(new Event("affiliate-products-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao salvar produto.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function analyzeSelectedProduct() {
    if (!selectedProduct) {
      setErrorMessage("Selecione um produto antes de analisar.");
      return;
    }

    setAnalyzing(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado para analisar produtos.");
      }

      const payload = {
        product_name: selectedProduct.product_name,
        niche: selectedProduct.niche,
        marketplace: selectedProduct.marketplace,
        average_price: selectedProduct.average_price || 0,
        commission_percent: selectedProduct.commission_percent || 0,
        target_audience:
          selectedProduct.notes ||
          `pessoas interessadas no nicho de ${selectedProduct.niche}`,
        product_url:
          selectedProduct.affiliate_link ||
          selectedProduct.product_url ||
          null,
      };

      const response = await fetch(`${API_URL}/api/product-hunter/analyze`, {
        method: "POST",
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

      await response.json();

      setSuccessMessage(
        "Produto analisado no Product Hunter e salvo no histórico."
      );

      window.dispatchEvent(new Event("product-hunter-history-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao analisar produto no Product Hunter.");
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function deleteProduct(productId: number) {
    const confirmed = window.confirm(
      "Tem certeza que deseja remover esse produto?"
    );

    if (!confirmed) return;

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const currentToken = getToken();

      if (!currentToken) {
        throw new Error("Você precisa estar logado.");
      }

      const response = await fetch(
        `${API_URL}/api/affiliate-products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text);
      }

      if (selectedProduct?.id === productId) {
        resetForm();
      }

      setSuccessMessage("Produto removido com sucesso.");

      await loadProducts();

      window.dispatchEvent(new Event("affiliate-products-updated"));
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Erro ao remover produto.");
      }
    } finally {
      setLoading(false);
    }
  }

  function openProduct(product: AffiliateProduct) {
    fillFormWithProduct(product);

    setErrorMessage("");
    setSuccessMessage("Produto carregado para edição.");
  }

  const affiliatedProducts = products.filter(
    (product) => product.status === "afiliado"
  );

  const pendingProducts = products.filter(
    (product) => product.status === "precisa_se_afiliar"
  );

  return (
    <section className="productsPanel">
      <div className="productsHeader">
        <div>
          <span className="productsEyebrow">Catálogo de Produtos</span>

          <h2>Produtos Afiliados</h2>

          <p>
            Cadastre produtos, links de afiliado, preço, comissão, marketplace e
            status. Essa é a base para o AffiliateAI Pro começar a escolher
            produtos automaticamente nas próximas etapas.
          </p>
        </div>

        <div className="productsStatus">
          <span>Total no catálogo</span>
          <strong>{products.length}</strong>
          <p>
            {affiliatedProducts.length} afiliados • {pendingProducts.length}{" "}
            pendentes
          </p>

          <button
            className="productsAutoPickButton"
            onClick={autoPickBestProduct}
            disabled={autoPicking || products.length === 0}
          >
            {autoPicking ? "Escolhendo..." : "Auto Pick"}
          </button>
        </div>
      </div>

      <div className="productsStats">
        <div>
          <span>Produtos ativos</span>
          <strong>{products.filter((item) => item.is_active).length}</strong>
          <p>Produtos disponíveis para campanhas.</p>
        </div>

        <div>
          <span>Afiliados</span>
          <strong>{affiliatedProducts.length}</strong>
          <p>Produtos com status de afiliado.</p>
        </div>

        <div>
          <span>Pendentes</span>
          <strong>{pendingProducts.length}</strong>
          <p>Produtos que ainda precisam de link.</p>
        </div>

        <div>
          <span>Próxima fase</span>
          <strong>Auto Pick</strong>
          <p>Autopilot vai escolher produtos do catálogo.</p>
        </div>
      </div>

      <div className="productsLayout">
        <div className="productsFormCard">
          <div className="productsSectionHeader">
            <div>
              <span>
                {selectedProduct ? "Editando produto" : "Novo produto"}
              </span>
              <h3>
                {selectedProduct
                  ? selectedProduct.product_name
                  : "Cadastrar produto"}
              </h3>
            </div>

            {selectedProduct && <button onClick={resetForm}>Novo</button>}
          </div>

          <div className="productsFormGrid">
            <label>
              Nome do produto
              <input
                value={form.product_name}
                onChange={(event) =>
                  updateForm("product_name", event.target.value)
                }
                placeholder="Ex: Escova secadora"
              />
            </label>

            <label>
              Nicho
              <input
                value={form.niche}
                onChange={(event) => updateForm("niche", event.target.value)}
                placeholder="Ex: beleza"
              />
            </label>

            <label>
              Marketplace
              <select
                value={form.marketplace}
                onChange={(event) =>
                  updateForm("marketplace", event.target.value)
                }
              >
                <option value="shopee">Shopee</option>
                <option value="mercado_livre">Mercado Livre</option>
                <option value="amazon">Amazon</option>
                <option value="hotmart">Hotmart</option>
                <option value="kiwify">Kiwify</option>
                <option value="monetizze">Monetizze</option>
                <option value="outro">Outro</option>
              </select>
            </label>

            <label>
              Preço médio
              <input
                value={form.average_price}
                onChange={(event) =>
                  updateForm("average_price", event.target.value)
                }
                placeholder="119.90"
              />
            </label>

            <label>
              Comissão %
              <input
                value={form.commission_percent}
                onChange={(event) =>
                  updateForm("commission_percent", event.target.value)
                }
                placeholder="12"
              />
            </label>

            <label>
              Status
              <select
                value={form.status}
                onChange={(event) => updateForm("status", event.target.value)}
              >
                <option value="afiliado">Afiliado</option>
                <option value="precisa_se_afiliar">Precisa se afiliar</option>
                <option value="pesquisando">Pesquisando</option>
                <option value="pausado">Pausado</option>
              </select>
            </label>

            <label className="productsWide">
              Link do produto
              <input
                value={form.product_url}
                onChange={(event) =>
                  updateForm("product_url", event.target.value)
                }
                placeholder="https://..."
              />
            </label>

            <label className="productsWide">
              Link de afiliado
              <input
                value={form.affiliate_link}
                onChange={(event) =>
                  updateForm("affiliate_link", event.target.value)
                }
                placeholder="Cole aqui seu link de afiliado"
              />
            </label>

            <label className="productsWide">
              Observações
              <textarea
                value={form.notes}
                onChange={(event) => updateForm("notes", event.target.value)}
                placeholder="Ex: produto bom para vídeos curtos, precisa testar criativo..."
              />
            </label>
          </div>

          {errorMessage && <p className="errorMessage">{errorMessage}</p>}
          {successMessage && <p className="successMessage">{successMessage}</p>}

          <div className="productsActions">
            <button
              className="primaryButton"
              onClick={saveProduct}
              disabled={saving}
            >
              {saving
                ? "Salvando..."
                : selectedProduct
                  ? "Atualizar produto"
                  : "Cadastrar produto"}
            </button>

            <button onClick={resetForm}>Limpar formulário</button>

            <button
              onClick={autoPickBestProduct}
              disabled={autoPicking || products.length === 0}
            >
              {autoPicking ? "Escolhendo..." : "Auto Pick"}
            </button>

            <button
              onClick={analyzeSelectedProduct}
              disabled={!selectedProduct || analyzing}
            >
              {analyzing ? "Analisando..." : "Analisar no Product Hunter"}
            </button>
          </div>
        </div>

        <div className="productsListCard">
          <div className="productsSectionHeader">
            <div>
              <span>Banco de produtos</span>
              <h3>Produtos cadastrados</h3>
            </div>

            <button onClick={loadProducts} disabled={loading}>
              {loading ? "Atualizando..." : "Atualizar"}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="productsEmpty">
              Nenhum produto cadastrado ainda. Cadastre seu primeiro produto
              para começar a montar o catálogo.
            </div>
          ) : (
            <div className="productsList">
              {products.map((product) => (
                <button
                  key={product.id}
                  className={`productsItem ${
                    selectedProduct?.id === product.id ? "active" : ""
                  }`}
                  onClick={() => openProduct(product)}
                >
                  <div>
                    <span>{formatStatus(product.status)}</span>
                    <strong>{product.product_name}</strong>
                    <p>
                      {product.niche} • {formatMarketplace(product.marketplace)}
                    </p>
                    <small>{formatDate(product.created_at)}</small>
                  </div>

                  <div>
                    <strong>R$ {product.average_price.toFixed(2)}</strong>
                    <p>{product.commission_percent}% comissão</p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteProduct(product.id);
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <div className="productsDetailBox">
          <div>
            <span>Produto selecionado</span>
            <h3>{selectedProduct.product_name}</h3>
            <p>
              Esse produto já está salvo no banco e agora pode ser enviado para
              o Product Hunter analisar score, oportunidade, riscos, público e
              canais recomendados.
            </p>
          </div>

          <div className="productsDetailGrid">
            <div>
              <span>Status</span>
              <strong>{formatStatus(selectedProduct.status)}</strong>
            </div>

            <div>
              <span>Marketplace</span>
              <strong>{formatMarketplace(selectedProduct.marketplace)}</strong>
            </div>

            <div>
              <span>Preço</span>
              <strong>R$ {selectedProduct.average_price.toFixed(2)}</strong>
            </div>

            <div>
              <span>Comissão</span>
              <strong>{selectedProduct.commission_percent}%</strong>
            </div>
          </div>

          <div className="productsLinks">
            <button onClick={analyzeSelectedProduct} disabled={analyzing}>
              {analyzing ? "Analisando..." : "Analisar no Product Hunter"}
            </button>

            {selectedProduct.product_url && (
              <a href={selectedProduct.product_url} target="_blank">
                Abrir produto
              </a>
            )}

            {selectedProduct.affiliate_link && (
              <a href={selectedProduct.affiliate_link} target="_blank">
                Abrir link de afiliado
              </a>
            )}
          </div>
        </div>
      )}
    </section>
  );
}