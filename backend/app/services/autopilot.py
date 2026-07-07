from sqlalchemy.orm import Session

from app.models.autopilot_campaign import AutopilotCampaign
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
        audience = data.target_audience or f"pessoas interessadas em {niche}"

        product = self._select_product(niche=niche, marketplaces=data.preferred_marketplaces)

        score = self._calculate_score(
            trend_signal=product["trend_signal"],
            competition=product["estimated_competition"],
            commission=product["commission_percent"],
        )

        decision = self._decision(score)

        campaign_package = {
            "selected_product": product,
            "analysis": {
                "decision": decision,
                "score": {
                    "final_score": score,
                    "demand_score": min(100, product["trend_signal"] + 8),
                    "virality_score": min(100, product["trend_signal"] + 12),
                    "profit_score": min(100, int(product["commission_percent"] * 6)),
                    "competition_score": max(0, 100 - product["estimated_competition"]),
                    "saturation_risk": min(
                        100,
                        int((product["trend_signal"] * 0.35) + (product["estimated_competition"] * 0.65)),
                    ),
                },
                "strategy": {
                    "positioning": (
                        f"Posicionar {product['product_name']} como uma solução prática "
                        f"para {audience}."
                    ),
                    "sales_angle": (
                        "Usar demonstração visual, dor clara, transformação rápida e CTA direto."
                    ),
                    "content_ideas": [
                        f"Mostrar o problema antes de usar {product['product_name']}.",
                        f"Fazer demonstração rápida do {product['product_name']}.",
                        "Criar vídeo antes/depois com resultado visual.",
                        "Usar pergunta forte nos 3 primeiros segundos.",
                    ],
                    "warnings": [
                        "Confirmar disponibilidade real do produto antes de divulgar.",
                        "Confirmar comissão e regras da plataforma de afiliado.",
                    ],
                },
            },
            "content": {
                "headline": f"Conheça o {product['product_name']}",
                "product_description": (
                    f"O {product['product_name']} é uma solução prática para {audience}. "
                    f"Ele tem potencial para conteúdos curtos no nicho de {niche}."
                ),
                "short_sales_copy": (
                    f"Você ainda perde tempo com isso? O {product['product_name']} pode "
                    "facilitar sua rotina. Clique e confira a oferta."
                ),
                "video_hooks": [
                    f"Você precisa ver isso antes de comprar qualquer produto de {niche}.",
                    f"Testei o {product['product_name']} e olha o resultado.",
                    f"O erro que muita gente comete antes de escolher {product['product_name']}.",
                ],
                "video_scripts": [
                    (
                        f"CENA 1: Mostre o problema. "
                        f"CENA 2: Apresente o {product['product_name']}. "
                        f"CENA 3: Mostre o benefício. "
                        f"CENA 4: Chame para clicar no link."
                    )
                ],
                "instagram_caption": (
                    f"Se você busca praticidade em {niche}, conheça o {product['product_name']}. "
                    "Uma opção simples para resolver uma dor real do dia a dia."
                ),
                "tiktok_caption": (
                    f"Esse {product['product_name']} pode facilitar sua rotina 👀 "
                    "#achadinhos #afiliados #produto"
                ),
                "whatsapp_message": (
                    f"Olha esse produto que encontrei: {product['product_name']}. "
                    f"Ele é voltado para quem busca solução em {niche}. Dá uma olhada."
                ),
                "ad_copy": (
                    f"Conheça o {product['product_name']}. Uma solução prática para quem procura "
                    f"resultado no nicho de {niche}. Clique e confira."
                ),
                "ctas": [
                    "Clique no link e confira.",
                    "Veja a oferta disponível.",
                    "Garanta o seu enquanto está disponível.",
                ],
                "hashtags": [
                    "#afiliados",
                    "#marketingdigital",
                    "#achadinhos",
                    "#produto",
                    f"#{niche.replace(' ', '')}",
                    f"#{product['product_name'].replace(' ', '')}",
                ],
            },
            "creative": {
                "image_creative_direction": (
                    "Criativo vertical 9:16, fundo moderno, produto em destaque, "
                    "texto curto e chamada forte para ação."
                ),
                "image_generation_brief": (
                    f"Imagem publicitária vertical 9:16 para afiliado. Produto: {product['product_name']}. "
                    f"Nicho: {niche}. Público: {audience}. Estilo: {data.campaign_style}. "
                    "Visual profissional, alto contraste, foco no benefício, CTA forte."
                ),
                "video_creative_direction": (
                    f"Vídeo curto para {data.main_channel}, com abertura forte, "
                    "demonstração do problema, apresentação do produto e CTA final."
                ),
                "video_script": (
                    f"CENA 1: Mostre o problema do público em {niche}. "
                    "Texto na tela: 'Você ainda sofre com isso?'. "
                    f"CENA 2: Mostre o {product['product_name']} como solução. "
                    "CENA 3: Liste 3 benefícios rápidos. "
                    "CENA 4: Mostre o resultado. "
                    "CENA 5: CTA final: 'Clique no link e confira'."
                ),
                "voiceover_script": (
                    f"Você sabia que muita gente em {niche} ainda perde tempo com isso? "
                    f"O {product['product_name']} pode facilitar sua rotina e resolver uma dor simples "
                    "do dia a dia. Confira a oferta e veja se faz sentido para você."
                ),
                "sound_direction": (
                    "Trilha moderna, ritmo rápido, estilo Reels/TikTok, com cortes dinâmicos."
                ),
                "publishing_caption": (
                    f"{product['product_name']} para quem busca praticidade em {niche}. "
                    f"Score da oportunidade: {score}/100. Clique no link e confira."
                ),
                "checklist": [
                    "Confirmar se o produto está disponível.",
                    "Confirmar comissão na plataforma.",
                    "Gerar imagem final.",
                    "Gerar vídeo final.",
                    "Adicionar link de afiliado aprovado.",
                    "Postar no canal escolhido.",
                ],
            },
        }

        saved_campaign = AutopilotCampaign(
            user_id=current_user.id,
            niche=niche,
            objective=data.objective,
            main_channel=data.main_channel,
            budget_style=data.budget_style,
            campaign_style=data.campaign_style,
            target_audience=data.target_audience,
            campaign_data=campaign_package,
            status="completed",
        )

        db.add(saved_campaign)
        db.commit()
        db.refresh(saved_campaign)

        return AutopilotResponse(
            id=saved_campaign.id,
            agent="Affiliate Autopilot",
            status="completed",
            niche=niche,
            objective=data.objective,
            main_channel=data.main_channel,
            budget_style=data.budget_style,
            campaign_style=data.campaign_style,
            package=campaign_package,
        )

    def _select_product(self, niche: str, marketplaces: list[str]) -> dict:
        marketplace = marketplaces[0] if marketplaces else "generic"

        catalog = {
            "beleza": {
                "product_name": "escova secadora",
                "marketplace": marketplace,
                "average_price": 119.90,
                "commission_percent": 12,
                "estimated_competition": 58,
                "trend_signal": 84,
                "reason": "Produto visual, fácil de demonstrar e forte para vídeos curtos.",
            },
            "fitness": {
                "product_name": "mini elástico para treino",
                "marketplace": marketplace,
                "average_price": 39.90,
                "commission_percent": 12,
                "estimated_competition": 42,
                "trend_signal": 79,
                "reason": "Produto barato, visual e fácil de vender com treino em casa.",
            },
            "automotivo": {
                "product_name": "aspirador portátil automotivo",
                "marketplace": marketplace,
                "average_price": 99.90,
                "commission_percent": 11,
                "estimated_competition": 52,
                "trend_signal": 78,
                "reason": "Produto demonstrável, bom para antes/depois e vídeos curtos.",
            },
            "casa": {
                "product_name": "mini processador elétrico",
                "marketplace": marketplace,
                "average_price": 89.90,
                "commission_percent": 12,
                "estimated_competition": 55,
                "trend_signal": 83,
                "reason": "Produto visual, prático e forte para demonstração na cozinha.",
            },
        }

        return catalog.get(
            niche,
            {
                "product_name": f"produto tendência de {niche}",
                "marketplace": marketplace,
                "average_price": 79.90,
                "commission_percent": 12,
                "estimated_competition": 50,
                "trend_signal": 72,
                "reason": "Produto genérico criado para validação inicial do nicho.",
            },
        )

    def _calculate_score(self, trend_signal: int, competition: int, commission: float) -> int:
        score = int((trend_signal * 0.5) + ((100 - competition) * 0.3) + (commission * 2))
        return max(0, min(100, score))

    def _decision(self, score: int) -> str:
        if score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if score >= 70:
            return "BOA OPORTUNIDADE"

        if score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "VALIDAR MELHOR"