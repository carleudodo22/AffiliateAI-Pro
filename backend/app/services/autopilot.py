from typing import Any

from sqlalchemy.orm import Session

from app.models.affiliate_product import AffiliateProduct
from app.models.autopilot_run import AutopilotRun
from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
from app.schemas.autopilot import AutopilotRequest, AutopilotResponse


class AutopilotService:
    def run_autopilot(
        self,
        data: AutopilotRequest,
        db: Session,
        current_user: User,
    ) -> AutopilotResponse:
        workspace = self._get_workspace_profile(
            db=db,
            current_user=current_user,
        )

        workspace_data = self._workspace_to_dict(workspace)

        requested_niche = data.niche.strip().lower()

        if data.use_auto_pick:
            selected = self._select_product_from_catalog(
                db=db,
                current_user=current_user,
                niche=requested_niche,
            )
        else:
            selected = self._select_product(requested_niche)

        niche = selected.get("niche") or requested_niche

        target_audience = (
            data.target_audience
            or workspace_data["default_target_audience"]
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        score = int(selected["score"])
        decision = self._decision(score)

        affiliate_link = selected.get("affiliate_link") or ""
        product_url = selected.get("product_url") or ""
        product_source = selected.get("source") or "internal_catalog"

        strategy = self._build_strategy(
            product_name=selected["product"],
            niche=niche,
            target_audience=target_audience,
            main_channel=data.main_channel,
            campaign_style=data.campaign_style,
            affiliate_link=affiliate_link,
            workspace=workspace_data,
        )

        headline = self._build_headline(
            product_name=selected["product"],
            campaign_style=data.campaign_style,
            workspace=workspace_data,
        )

        short_copy = self._build_short_copy(
            product_name=selected["product"],
            niche=niche,
            target_audience=target_audience,
            workspace=workspace_data,
        )

        video_script = self._build_video_script(
            product_name=selected["product"],
            niche=niche,
            main_channel=data.main_channel,
            workspace=workspace_data,
        )

        image_brief = self._build_image_brief(
            product_name=selected["product"],
            niche=niche,
            target_audience=target_audience,
            campaign_style=data.campaign_style,
            workspace=workspace_data,
        )

        voiceover_script = self._build_voiceover_script(
            product_name=selected["product"],
            niche=niche,
            target_audience=target_audience,
            workspace=workspace_data,
        )

        checklist = self._build_checklist(
            use_auto_pick=data.use_auto_pick,
            affiliate_link=affiliate_link,
            workspace=workspace_data,
        )

        strategy = self._apply_forbidden_words(strategy, workspace_data)
        headline = self._apply_forbidden_words(headline, workspace_data)
        short_copy = self._apply_forbidden_words(short_copy, workspace_data)
        video_script = self._apply_forbidden_words(video_script, workspace_data)
        image_brief = self._apply_forbidden_words(image_brief, workspace_data)
        voiceover_script = self._apply_forbidden_words(
            voiceover_script,
            workspace_data,
        )

        campaign_package = {
            "auto_pick": {
                "enabled": data.use_auto_pick,
                "source": product_source,
                "catalog_product_id": selected.get("catalog_product_id"),
            },
            "personalization": {
                "enabled": True,
                "workspace_profile": workspace_data,
            },
            "product": {
                "name": selected["product"],
                "marketplace": selected["marketplace"],
                "average_price": selected["average_price"],
                "commission_percent": selected["commission_percent"],
                "reason": selected["reason"],
                "affiliate_link": affiliate_link,
                "product_url": product_url,
            },
            "market_analysis": {
                "score": score,
                "decision": decision,
                "demand_score": selected["demand_score"],
                "competition_score": selected["competition_score"],
                "visual_strength": selected["visual_strength"],
                "impulse_buy": selected["impulse_buy"],
                "risk_level": selected["risk_level"],
            },
            "content_package": {
                "headline": headline,
                "short_copy": short_copy,
                "video_script": video_script,
                "voiceover_script": voiceover_script,
                "hashtags": self._build_hashtags(
                    niche=niche,
                    product_name=selected["product"],
                    workspace=workspace_data,
                ),
                "ctas": self._build_ctas(workspace_data),
            },
            "creative_package": {
                "image_brief": image_brief,
                "video_direction": self._build_video_direction(workspace_data),
                "sound_direction": self._build_sound_direction(workspace_data),
            },
            "publishing_plan": {
                "main_channel": data.main_channel,
                "campaign_style": data.campaign_style,
                "posting_angle": self._build_posting_angle(workspace_data),
                "test_variations": [
                    "Variação 1: foco em dor.",
                    "Variação 2: foco em antes/depois.",
                    "Variação 3: foco em oferta.",
                ],
            },
            "next_actions": checklist,
        }

        saved_run = AutopilotRun(
            user_id=current_user.id,
            niche=niche,
            target_audience=target_audience,
            objective=data.objective,
            main_channel=data.main_channel,
            budget_style=data.budget_style,
            campaign_style=data.campaign_style,
            selected_product=selected["product"],
            marketplace=selected["marketplace"],
            score=score,
            decision=decision,
            strategy=strategy,
            headline=headline,
            short_copy=short_copy,
            video_script=video_script,
            image_brief=image_brief,
            voiceover_script=voiceover_script,
            checklist=checklist,
            campaign_package=campaign_package,
            status="completed",
        )

        db.add(saved_run)
        db.commit()
        db.refresh(saved_run)

        return self._to_response(saved_run)

    def get_run_response(self, run: AutopilotRun) -> AutopilotResponse:
        return self._to_response(run)

    def get_autopilot_response(self, run: AutopilotRun) -> AutopilotResponse:
        return self._to_response(run)

    def _to_response(self, run: AutopilotRun) -> AutopilotResponse:
        return AutopilotResponse(
            id=run.id,
            agent="Affiliate Autopilot",
            status=run.status,
            niche=run.niche,
            target_audience=run.target_audience,
            objective=run.objective,
            main_channel=run.main_channel,
            budget_style=run.budget_style,
            campaign_style=run.campaign_style,
            selected_product=run.selected_product,
            marketplace=run.marketplace,
            score=run.score,
            decision=run.decision,
            strategy=run.strategy,
            headline=run.headline,
            short_copy=run.short_copy,
            video_script=run.video_script,
            image_brief=run.image_brief,
            voiceover_script=run.voiceover_script,
            checklist=run.checklist,
            campaign_package=run.campaign_package,
            created_at=run.created_at,
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

    def _select_product_from_catalog(
        self,
        db: Session,
        current_user: User,
        niche: str,
    ) -> dict:
        base_query = (
            db.query(AffiliateProduct)
            .filter(AffiliateProduct.user_id == current_user.id)
            .filter(AffiliateProduct.is_active == True)
        )

        same_niche_products = (
            base_query
            .filter(AffiliateProduct.niche == niche)
            .all()
        )

        products = same_niche_products or base_query.all()

        if not products:
            return self._select_product(niche)

        ranked_products = sorted(
            products,
            key=self._calculate_catalog_score,
            reverse=True,
        )

        return self._affiliate_product_to_selected(ranked_products[0])

    def _affiliate_product_to_selected(
        self,
        product: AffiliateProduct,
    ) -> dict:
        raw_score = self._calculate_catalog_score(product)
        score = int(max(0, min(raw_score, 100)))

        has_affiliate_link = bool(product.affiliate_link)
        is_affiliated = product.status == "afiliado"

        risk_level = "baixo" if has_affiliate_link and is_affiliated else "médio"

        reason = (
            "Produto escolhido automaticamente pelo Auto Pick do catálogo. "
            "A pontuação considera status de afiliado, link salvo, comissão, preço, "
            "marketplace e disponibilidade para campanha."
        )

        if not has_affiliate_link:
            reason += " Atenção: o produto ainda precisa de link de afiliado antes de publicar."

        return {
            "product": product.product_name,
            "niche": product.niche,
            "marketplace": product.marketplace,
            "average_price": product.average_price or 0,
            "commission_percent": product.commission_percent or 0,
            "demand_score": min(score + 8, 100),
            "competition_score": 55,
            "visual_strength": min(score + 5, 100),
            "impulse_buy": min(score + 3, 100),
            "risk_level": risk_level,
            "score": score,
            "reason": reason,
            "affiliate_link": product.affiliate_link or "",
            "product_url": product.product_url or "",
            "catalog_product_id": product.id,
            "source": "catalog_auto_pick",
        }

    def _calculate_catalog_score(
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

    def _select_product(self, niche: str) -> dict:
        catalog = {
            "beleza": {
                "product": "escova secadora",
                "niche": "beleza",
                "marketplace": "shopee",
                "average_price": 119.90,
                "commission_percent": 12,
                "demand_score": 88,
                "competition_score": 58,
                "visual_strength": 92,
                "impulse_buy": 82,
                "risk_level": "médio",
                "score": 81,
                "reason": "Produto visual, forte para antes/depois e fácil de demonstrar em vídeo curto.",
                "affiliate_link": "",
                "product_url": "",
                "source": "internal_catalog",
            },
            "fitness": {
                "product": "mini elástico para treino",
                "niche": "fitness",
                "marketplace": "mercado_livre",
                "average_price": 39.90,
                "commission_percent": 12,
                "demand_score": 82,
                "competition_score": 43,
                "visual_strength": 84,
                "impulse_buy": 86,
                "risk_level": "baixo",
                "score": 79,
                "reason": "Produto barato, visual e fácil de demonstrar com treino em casa.",
                "affiliate_link": "",
                "product_url": "",
                "source": "internal_catalog",
            },
            "automotivo": {
                "product": "aspirador portátil automotivo",
                "niche": "automotivo",
                "marketplace": "amazon",
                "average_price": 99.90,
                "commission_percent": 11,
                "demand_score": 79,
                "competition_score": 52,
                "visual_strength": 88,
                "impulse_buy": 74,
                "risk_level": "médio",
                "score": 76,
                "reason": "Ótimo para vídeos de antes/depois na limpeza do carro.",
                "affiliate_link": "",
                "product_url": "",
                "source": "internal_catalog",
            },
            "casa": {
                "product": "mini processador elétrico",
                "niche": "casa",
                "marketplace": "shopee",
                "average_price": 89.90,
                "commission_percent": 12,
                "demand_score": 86,
                "competition_score": 55,
                "visual_strength": 91,
                "impulse_buy": 84,
                "risk_level": "médio",
                "score": 82,
                "reason": "Produto visual, prático e forte para demonstração na cozinha.",
                "affiliate_link": "",
                "product_url": "",
                "source": "internal_catalog",
            },
            "pet": {
                "product": "escova removedora de pelos pet",
                "niche": "pet",
                "marketplace": "shopee",
                "average_price": 49.90,
                "commission_percent": 10,
                "demand_score": 80,
                "competition_score": 44,
                "visual_strength": 85,
                "impulse_buy": 82,
                "risk_level": "baixo",
                "score": 78,
                "reason": "Produto com demonstração visual forte e dor clara para donos de pets.",
                "affiliate_link": "",
                "product_url": "",
                "source": "internal_catalog",
            },
        }

        return catalog.get(
            niche,
            {
                "product": f"produto tendência de {niche}",
                "niche": niche,
                "marketplace": "generic",
                "average_price": 79.90,
                "commission_percent": 10,
                "demand_score": 72,
                "competition_score": 50,
                "visual_strength": 70,
                "impulse_buy": 74,
                "risk_level": "médio",
                "score": 72,
                "reason": "Produto gerado para validação inicial do nicho.",
                "affiliate_link": "",
                "product_url": "",
                "source": "internal_catalog",
            },
        )

    def _decision(self, score: int) -> str:
        if score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if score >= 70:
            return "BOA OPORTUNIDADE"

        if score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "VALIDAR MELHOR"

    def _build_strategy(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        main_channel: str,
        campaign_style: str,
        affiliate_link: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]
        brand_name = workspace["brand_name"]
        tone = workspace["tone"]
        preferred_words = self._preferred_words_text(workspace)

        brand_part = f" para a marca {brand_name}" if brand_name else ""

        link_instruction = (
            "Usar o link de afiliado salvo no catálogo para direcionar o tráfego."
            if affiliate_link
            else "Criar ou colar o link de afiliado oficial antes de publicar."
        )

        return (
            f"Posicionar {product_name}{brand_part} como uma solução prática para {target_audience}. "
            f"No canal {main_channel}, usar campanha em estilo {campaign_style}, com tom {tone}. "
            f"A comunicação deve mostrar dor clara, benefício real, demonstração visual e CTA: {cta}. "
            f"{preferred_words} {link_instruction}"
        )

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
                f"e bem posicionada no nicho de {niche}. Valorize benefício real, apresentação limpa "
                f"e finalize com clareza: {cta} {preferred_words}"
            )

        if tone == "agressivo":
            return (
                f"Se você está no nicho de {niche} e ainda não testou o {product_name}, "
                f"pode estar deixando uma boa oportunidade passar. Mostre a dor, apresente a solução "
                f"e finalize direto: {cta} {preferred_words}"
            )

        if tone == "emocional":
            return (
                f"O {product_name} pode ajudar {target_audience} a ter mais praticidade no dia a dia. "
                f"Mostre uma situação real, conecte com a dor do público e finalize com convite simples: "
                f"{cta} {preferred_words}"
            )

        if tone == "educativo":
            return (
                f"Explique de forma simples como o {product_name} funciona, por que ele pode ser útil "
                f"no nicho de {niche} e quais benefícios fazem sentido para {target_audience}. "
                f"Feche com CTA: {cta} {preferred_words}"
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
            f"Produto em destaque, texto curto e CTA visual: '{cta}'."
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
        use_auto_pick: bool,
        affiliate_link: str,
        workspace: dict[str, Any],
    ) -> list[str]:
        checklist = [
            "Validar se o produto ainda está disponível.",
            "Confirmar comissão e regras da plataforma.",
            "Confirmar se o link de afiliado está correto.",
            "Aplicar o tom de voz definido no Workspace Profile.",
            "Conferir se nenhuma palavra proibida foi usada.",
            "Gerar imagem final respeitando o estilo visual do Workspace.",
            "Gerar vídeo curto com roteiro e narração.",
            "Publicar no canal escolhido.",
            "Acompanhar cliques, conversões e comentários.",
        ]

        if use_auto_pick:
            checklist.insert(
                0,
                "Produto escolhido automaticamente pelo Auto Pick do catálogo.",
            )

        if not affiliate_link:
            checklist.insert(
                1,
                "Produto ainda precisa de link de afiliado antes da publicação.",
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