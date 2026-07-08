from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.affiliate_product import AffiliateProduct
from app.models.campaign_package import CampaignPackageRun
from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
from app.schemas.campaign_flow import CampaignFlowRequest, CampaignFlowResponse


class CampaignFlowService:
    def run_campaign_flow(
        self,
        data: CampaignFlowRequest,
        db: Session,
        current_user: User,
    ) -> CampaignFlowResponse:
        workspace = self._get_workspace_profile(
            db=db,
            current_user=current_user,
        )

        workspace_data = self._workspace_to_dict(workspace)

        product = self._choose_product(
            data=data,
            db=db,
            current_user=current_user,
        )

        niche = product["niche"]
        product_name = product["product_name"]
        marketplace = product["marketplace"]

        target_audience = (
            data.target_audience
            or workspace_data["default_target_audience"]
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        score_number = self._calculate_campaign_score(product)
        score = str(score_number)
        decision = self._decision(score_number)

        headline = self._build_headline(
            product_name=product_name,
            campaign_style=data.campaign_style,
            workspace=workspace_data,
        )

        short_copy = self._build_short_copy(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            workspace=workspace_data,
        )

        video_script = self._build_video_script(
            product_name=product_name,
            niche=niche,
            main_channel=data.main_channel,
            workspace=workspace_data,
        )

        image_brief = self._build_image_brief(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            campaign_style=data.campaign_style,
            workspace=workspace_data,
        )

        voiceover_script = self._build_voiceover_script(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            workspace=workspace_data,
        )

        checklist = self._build_checklist(
            product=product,
            workspace=workspace_data,
        )

        headline = self._apply_forbidden_words(headline, workspace_data)
        short_copy = self._apply_forbidden_words(short_copy, workspace_data)
        video_script = self._apply_forbidden_words(video_script, workspace_data)
        image_brief = self._apply_forbidden_words(image_brief, workspace_data)
        voiceover_script = self._apply_forbidden_words(
            voiceover_script,
            workspace_data,
        )

        source_data = {
            "flow": {
                "name": "Campaign Flow",
                "version": "1.1",
                "generated_at": datetime.utcnow().isoformat(),
                "use_auto_pick": data.use_auto_pick,
                "product_id_requested": data.product_id,
                "personalization_enabled": True,
            },
            "workspace_profile": workspace_data,
            "product": product,
            "campaign": {
                "objective": data.objective,
                "main_channel": data.main_channel,
                "budget_style": data.budget_style,
                "campaign_style": data.campaign_style,
                "target_audience": target_audience,
                "brand_name": workspace_data["brand_name"],
                "tone": workspace_data["tone"],
                "visual_style": workspace_data["visual_style"],
                "default_cta": workspace_data["default_cta"],
            },
            "analysis": {
                "score": score,
                "decision": decision,
                "reason": product["reason"],
                "risk_level": product["risk_level"],
            },
            "content": {
                "headline": headline,
                "short_copy": short_copy,
                "video_script": video_script,
                "voiceover_script": voiceover_script,
                "hashtags": self._build_hashtags(
                    niche=niche,
                    product_name=product_name,
                    workspace=workspace_data,
                ),
                "ctas": self._build_ctas(workspace_data),
            },
            "creative": {
                "image_brief": image_brief,
                "video_direction": self._build_video_direction(workspace_data),
                "sound_direction": self._build_sound_direction(workspace_data),
            },
            "publishing_plan": {
                "main_channel": data.main_channel,
                "posting_angle": self._build_posting_angle(workspace_data),
                "test_variations": [
                    "Variação 1: foco na dor.",
                    "Variação 2: foco em demonstração.",
                    "Variação 3: foco na oferta.",
                ],
            },
            "next_actions": checklist,
        }

        package_text = self._build_package_text(
            product=product,
            score=score,
            decision=decision,
            target_audience=target_audience,
            objective=data.objective,
            main_channel=data.main_channel,
            budget_style=data.budget_style,
            campaign_style=data.campaign_style,
            headline=headline,
            short_copy=short_copy,
            video_script=video_script,
            image_brief=image_brief,
            voiceover_script=voiceover_script,
            checklist=checklist,
            workspace=workspace_data,
        )

        package_text = self._apply_forbidden_words(
            package_text,
            workspace_data,
        )

        saved_package = CampaignPackageRun(
            user_id=current_user.id,
            product_name=product_name,
            niche=niche,
            marketplace=marketplace,
            score=score,
            decision=decision,
            package_text=package_text,
            source_data=source_data,
            status="saved",
        )

        db.add(saved_package)
        db.commit()
        db.refresh(saved_package)

        return CampaignFlowResponse(
            status="completed",
            message="Campaign Flow personalizado gerado e salvo no Campaign Package.",
            saved_package_id=saved_package.id,
            product={
                "id": product["id"],
                "product_name": product_name,
                "niche": niche,
                "marketplace": marketplace,
                "average_price": product["average_price"],
                "commission_percent": product["commission_percent"],
                "product_url": product["product_url"],
                "affiliate_link": product["affiliate_link"],
                "source": product["source"],
            },
            score=score,
            decision=decision,
            headline=headline,
            short_copy=short_copy,
            video_script=video_script,
            image_brief=image_brief,
            voiceover_script=voiceover_script,
            package_text=package_text,
            source_data=source_data,
            created_at=saved_package.created_at,
        )

    def _get_workspace_profile(
        self,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile | None:
        return (
            db.query(WorkspaceProfile)
            .filter(WorkspaceProfile.user_id == current_user.id)
            .first()
        )

    def _workspace_to_dict(
        self,
        workspace: WorkspaceProfile | None,
    ) -> dict[str, Any]:
        if workspace is None:
            return {
                "id": None,
                "project_name": "AffiliateAI Pro",
                "brand_name": "",
                "default_target_audience": (
                    "pessoas interessadas em soluções práticas e ofertas úteis"
                ),
                "default_cta": "Clique no link e confira a oferta.",
                "tone": "direto",
                "visual_style": "premium_dark",
                "language": "pt-BR",
                "preferred_words": [],
                "forbidden_words": [],
                "notes": "",
            }

        return {
            "id": workspace.id,
            "project_name": workspace.project_name or "AffiliateAI Pro",
            "brand_name": workspace.brand_name or "",
            "default_target_audience": (
                workspace.default_target_audience
                or "pessoas interessadas em soluções práticas e ofertas úteis"
            ),
            "default_cta": workspace.default_cta
            or "Clique no link e confira a oferta.",
            "tone": workspace.tone or "direto",
            "visual_style": workspace.visual_style or "premium_dark",
            "language": workspace.language or "pt-BR",
            "preferred_words": workspace.preferred_words or [],
            "forbidden_words": workspace.forbidden_words or [],
            "notes": workspace.notes or "",
        }

    def _choose_product(
        self,
        data: CampaignFlowRequest,
        db: Session,
        current_user: User,
    ) -> dict[str, Any]:
        if data.product_id is not None:
            product = (
                db.query(AffiliateProduct)
                .filter(AffiliateProduct.id == data.product_id)
                .filter(AffiliateProduct.user_id == current_user.id)
                .first()
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail="Produto informado não encontrado no catálogo.",
                )

            return self._product_to_dict(product, source="selected_product")

        if data.use_auto_pick:
            query = (
                db.query(AffiliateProduct)
                .filter(AffiliateProduct.user_id == current_user.id)
                .filter(AffiliateProduct.is_active == True)
            )

            if data.niche:
                same_niche = (
                    query
                    .filter(AffiliateProduct.niche == data.niche.strip().lower())
                    .all()
                )

                products = same_niche or query.all()
            else:
                products = query.all()

            if products:
                ranked = sorted(
                    products,
                    key=self._calculate_product_score,
                    reverse=True,
                )

                return self._product_to_dict(ranked[0], source="auto_pick_catalog")

        return self._fallback_product(data.niche or "tecnologia")

    def _product_to_dict(
        self,
        product: AffiliateProduct,
        source: str,
    ) -> dict[str, Any]:
        has_affiliate_link = bool(product.affiliate_link)
        is_affiliated = product.status == "afiliado"

        reason = (
            "Produto escolhido a partir do Catálogo de Produtos. "
            "A pontuação considera status, link de afiliado, preço, comissão e marketplace."
        )

        if not has_affiliate_link:
            reason += " Atenção: este produto ainda precisa de link de afiliado antes de publicar."

        return {
            "id": product.id,
            "product_name": product.product_name,
            "niche": product.niche,
            "marketplace": product.marketplace,
            "average_price": product.average_price or 0,
            "commission_percent": product.commission_percent or 0,
            "product_url": product.product_url,
            "affiliate_link": product.affiliate_link,
            "status": product.status,
            "source": source,
            "reason": reason,
            "risk_level": "baixo" if has_affiliate_link and is_affiliated else "médio",
        }

    def _fallback_product(
        self,
        niche: str,
    ) -> dict[str, Any]:
        clean_niche = niche.strip().lower() or "tecnologia"

        return {
            "id": None,
            "product_name": f"produto tendência de {clean_niche}",
            "niche": clean_niche,
            "marketplace": "generic",
            "average_price": 79.90,
            "commission_percent": 10,
            "product_url": None,
            "affiliate_link": None,
            "status": "fallback",
            "source": "fallback_internal",
            "reason": "Produto gerado automaticamente porque nenhum produto ativo foi encontrado no catálogo.",
            "risk_level": "médio",
        }

    def _calculate_product_score(
        self,
        product: AffiliateProduct,
    ) -> float:
        score = 0

        if product.status == "afiliado":
            score += 40

        if product.affiliate_link:
            score += 25

        if product.product_url:
            score += 8

        if product.commission_percent:
            score += product.commission_percent * 2.5

        price = product.average_price or 0

        if 30 <= price <= 200:
            score += 20
        elif 200 < price <= 500:
            score += 12
        elif 1 <= price < 30:
            score += 8
        elif price > 500:
            score += 4

        if product.marketplace in ["shopee", "mercado_livre", "amazon"]:
            score += 8

        if product.marketplace in ["hotmart", "kiwify", "monetizze"]:
            score += 10

        return score

    def _calculate_campaign_score(
        self,
        product: dict[str, Any],
    ) -> int:
        score = 45

        if product["status"] == "afiliado":
            score += 18

        if product["affiliate_link"]:
            score += 18

        commission = product["commission_percent"] or 0

        if commission >= 15:
            score += 15
        elif commission >= 10:
            score += 10
        elif commission >= 5:
            score += 6

        price = product["average_price"] or 0

        if 30 <= price <= 200:
            score += 12
        elif 200 < price <= 500:
            score += 8
        elif 1 <= price < 30:
            score += 5

        if product["marketplace"] in ["shopee", "mercado_livre", "amazon"]:
            score += 8

        if product["marketplace"] in ["hotmart", "kiwify", "monetizze"]:
            score += 10

        return int(max(0, min(score, 100)))

    def _decision(
        self,
        score: int,
    ) -> str:
        if score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if score >= 70:
            return "BOA OPORTUNIDADE"

        if score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "VALIDAR MELHOR"

    def _build_headline(
        self,
        product_name: str,
        campaign_style: str,
        workspace: dict[str, Any],
    ) -> str:
        brand_name = workspace["brand_name"]
        tone = workspace["tone"]

        brand_prefix = f"{brand_name}: " if brand_name else ""

        if tone == "premium":
            return f"{brand_prefix}{product_name} para quem busca uma escolha mais inteligente"

        if tone == "emocional":
            return f"{brand_prefix}O {product_name} pode facilitar sua rotina"

        if tone == "agressivo":
            return f"{brand_prefix}Você precisa conhecer o {product_name}"

        if tone == "educativo":
            return f"{brand_prefix}Entenda como o {product_name} pode ajudar"

        if campaign_style == "viral":
            return f"{brand_prefix}Esse {product_name} está chamando atenção"

        return f"{brand_prefix}Conheça o {product_name}"

    def _build_short_copy(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]
        tone = workspace["tone"]
        preferred_words = self._preferred_words_text(workspace)

        if tone == "premium":
            return (
                f"Para {target_audience}, o {product_name} pode ser uma opção mais prática "
                f"e bem posicionada no nicho de {niche}. Use uma comunicação limpa, valorize "
                f"benefício real e finalize com clareza: {cta} {preferred_words}"
            )

        if tone == "agressivo":
            return (
                f"Se você está no nicho de {niche} e ainda não testou o {product_name}, "
                f"pode estar deixando uma boa oportunidade passar. Mostre a dor, apresente "
                f"a solução e finalize direto: {cta} {preferred_words}"
            )

        if tone == "emocional":
            return (
                f"O {product_name} pode ajudar {target_audience} a ter mais praticidade "
                f"no dia a dia. Mostre uma situação real, conecte com a dor do público "
                f"e finalize com um convite simples: {cta} {preferred_words}"
            )

        if tone == "educativo":
            return (
                f"Explique de forma simples como o {product_name} funciona, por que ele pode "
                f"ser útil no nicho de {niche} e quais benefícios fazem sentido para "
                f"{target_audience}. Feche com CTA: {cta} {preferred_words}"
            )

        return (
            f"Se você faz parte de {target_audience} e procura algo prático no nicho de {niche}, "
            f"o {product_name} pode ser uma ótima opção. Mostre o benefício de forma simples, "
            f"visual e direta. {cta} {preferred_words}"
        )

    def _build_video_script(
        self,
        product_name: str,
        niche: str,
        main_channel: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]
        tone = workspace["tone"]

        if tone == "educativo":
            return (
                f"CENA 1: Explique uma dúvida comum no nicho de {niche}. "
                f"CENA 2: Mostre o {product_name} e explique para que serve. "
                "CENA 3: Liste 3 benefícios práticos com texto na tela. "
                f"CENA 4: Finalize com: '{cta}'"
            )

        if tone == "agressivo":
            return (
                f"CENA 1: Abra com uma frase forte sobre uma dor do nicho de {niche}. "
                f"CENA 2: Mostre o {product_name} como solução direta. "
                "CENA 3: Mostre o produto em uso com cortes rápidos. "
                f"CENA 4: Finalize com urgência leve: '{cta}'"
            )

        return (
            f"CENA 1: Mostre uma dor comum no nicho de {niche}. "
            f"CENA 2: Apresente o {product_name} como solução prática. "
            "CENA 3: Mostre 3 benefícios rápidos na tela. "
            f"CENA 4: Finalize no canal {main_channel} com CTA: '{cta}'"
        )

    def _build_image_brief(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        campaign_style: str,
        workspace: dict[str, Any],
    ) -> str:
        visual_style = workspace["visual_style"]
        brand_name = workspace["brand_name"]
        cta = workspace["default_cta"]

        brand_instruction = (
            f"Incluir referência visual discreta da marca {brand_name}. "
            if brand_name
            else ""
        )

        style_map = {
            "premium_dark": "fundo escuro premium, alto contraste, detalhes em verde neon",
            "clean_light": "fundo claro, limpo, minimalista e moderno",
            "neon": "visual futurista com neon, alto contraste e energia",
            "luxury": "visual luxuoso, sofisticado, com sensação de produto premium",
            "popular": "visual chamativo, acessível, com foco em oferta e benefício",
            "automotivo": "visual automotivo, forte, escuro, com textura mecânica",
            "beleza": "visual elegante, limpo, com sensação de cuidado e transformação",
        }

        visual_instruction = style_map.get(
            visual_style,
            "visual moderno, alto contraste e produto em destaque",
        )

        return (
            f"Imagem publicitária vertical 9:16 para afiliado. Produto: {product_name}. "
            f"Nicho: {niche}. Público: {target_audience}. Estilo da campanha: {campaign_style}. "
            f"Direção visual: {visual_instruction}. {brand_instruction}"
            f"Produto em destaque, texto curto, CTA visual: '{cta}'."
        )

    def _build_voiceover_script(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]
        tone = workspace["tone"]

        if tone == "premium":
            return (
                f"Para quem procura uma solução mais prática no nicho de {niche}, "
                f"o {product_name} pode ser uma escolha inteligente. "
                f"Veja os detalhes e compare a oferta. {cta}"
            )

        if tone == "agressivo":
            return (
                f"Muita gente no nicho de {niche} ainda tenta resolver isso do jeito difícil. "
                f"O {product_name} pode simplificar esse processo. {cta}"
            )

        if tone == "emocional":
            return (
                f"Às vezes, uma solução simples já muda a rotina. Para {target_audience}, "
                f"o {product_name} pode trazer mais praticidade no dia a dia. {cta}"
            )

        return (
            f"Você sabia que muita gente no nicho de {niche} ainda tenta resolver isso do jeito difícil? "
            f"Para {target_audience}, o {product_name} pode trazer mais praticidade. {cta}"
        )

    def _build_checklist(
        self,
        product: dict[str, Any],
        workspace: dict[str, Any],
    ) -> list[str]:
        checklist = [
            "Validar se o produto ainda está disponível.",
            "Conferir preço, avaliações e prazo de entrega.",
            "Confirmar comissão e regras da plataforma.",
            "Aplicar o tom de voz definido no Workspace Profile.",
            "Conferir se nenhuma palavra proibida foi usada.",
            "Gerar imagem final respeitando o estilo visual do Workspace.",
            "Gerar vídeo curto com roteiro e narração.",
            "Publicar no canal escolhido.",
            "Acompanhar cliques, conversões e comentários.",
        ]

        if product["source"] == "auto_pick_catalog":
            checklist.insert(
                0,
                "Produto escolhido automaticamente pelo Auto Pick do catálogo.",
            )

        if not product["affiliate_link"]:
            checklist.insert(
                1,
                "Adicionar link de afiliado antes de publicar a campanha.",
            )

        if workspace["brand_name"]:
            checklist.append(
                f"Conferir se a campanha está alinhada com a marca {workspace['brand_name']}.",
            )

        return checklist

    def _build_ctas(
        self,
        workspace: dict[str, Any],
    ) -> list[str]:
        default_cta = workspace["default_cta"]

        ctas = [
            default_cta,
            "Veja a oferta disponível.",
            "Confira os detalhes antes que mude.",
        ]

        clean_ctas: list[str] = []

        for cta in ctas:
            if cta not in clean_ctas:
                clean_ctas.append(cta)

        return clean_ctas

    def _build_hashtags(
        self,
        niche: str,
        product_name: str,
        workspace: dict[str, Any],
    ) -> list[str]:
        brand_name = workspace["brand_name"]

        hashtags = [
            "#afiliados",
            "#marketingdigital",
            "#achadinhos",
            "#oferta",
            f"#{niche.replace(' ', '')}",
            f"#{product_name.replace(' ', '')}",
        ]

        if brand_name:
            hashtags.append(f"#{brand_name.replace(' ', '')}")

        return hashtags

    def _build_video_direction(
        self,
        workspace: dict[str, Any],
    ) -> str:
        visual_style = workspace["visual_style"]

        if visual_style == "premium_dark":
            return "Vídeo vertical 9:16 com fundo escuro, cortes rápidos, texto em alto contraste e CTA forte."

        if visual_style == "clean_light":
            return "Vídeo vertical 9:16 com visual limpo, textos objetivos, bastante espaço visual e CTA claro."

        if visual_style == "neon":
            return "Vídeo vertical 9:16 com energia, neon, cortes rápidos, zooms e texto impactante."

        if visual_style == "luxury":
            return "Vídeo vertical 9:16 com ritmo sofisticado, cenas limpas, produto valorizado e CTA discreto."

        return "Vídeo vertical 9:16 com cortes rápidos, texto na tela e CTA claro."

    def _build_sound_direction(
        self,
        workspace: dict[str, Any],
    ) -> str:
        tone = workspace["tone"]

        if tone == "premium":
            return "Trilha moderna e sofisticada, sem exagero, com narração confiante."

        if tone == "agressivo":
            return "Trilha rápida, impacto no início e narração forte."

        if tone == "emocional":
            return "Trilha leve, envolvente e narração próxima."

        return "Trilha moderna, ritmo rápido e estilo Reels/TikTok."

    def _build_posting_angle(
        self,
        workspace: dict[str, Any],
    ) -> str:
        tone = workspace["tone"]

        if tone == "educativo":
            return (
                "Começar explicando uma dúvida comum, mostrar o produto como solução "
                "e finalizar com CTA claro."
            )

        if tone == "premium":
            return (
                "Começar com posicionamento de valor, mostrar benefício real e finalizar "
                "com CTA limpo."
            )

        if tone == "agressivo":
            return (
                "Começar com dor forte ou curiosidade, mostrar o produto como solução "
                "e finalizar com CTA direto."
            )

        return (
            "Começar com uma dor ou curiosidade, mostrar o produto como solução "
            "e finalizar com CTA direto para o link."
        )

    def _preferred_words_text(
        self,
        workspace: dict[str, Any],
    ) -> str:
        preferred_words = workspace.get("preferred_words", [])

        if not preferred_words:
            return ""

        words = ", ".join([str(word) for word in preferred_words])

        return f"Priorizar ideias como: {words}."

    def _apply_forbidden_words(
        self,
        text: str,
        workspace: dict[str, Any],
    ) -> str:
        forbidden_words = workspace.get("forbidden_words", [])

        clean_text = text

        for word in forbidden_words:
            word_text = str(word).strip()

            if not word_text:
                continue

            clean_text = clean_text.replace(word_text, "[termo removido]")
            clean_text = clean_text.replace(word_text.capitalize(), "[termo removido]")
            clean_text = clean_text.replace(word_text.upper(), "[termo removido]")

        return clean_text

    def _build_package_text(
        self,
        product: dict[str, Any],
        score: str,
        decision: str,
        target_audience: str,
        objective: str,
        main_channel: str,
        budget_style: str,
        campaign_style: str,
        headline: str,
        short_copy: str,
        video_script: str,
        image_brief: str,
        voiceover_script: str,
        checklist: list[str],
        workspace: dict[str, Any],
    ) -> str:
        checklist_text = "\n".join([f"- {item}" for item in checklist])

        affiliate_link = product["affiliate_link"] or "Adicionar link de afiliado"
        product_url = product["product_url"] or "Não informado"

        preferred_words = (
            ", ".join(workspace["preferred_words"])
            if workspace["preferred_words"]
            else "Nenhuma"
        )

        forbidden_words = (
            ", ".join(workspace["forbidden_words"])
            if workspace["forbidden_words"]
            else "Nenhuma"
        )

        brand_name = workspace["brand_name"] or "Não definida"

        return f"""
AFFILIATEAI PRO — CAMPAIGN FLOW PERSONALIZADO

WORKSPACE
Projeto: {workspace["project_name"]}
Marca: {brand_name}
Tom de voz: {workspace["tone"]}
Estilo visual: {workspace["visual_style"]}
Idioma: {workspace["language"]}
CTA padrão: {workspace["default_cta"]}
Palavras preferidas: {preferred_words}
Palavras proibidas: {forbidden_words}
Observações: {workspace["notes"] or "Nenhuma"}

PRODUTO
Nome: {product["product_name"]}
Nicho: {product["niche"]}
Marketplace: {product["marketplace"]}
Preço médio: R$ {product["average_price"]}
Comissão: {product["commission_percent"]}%
Link do produto: {product_url}
Link de afiliado: {affiliate_link}
Origem: {product["source"]}

ANÁLISE
Score: {score}
Decisão: {decision}
Risco: {product["risk_level"]}
Motivo: {product["reason"]}

CAMPANHA
Objetivo: {objective}
Canal principal: {main_channel}
Orçamento: {budget_style}
Estilo: {campaign_style}
Público-alvo: {target_audience}

COPY
Headline: {headline}

Copy curta:
{short_copy}

ROTEIRO DE VÍDEO
{video_script}

NARRAÇÃO
{voiceover_script}

BRIEFING DE IMAGEM
{image_brief}

CHECKLIST
{checklist_text}
""".strip()