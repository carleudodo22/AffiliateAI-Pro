from sqlalchemy.orm import Session

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
        niche = data.niche.strip().lower()
        target_audience = (
            data.target_audience
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        selected = self._select_product(niche)
        score = selected["score"]
        decision = self._decision(score)

        strategy = (
            f"Posicionar {selected['product']} como uma solução prática para {target_audience}. "
            f"No canal {data.main_channel}, usar uma campanha em estilo {data.campaign_style}, "
            "com dor clara, demonstração visual, promessa simples e CTA direto."
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
            "Criar link de afiliado oficial.",
            "Gerar imagem final no formato 9:16.",
            "Gerar vídeo curto com roteiro e narração.",
            "Publicar no canal escolhido.",
            "Acompanhar cliques, conversões e comentários.",
        ]

        campaign_package = {
            "product": {
                "name": selected["product"],
                "marketplace": selected["marketplace"],
                "average_price": selected["average_price"],
                "commission_percent": selected["commission_percent"],
                "reason": selected["reason"],
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

    def _select_product(self, niche: str) -> dict:
        catalog = {
            "beleza": {
                "product": "escova secadora",
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
            },
            "fitness": {
                "product": "mini elástico para treino",
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
            },
            "automotivo": {
                "product": "aspirador portátil automotivo",
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
            },
            "casa": {
                "product": "mini processador elétrico",
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
            },
            "pet": {
                "product": "escova removedora de pelos pet",
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
            },
        }

        return catalog.get(
            niche,
            {
                "product": f"produto tendência de {niche}",
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