from sqlalchemy.orm import Session

from app.models.affiliate_product import AffiliateProduct
from app.models.autopilot_run import AutopilotRun
from app.models.user import User
from app.schemas.autopilot import AutopilotRequest, AutopilotResponse


class AutopilotService:
    def run_autopilot(
        self,
        data: AutopilotRequest,
        db: Session,
        current_user: User,
    ) -> AutopilotResponse:
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
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        score = int(selected["score"])
        decision = self._decision(score)

        affiliate_link = selected.get("affiliate_link") or ""
        product_url = selected.get("product_url") or ""
        product_source = selected.get("source") or "internal_catalog"

        link_instruction = (
            "Usar o link de afiliado salvo no catálogo para direcionar o tráfego."
            if affiliate_link
            else "Criar ou colar o link de afiliado oficial antes de publicar."
        )

        strategy = (
            f"Posicionar {selected['product']} como uma solução prática para {target_audience}. "
            f"No canal {data.main_channel}, usar uma campanha em estilo {data.campaign_style}, "
            "com dor clara, demonstração visual, promessa simples e CTA direto. "
            f"{link_instruction}"
        )

        headline = f"Conheça o {selected['product']}"

        short_copy = (
            f"Se você está no nicho de {niche} e quer mais praticidade, "
            f"o {selected['product']} pode ser uma ótima opção. "
            "Use conteúdo simples, visual e direto para apresentar a oferta."
        )

        video_script = (
            f"CENA 1: Mostre uma dor forte do nicho de {niche}. "
            f"CENA 2: Apresente o {selected['product']} como solução. "
            "CENA 3: Mostre 3 benefícios rápidos. "
            "CENA 4: Finalize com CTA: 'Clique no link e confira a oferta'."
        )

        image_brief = (
            f"Imagem publicitária vertical 9:16 para afiliado. Produto: {selected['product']}. "
            f"Nicho: {niche}. Público: {target_audience}. "
            f"Estilo: {data.campaign_style}. Fundo moderno, alto contraste, produto em destaque e CTA forte."
        )

        voiceover_script = (
            f"Você sabia que muita gente no nicho de {niche} ainda perde tempo tentando resolver isso do jeito difícil? "
            f"O {selected['product']} pode facilitar a rotina e trazer mais praticidade para o dia a dia."
        )

        checklist = [
            "Validar se o produto ainda está disponível.",
            "Confirmar comissão e regras da plataforma.",
            "Confirmar se o link de afiliado está correto.",
            "Gerar imagem final no formato 9:16.",
            "Gerar vídeo curto com roteiro e narração.",
            "Publicar no canal escolhido.",
            "Acompanhar cliques, conversões e comentários.",
        ]

        if data.use_auto_pick:
            checklist.insert(
                0,
                "Produto escolhido automaticamente pelo Auto Pick do catálogo.",
            )

        if not affiliate_link:
            checklist.insert(
                1,
                "Produto ainda precisa de link de afiliado antes da publicação.",
            )

        campaign_package = {
            "auto_pick": {
                "enabled": data.use_auto_pick,
                "source": product_source,
                "catalog_product_id": selected.get("catalog_product_id"),
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
                "hashtags": [
                    "#afiliados",
                    "#marketingdigital",
                    "#achadinhos",
                    "#oferta",
                    f"#{niche.replace(' ', '')}",
                    f"#{selected['product'].replace(' ', '')}",
                ],
                "ctas": [
                    "Clique no link e confira.",
                    "Veja a oferta disponível.",
                    "Garanta o seu enquanto está disponível.",
                ],
            },
            "creative_package": {
                "image_brief": image_brief,
                "video_direction": "Vídeo vertical 9:16 com cortes rápidos, texto na tela e CTA claro.",
                "sound_direction": "Trilha moderna, ritmo rápido, estilo TikTok/Reels.",
            },
            "publishing_plan": {
                "main_channel": data.main_channel,
                "campaign_style": data.campaign_style,
                "posting_angle": (
                    "Começar com dor ou curiosidade, mostrar o produto como solução "
                    "e finalizar com CTA direto."
                ),
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