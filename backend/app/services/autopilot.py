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
        target_audience = data.target_audience or self._default_audience(niche)

        candidates = self._discover_candidates(niche=niche)
        selected = self._select_best_candidate(candidates)

        score = selected["score"]
        decision = self._decision(score)

        strategy = self._build_strategy(
            product=selected["product"],
            niche=niche,
            target_audience=target_audience,
            main_channel=data.main_channel,
            campaign_style=data.campaign_style,
        )

        headline = self._build_headline(
            product=selected["product"],
            campaign_style=data.campaign_style,
        )

        short_copy = self._build_short_copy(
            product=selected["product"],
            niche=niche,
            target_audience=target_audience,
        )

        video_script = self._build_video_script(
            product=selected["product"],
            niche=niche,
            main_channel=data.main_channel,
        )

        image_brief = self._build_image_brief(
            product=selected["product"],
            niche=niche,
            target_audience=target_audience,
            campaign_style=data.campaign_style,
        )

        voiceover_script = self._build_voiceover(
            product=selected["product"],
            niche=niche,
            target_audience=target_audience,
        )

        checklist = [
            "Validar se o produto ainda está disponível na plataforma.",
            "Confirmar comissão, prazo de cookie e regras do programa de afiliados.",
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
                "risk_level": self._risk_level(selected["competition_score"]),
            },
            "content_package": {
                "headline": headline,
                "short_copy": short_copy,
                "video_script": video_script,
                "voiceover_script": voiceover_script,
                "hashtags": self._hashtags(niche, selected["product"]),
                "ctas": [
                    "Clique no link e confira.",
                    "Veja a oferta disponível.",
                    "Garanta o seu enquanto está disponível.",
                ],
            },
            "creative_package": {
                "image_brief": image_brief,
                "video_direction": (
                    "Vídeo vertical 9:16 com cortes rápidos, texto na tela, "
                    "demonstração visual e CTA claro no final."
                ),
                "sound_direction": (
                    "Trilha moderna, ritmo rápido, estilo TikTok/Reels, com impacto nos primeiros 3 segundos."
                ),
            },
            "publishing_plan": {
                "main_channel": data.main_channel,
                "campaign_style": data.campaign_style,
                "posting_angle": (
                    "Começar com dor ou curiosidade, mostrar o produto como solução e finalizar com CTA direto."
                ),
                "test_variations": [
                    "Variação 1: foco em dor.",
                    "Variação 2: foco em antes/depois.",
                    "Variação 3: foco em preço/oferta.",
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

    def _default_audience(self, niche: str) -> str:
        return f"pessoas interessadas em soluções práticas no nicho de {niche}"

    def _discover_candidates(self, niche: str) -> list[dict]:
        catalogs = {
            "beleza": [
                {
                    "product": "escova secadora",
                    "marketplace": "shopee",
                    "average_price": 119.90,
                    "commission_percent": 12,
                    "demand_score": 88,
                    "competition_score": 58,
                    "visual_strength": 92,
                    "impulse_buy": 82,
                    "reason": "Produto visual, forte para antes/depois e fácil de demonstrar em vídeo curto.",
                },
                {
                    "product": "modelador de cachos automático",
                    "marketplace": "amazon",
                    "average_price": 149.90,
                    "commission_percent": 10,
                    "demand_score": 82,
                    "competition_score": 54,
                    "visual_strength": 90,
                    "impulse_buy": 76,
                    "reason": "Produto chamativo, com transformação visual clara.",
                },
                {
                    "product": "kit skincare facial",
                    "marketplace": "mercado_livre",
                    "average_price": 79.90,
                    "commission_percent": 9,
                    "demand_score": 78,
                    "competition_score": 61,
                    "visual_strength": 75,
                    "impulse_buy": 80,
                    "reason": "Produto de compra recorrente e fácil de vender com rotina de autocuidado.",
                },
            ],
            "fitness": [
                {
                    "product": "mini elástico para treino",
                    "marketplace": "mercado_livre",
                    "average_price": 39.90,
                    "commission_percent": 12,
                    "demand_score": 82,
                    "competition_score": 43,
                    "visual_strength": 84,
                    "impulse_buy": 86,
                    "reason": "Barato, visual e fácil de demonstrar com treino em casa.",
                },
                {
                    "product": "corda de pular profissional",
                    "marketplace": "shopee",
                    "average_price": 49.90,
                    "commission_percent": 10,
                    "demand_score": 76,
                    "competition_score": 46,
                    "visual_strength": 78,
                    "impulse_buy": 79,
                    "reason": "Produto simples, barato e bom para vídeos rápidos.",
                },
            ],
            "automotivo": [
                {
                    "product": "aspirador portátil automotivo",
                    "marketplace": "amazon",
                    "average_price": 99.90,
                    "commission_percent": 11,
                    "demand_score": 79,
                    "competition_score": 52,
                    "visual_strength": 88,
                    "impulse_buy": 74,
                    "reason": "Ótimo para vídeos de antes/depois na limpeza do carro.",
                },
                {
                    "product": "suporte veicular magnético",
                    "marketplace": "mercado_livre",
                    "average_price": 34.90,
                    "commission_percent": 8,
                    "demand_score": 72,
                    "competition_score": 48,
                    "visual_strength": 70,
                    "impulse_buy": 83,
                    "reason": "Produto barato e de compra rápida.",
                },
            ],
            "casa": [
                {
                    "product": "mini processador elétrico",
                    "marketplace": "shopee",
                    "average_price": 89.90,
                    "commission_percent": 12,
                    "demand_score": 86,
                    "competition_score": 55,
                    "visual_strength": 91,
                    "impulse_buy": 84,
                    "reason": "Produto visual, prático e forte para demonstração na cozinha.",
                },
                {
                    "product": "organizador multiuso",
                    "marketplace": "mercado_livre",
                    "average_price": 59.90,
                    "commission_percent": 9,
                    "demand_score": 74,
                    "competition_score": 45,
                    "visual_strength": 82,
                    "impulse_buy": 78,
                    "reason": "Bom para vídeos de organização e transformação de ambiente.",
                },
            ],
            "pet": [
                {
                    "product": "escova removedora de pelos pet",
                    "marketplace": "shopee",
                    "average_price": 49.90,
                    "commission_percent": 10,
                    "demand_score": 80,
                    "competition_score": 44,
                    "visual_strength": 85,
                    "impulse_buy": 82,
                    "reason": "Produto com demonstração visual forte e dor clara para donos de pets.",
                }
            ],
        }

        fallback = [
            {
                "product": f"produto tendência de {niche}",
                "marketplace": "generic",
                "average_price": 79.90,
                "commission_percent": 10,
                "demand_score": 72,
                "competition_score": 50,
                "visual_strength": 70,
                "impulse_buy": 74,
                "reason": "Produto gerado para validação inicial do nicho.",
            }
        ]

        candidates = catalogs.get(niche, fallback)

        for candidate in candidates:
            candidate["score"] = self._calculate_score(candidate)

        return candidates

    def _select_best_candidate(self, candidates: list[dict]) -> dict:
        return sorted(candidates, key=lambda item: item["score"], reverse=True)[0]

    def _calculate_score(self, candidate: dict) -> int:
        score = int(
            (candidate["demand_score"] * 0.34)
            + ((100 - candidate["competition_score"]) * 0.20)
            + (candidate["visual_strength"] * 0.22)
            + (candidate["impulse_buy"] * 0.16)
            + (candidate["commission_percent"] * 0.8)
        )

        return max(0, min(100, score))

    def _decision(self, score: int) -> str:
        if score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if score >= 70:
            return "BOA OPORTUNIDADE"

        if score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "VALIDAR MELHOR"

    def _risk_level(self, competition_score: int) -> str:
        if competition_score >= 70:
            return "alto"

        if competition_score >= 45:
            return "médio"

        return "baixo"

    def _build_strategy(
        self,
        product: str,
        niche: str,
        target_audience: str,
        main_channel: str,
        campaign_style: str,
    ) -> str:
        return (
            f"Posicionar {product} como uma solução prática para {target_audience}. "
            f"No canal {main_channel}, usar campanha em estilo {campaign_style}, com foco em dor clara, "
            f"demonstração visual e promessa simples. A abordagem ideal é mostrar o problema do público, "
            f"apresentar o {product} como atalho e finalizar com CTA direto para conferir a oferta."
        )

    def _build_headline(self, product: str, campaign_style: str) -> str:
        if campaign_style == "premium":
            return f"{product}: a solução prática para quem busca mais qualidade"

        if campaign_style == "emocional":
            return f"Você merece uma rotina mais simples com {product}"

        if campaign_style == "agressivo":
            return f"Pare de perder tempo: conheça o {product}"

        return f"Conheça o {product}"

    def _build_short_copy(
        self,
        product: str,
        niche: str,
        target_audience: str,
    ) -> str:
        return (
            f"Se você está no nicho de {niche} e quer mais praticidade, o {product} pode ser uma ótima opção. "
            f"Ele conversa diretamente com {target_audience} e pode ser vendido com conteúdo simples, visual e direto."
        )

    def _build_video_script(
        self,
        product: str,
        niche: str,
        main_channel: str,
    ) -> str:
        return (
            f"CENA 1: Abra com uma dor forte do nicho de {niche}. Texto na tela: 'Você ainda passa por isso?'. "
            f"CENA 2: Mostre o problema de forma visual e rápida. "
            f"CENA 3: Apresente o {product} como solução. "
            f"CENA 4: Mostre 3 benefícios em cortes rápidos. "
            f"CENA 5: Finalize com CTA: 'Clique no link e confira a oferta'. "
            f"Formato recomendado: vídeo vertical para {main_channel}, com duração entre 20 e 35 segundos."
        )

    def _build_image_brief(
        self,
        product: str,
        niche: str,
        target_audience: str,
        campaign_style: str,
    ) -> str:
        return (
            f"Imagem publicitária vertical 9:16 para afiliado. Produto principal em destaque: {product}. "
            f"Nicho: {niche}. Público-alvo: {target_audience}. Estilo visual: {campaign_style}. "
            f"Usar fundo moderno, alto contraste, iluminação profissional, texto curto de impacto, "
            f"selo de oportunidade/oferta e botão visual de chamada para ação."
        )

    def _build_voiceover(
        self,
        product: str,
        niche: str,
        target_audience: str,
    ) -> str:
        return (
            f"Você sabia que muita gente no nicho de {niche} ainda perde tempo tentando resolver isso do jeito difícil? "
            f"O {product} pode facilitar a rotina de {target_audience}, trazendo mais praticidade e uma solução simples "
            f"para o dia a dia. Confira a oferta e veja se faz sentido para você."
        )

    def _hashtags(self, niche: str, product: str) -> list[str]:
        clean_niche = niche.replace(" ", "")
        clean_product = product.replace(" ", "")

        return [
            "#afiliados",
            "#marketingdigital",
            "#achadinhos",
            "#oferta",
            f"#{clean_niche}",
            f"#{clean_product}",
        ]