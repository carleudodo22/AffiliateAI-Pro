from sqlalchemy.orm import Session

from app.models.product_analysis import ProductAnalysis
from app.schemas.product_hunter import (
    ProductHunterRequest,
    ProductHunterResponse,
    ProductHunterStrategy,
    ProductScoreBreakdown,
)


class ProductHunterService:
    def analyze_product(
        self,
        data: ProductHunterRequest,
        db: Session | None = None,
    ) -> ProductHunterResponse:
        niche = self._clean_text(data.niche)
        product_name = self._clean_text(data.product_name or f"produto de {niche}")

        demand_score = self._calculate_demand_score(
            niche=niche,
            trend_signal=data.trend_signal,
            marketplace=data.marketplace,
        )

        virality_score = self._calculate_virality_score(
            niche=niche,
            channel=data.main_channel,
            trend_signal=data.trend_signal,
        )

        profit_score = self._calculate_profit_score(
            average_price=data.average_price,
            commission_percent=data.commission_percent,
        )

        competition_score = self._calculate_competition_score(
            estimated_competition=data.estimated_competition,
        )

        saturation_risk = self._calculate_saturation_risk(
            trend_signal=data.trend_signal,
            estimated_competition=data.estimated_competition,
        )

        final_score = self._calculate_final_score(
            demand_score=demand_score,
            virality_score=virality_score,
            profit_score=profit_score,
            competition_score=competition_score,
            saturation_risk=saturation_risk,
        )

        decision = self._build_decision(final_score)

        strategy = self._build_strategy(
            niche=niche,
            product_name=product_name,
            target_audience=data.target_audience,
            main_channel=data.main_channel,
            final_score=final_score,
            saturation_risk=saturation_risk,
            average_price=data.average_price,
            commission_percent=data.commission_percent,
        )

        response = ProductHunterResponse(
            agent="Product Hunter",
            niche=niche,
            product_name=product_name,
            marketplace=data.marketplace,
            decision=decision,
            score=ProductScoreBreakdown(
                demand_score=demand_score,
                virality_score=virality_score,
                profit_score=profit_score,
                competition_score=competition_score,
                saturation_risk=saturation_risk,
                final_score=final_score,
            ),
            strategy=strategy,
        )

        if db is not None:
            saved_analysis = ProductAnalysis(
                niche=niche,
                product_name=product_name,
                marketplace=data.marketplace,
                main_channel=data.main_channel,
                target_audience=data.target_audience,
                average_price=data.average_price,
                commission_percent=data.commission_percent,
                estimated_competition=data.estimated_competition,
                trend_signal=data.trend_signal,
                decision=decision,
                final_score=final_score,
                result_data=response.model_dump(),
            )

            db.add(saved_analysis)
            db.commit()
            db.refresh(saved_analysis)

            response.id = saved_analysis.id

        return response

    def _clean_text(self, value: str) -> str:
        return value.strip().lower()

    def _calculate_demand_score(
        self,
        niche: str,
        trend_signal: int,
        marketplace: str,
    ) -> int:
        high_demand_niches = {
            "beleza",
            "fitness",
            "emagrecimento",
            "moda",
            "casa",
            "pets",
            "automotivo",
            "tecnologia",
            "maternidade",
            "games",
        }

        score = trend_signal

        if niche in high_demand_niches:
            score += 15

        if marketplace in ["shopee", "mercado_livre", "amazon"]:
            score += 8

        if marketplace in ["hotmart", "kiwify", "monetizze"]:
            score += 5

        return self._limit_score(score)

    def _calculate_virality_score(
        self,
        niche: str,
        channel: str,
        trend_signal: int,
    ) -> int:
        visual_niches = {
            "beleza",
            "fitness",
            "moda",
            "casa",
            "pets",
            "automotivo",
            "games",
            "tecnologia",
        }

        score = int(trend_signal * 0.7)

        if niche in visual_niches:
            score += 18

        if channel in ["tiktok", "instagram", "youtube_shorts"]:
            score += 12

        if channel in ["google", "facebook_ads"]:
            score += 5

        return self._limit_score(score)

    def _calculate_profit_score(
        self,
        average_price: float,
        commission_percent: float,
    ) -> int:
        estimated_commission = average_price * (commission_percent / 100)

        if estimated_commission >= 80:
            score = 95
        elif estimated_commission >= 40:
            score = 85
        elif estimated_commission >= 20:
            score = 72
        elif estimated_commission >= 10:
            score = 58
        else:
            score = 42

        if average_price > 300:
            score -= 8

        if average_price < 30:
            score -= 6

        return self._limit_score(score)

    def _calculate_competition_score(self, estimated_competition: int) -> int:
        return self._limit_score(100 - estimated_competition)

    def _calculate_saturation_risk(
        self,
        trend_signal: int,
        estimated_competition: int,
    ) -> int:
        risk = int((trend_signal * 0.35) + (estimated_competition * 0.65))
        return self._limit_score(risk)

    def _calculate_final_score(
        self,
        demand_score: int,
        virality_score: int,
        profit_score: int,
        competition_score: int,
        saturation_risk: int,
    ) -> int:
        score = (
            demand_score * 0.28
            + virality_score * 0.24
            + profit_score * 0.24
            + competition_score * 0.16
            - saturation_risk * 0.08
        )

        return self._limit_score(int(score))

    def _build_decision(self, final_score: int) -> str:
        if final_score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if final_score >= 70:
            return "BOA OPORTUNIDADE"

        if final_score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "EVITAR OU VALIDAR MELHOR"

    def _build_strategy(
        self,
        niche: str,
        product_name: str,
        target_audience: str | None,
        main_channel: str,
        final_score: int,
        saturation_risk: int,
        average_price: float,
        commission_percent: float,
    ) -> ProductHunterStrategy:
        audience = target_audience or f"pessoas interessadas em {niche}"
        estimated_commission = average_price * (commission_percent / 100)

        warnings: list[str] = []

        if saturation_risk >= 75:
            warnings.append(
                "Risco alto de saturação. O produto precisa de diferenciação forte."
            )

        if estimated_commission < 10:
            warnings.append(
                "Comissão estimada baixa. Será necessário vender em volume."
            )

        if final_score < 55:
            warnings.append(
                "Produto exige validação antes de investir tempo ou tráfego pago."
            )

        if not warnings:
            warnings.append(
                "Oportunidade saudável. Ainda assim, valide com conteúdo orgânico antes de escalar."
            )

        return ProductHunterStrategy(
            positioning=(
                f"Posicionar '{product_name}' como uma solução prática para {audience}."
            ),
            sales_angle=(
                "Explorar dor clara, transformação visual, prova prática e urgência de uso."
            ),
            content_ideas=[
                f"Vídeo curto mostrando o problema antes de usar {product_name}.",
                f"Demonstração rápida do benefício principal de {product_name}.",
                f"Comparativo: jeito comum vs jeito inteligente usando {product_name}.",
                f"Conteúdo com pergunta forte: 'Você ainda sofre com isso em {niche}?'",
                f"Review honesto mostrando pontos positivos e limitações do produto.",
            ],
            offer_structure=(
                "Criar oferta com promessa clara, benefício direto, prova visual, "
                "chamada para ação e link de compra com senso de oportunidade."
            ),
            recommended_channels=self._recommended_channels(main_channel),
            warnings=warnings,
        )

    def _recommended_channels(self, main_channel: str) -> list[str]:
        channels = {
            main_channel,
            "tiktok",
            "instagram",
            "youtube_shorts",
            "whatsapp",
        }

        return list(channels)

    def _limit_score(self, score: int) -> int:
        return max(0, min(100, score))