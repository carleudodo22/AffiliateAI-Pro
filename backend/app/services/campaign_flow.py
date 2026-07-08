from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.affiliate_product import AffiliateProduct
from app.models.campaign_package import CampaignPackageRun
from app.models.user import User
from app.schemas.campaign_flow import CampaignFlowRequest, CampaignFlowResponse


class CampaignFlowService:
    def run_campaign_flow(
        self,
        data: CampaignFlowRequest,
        db: Session,
        current_user: User,
    ) -> CampaignFlowResponse:
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
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        score_number = self._calculate_campaign_score(product)
        score = str(score_number)
        decision = self._decision(score_number)

        headline = self._build_headline(
            product_name=product_name,
            campaign_style=data.campaign_style,
        )

        short_copy = self._build_short_copy(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
        )

        video_script = self._build_video_script(
            product_name=product_name,
            niche=niche,
            main_channel=data.main_channel,
        )

        image_brief = self._build_image_brief(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            campaign_style=data.campaign_style,
        )

        voiceover_script = self._build_voiceover_script(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
        )

        checklist = self._build_checklist(product)

        source_data = {
            "flow": {
                "name": "Campaign Flow",
                "version": "1.0",
                "generated_at": datetime.utcnow().isoformat(),
                "use_auto_pick": data.use_auto_pick,
                "product_id_requested": data.product_id,
            },
            "product": product,
            "campaign": {
                "objective": data.objective,
                "main_channel": data.main_channel,
                "budget_style": data.budget_style,
                "campaign_style": data.campaign_style,
                "target_audience": target_audience,
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
                "hashtags": [
                    "#afiliados",
                    "#marketingdigital",
                    "#achadinhos",
                    "#oferta",
                    f"#{niche.replace(' ', '')}",
                    f"#{product_name.replace(' ', '')}",
                ],
                "ctas": [
                    "Clique no link e confira.",
                    "Veja a oferta disponível.",
                    "Garanta o seu enquanto está disponível.",
                ],
            },
            "creative": {
                "image_brief": image_brief,
                "video_direction": "Vídeo vertical 9:16 com cortes rápidos, texto na tela e CTA claro.",
                "sound_direction": "Trilha moderna, ritmo rápido e estilo Reels/TikTok.",
            },
            "publishing_plan": {
                "main_channel": data.main_channel,
                "posting_angle": (
                    "Começar com uma dor ou curiosidade, mostrar o produto como solução "
                    "e finalizar com CTA direto para o link."
                ),
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
            message="Campaign Flow gerado e salvo no Campaign Package.",
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
    ) -> str:
        if campaign_style == "agressivo":
            return f"Você precisa conhecer o {product_name}"

        if campaign_style == "emocional":
            return f"O {product_name} pode facilitar sua rotina"

        if campaign_style == "premium":
            return f"{product_name}: uma escolha mais inteligente"

        return f"Conheça o {product_name}"

    def _build_short_copy(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
    ) -> str:
        return (
            f"Se você faz parte de {target_audience} e procura algo prático no nicho de {niche}, "
            f"o {product_name} pode ser uma ótima opção. Mostre o benefício de forma simples, "
            "visual e direta, sempre com CTA para conferir a oferta."
        )

    def _build_video_script(
        self,
        product_name: str,
        niche: str,
        main_channel: str,
    ) -> str:
        return (
            f"CENA 1: Mostre uma dor comum no nicho de {niche}. "
            f"CENA 2: Apresente o {product_name} como solução prática. "
            "CENA 3: Mostre 3 benefícios rápidos na tela. "
            f"CENA 4: Finalize com CTA para o público do canal {main_channel}: "
            "'Clique no link e confira a oferta'."
        )

    def _build_image_brief(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        campaign_style: str,
    ) -> str:
        return (
            f"Imagem publicitária vertical 9:16 para afiliado. Produto em destaque: {product_name}. "
            f"Nicho: {niche}. Público: {target_audience}. Estilo: {campaign_style}. "
            "Fundo moderno, alto contraste, visual premium, texto curto e CTA forte."
        )

    def _build_voiceover_script(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
    ) -> str:
        return (
            f"Você sabia que muita gente no nicho de {niche} ainda tenta resolver isso do jeito difícil? "
            f"Para {target_audience}, o {product_name} pode trazer mais praticidade no dia a dia. "
            "Confira a oferta enquanto estiver disponível."
        )

    def _build_checklist(
        self,
        product: dict[str, Any],
    ) -> list[str]:
        checklist = [
            "Validar se o produto ainda está disponível.",
            "Conferir preço, avaliações e prazo de entrega.",
            "Confirmar comissão e regras da plataforma.",
            "Gerar imagem final no formato 9:16.",
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

        return checklist

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
    ) -> str:
        checklist_text = "\n".join([f"- {item}" for item in checklist])

        affiliate_link = product["affiliate_link"] or "Adicionar link de afiliado"
        product_url = product["product_url"] or "Não informado"

        return f"""
AFFILIATEAI PRO — CAMPAIGN FLOW

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