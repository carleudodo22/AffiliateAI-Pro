from sqlalchemy.orm import Session

from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.schemas.product_hunter import (
    ProductHunterRequest,
    ProductHunterResponse,
)
from app.services.ai_engine import ai_engine


class ProductHunterService:
    def analyze_product(
        self,
        data: ProductHunterRequest,
        db: Session,
        current_user: User,
    ) -> ProductHunterResponse:
        fallback_package = self._build_fallback_package(data)

        ai_result = ai_engine.generate_json(
            system_prompt=(
                "Você é o Product Hunter Agent do AffiliateAI Pro. "
                "Sua função é analisar produtos para afiliados, avaliando score, "
                "decisão, público-alvo, oportunidades, riscos, ângulos de conteúdo "
                "e canais recomendados."
            ),
            user_prompt=(
                f"Produto: {data.product_name}\n"
                f"Nicho: {data.niche}\n"
                f"Marketplace: {data.marketplace}\n"
                f"Preço médio: {data.average_price}\n"
                f"Comissão: {data.commission_percent}%\n"
                f"Público-alvo: {data.target_audience or 'não informado'}\n"
                f"URL do produto: {data.product_url or 'não informada'}"
            ),
            fallback_data=fallback_package,
        )

        analysis_package = ai_result.get("data", fallback_package)

        analysis_package["ai_engine"] = {
            "provider": ai_result.get("provider", "mock"),
            "model": ai_result.get("model", "affiliateai-local-mock"),
            "mode": ai_result.get("mode", "safe_mock"),
        }

        analysis = ProductAnalysis(
            user_id=current_user.id,
            product_name=data.product_name.strip(),
            niche=data.niche.strip().lower(),
            marketplace=data.marketplace,
            average_price=data.average_price,
            commission_percent=data.commission_percent,
            score=analysis_package["score"],
            decision=analysis_package["decision"],
            summary=analysis_package["summary"],
            strengths=analysis_package["strengths"],
            weaknesses=analysis_package["weaknesses"],
            opportunities=analysis_package["opportunities"],
            risks=analysis_package["risks"],
            target_audience=analysis_package["target_audience"],
            content_angles=analysis_package["content_angles"],
            recommended_channels=analysis_package["recommended_channels"],
            analysis_package=analysis_package,
            status="completed",
        )

        db.add(analysis)
        db.commit()
        db.refresh(analysis)

        return self.get_product_response(analysis)

    def get_product_response(
        self,
        analysis: ProductAnalysis,
    ) -> ProductHunterResponse:
        return ProductHunterResponse(
            id=analysis.id,
            agent="Product Hunter Agent",
            status=analysis.status,
            product_name=analysis.product_name,
            niche=analysis.niche,
            marketplace=analysis.marketplace,
            average_price=analysis.average_price,
            commission_percent=analysis.commission_percent,
            score=analysis.score,
            decision=analysis.decision,
            summary=analysis.summary,
            strengths=analysis.strengths,
            weaknesses=analysis.weaknesses,
            opportunities=analysis.opportunities,
            risks=analysis.risks,
            target_audience=analysis.target_audience,
            content_angles=analysis.content_angles,
            recommended_channels=analysis.recommended_channels,
            analysis_package=analysis.analysis_package,
            created_at=analysis.created_at,
        )

    def _build_fallback_package(
        self,
        data: ProductHunterRequest,
    ) -> dict:
        product_name = data.product_name.strip()
        niche = data.niche.strip().lower()
        marketplace = data.marketplace

        average_price = data.average_price or 0
        commission_percent = data.commission_percent or 0

        target_audience = (
            data.target_audience
            or f"pessoas interessadas em produtos do nicho de {niche}"
        )

        score_number = self._calculate_score(
            average_price=average_price,
            commission_percent=commission_percent,
            marketplace=marketplace,
        )

        score = f"{score_number}/100"
        decision = self._build_decision(score_number)
        summary = self._build_summary(
            product_name=product_name,
            niche=niche,
            marketplace=marketplace,
            average_price=average_price,
            commission_percent=commission_percent,
            score_number=score_number,
        )

        strengths = self._build_strengths(
            product_name=product_name,
            niche=niche,
            marketplace=marketplace,
            commission_percent=commission_percent,
        )

        weaknesses = self._build_weaknesses(
            average_price=average_price,
            commission_percent=commission_percent,
        )

        opportunities = self._build_opportunities(
            product_name=product_name,
            niche=niche,
            marketplace=marketplace,
        )

        risks = self._build_risks(
            marketplace=marketplace,
            average_price=average_price,
        )

        content_angles = [
            f"Demonstração prática do {product_name} em uso real",
            f"Antes e depois usando {product_name}",
            f"Por que esse produto chama atenção no nicho de {niche}",
            f"Review rápido: vale a pena comprar {product_name}?",
            f"Oferta ou achadinho: {product_name} no {self._format_marketplace(marketplace)}",
        ]

        recommended_channels = self._build_channels(marketplace)

        return {
            "score": score,
            "decision": decision,
            "summary": summary,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "risks": risks,
            "target_audience": target_audience,
            "content_angles": content_angles,
            "recommended_channels": recommended_channels,
            "strategy": {
                "main_angle": content_angles[0],
                "marketplace": self._format_marketplace(marketplace),
                "price_position": self._price_position(average_price),
                "commission_quality": self._commission_quality(commission_percent),
                "next_step": (
                    "Criar conteúdo curto com demonstração visual, CTA direto "
                    "e prova de benefício rápido."
                ),
            },
        }

    def _calculate_score(
        self,
        average_price: float,
        commission_percent: float,
        marketplace: str,
    ) -> int:
        score = 50

        if commission_percent >= 15:
            score += 20
        elif commission_percent >= 8:
            score += 12
        elif commission_percent >= 3:
            score += 6

        if 30 <= average_price <= 200:
            score += 15
        elif 200 < average_price <= 500:
            score += 8
        elif average_price > 500:
            score += 3

        if marketplace in ["shopee", "mercado_livre", "amazon"]:
            score += 8

        if marketplace in ["hotmart", "kiwify", "monetizze"]:
            score += 10

        return max(0, min(score, 100))

    def _build_decision(
        self,
        score_number: int,
    ) -> str:
        if score_number >= 80:
            return "Produto forte para campanha. Pode avançar para conteúdo e criativo."

        if score_number >= 65:
            return "Produto promissor. Vale testar com criativo simples e baixo risco."

        if score_number >= 50:
            return "Produto mediano. Testar apenas se tiver bom link, boa oferta ou bom visual."

        return "Produto fraco no momento. Melhor procurar outra oportunidade."

    def _build_summary(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
        average_price: float,
        commission_percent: float,
        score_number: int,
    ) -> str:
        return (
            f"O produto {product_name} foi analisado no nicho de {niche}, "
            f"com marketplace {self._format_marketplace(marketplace)}, preço médio "
            f"de R$ {average_price:.2f} e comissão estimada de {commission_percent:.1f}%. "
            f"O score calculado foi {score_number}/100. A recomendação depende da força "
            f"visual do produto, da oferta e da facilidade de criar conteúdo curto."
        )

    def _build_strengths(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
        commission_percent: float,
    ) -> list[str]:
        strengths = [
            f"Produto com potencial para conteúdo visual no nicho de {niche}.",
            f"Pode ser usado em vídeos curtos de demonstração e review.",
            f"Marketplace {self._format_marketplace(marketplace)} é fácil de entender pelo público.",
        ]

        if commission_percent >= 8:
            strengths.append("Comissão interessante para campanhas de afiliado.")

        if commission_percent >= 15:
            strengths.append("Comissão alta, podendo compensar testes pagos ou produção melhor.")

        return strengths

    def _build_weaknesses(
        self,
        average_price: float,
        commission_percent: float,
    ) -> list[str]:
        weaknesses = []

        if commission_percent < 5:
            weaknesses.append("Comissão baixa, pode exigir alto volume de vendas.")

        if average_price <= 0:
            weaknesses.append("Preço médio não informado, dificultando análise de conversão.")

        if average_price > 500:
            weaknesses.append("Preço alto, pode exigir mais prova, autoridade e confiança.")

        if not weaknesses:
            weaknesses.append("Ainda precisa validar demanda real e qualidade da oferta.")

        return weaknesses

    def _build_opportunities(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
    ) -> list[str]:
        return [
            f"Criar campanha de achadinho para {self._format_marketplace(marketplace)}.",
            f"Produzir vídeo curto mostrando o benefício principal do {product_name}.",
            f"Usar prova visual e comparação simples para atrair público de {niche}.",
            "Testar título direto com promessa clara e CTA para conferir oferta.",
        ]

    def _build_risks(
        self,
        marketplace: str,
        average_price: float,
    ) -> list[str]:
        risks = [
            "Concorrência com outros afiliados divulgando produtos parecidos.",
            "Produto pode ter baixa conversão se a oferta não parecer confiável.",
        ]

        if marketplace in ["shopee", "mercado_livre", "amazon"]:
            risks.append("Preço e disponibilidade podem mudar com frequência.")

        if average_price > 500:
            risks.append("Preço alto pode aumentar objeções antes da compra.")

        return risks

    def _build_channels(
        self,
        marketplace: str,
    ) -> list[str]:
        if marketplace in ["hotmart", "kiwify", "monetizze"]:
            return ["Instagram", "YouTube Shorts", "TikTok", "WhatsApp"]

        if marketplace in ["shopee", "mercado_livre", "amazon"]:
            return ["TikTok", "Instagram Reels", "YouTube Shorts", "Pinterest"]

        return ["TikTok", "Instagram", "WhatsApp"]

    def _format_marketplace(
        self,
        marketplace: str,
    ) -> str:
        labels = {
            "shopee": "Shopee",
            "mercado_livre": "Mercado Livre",
            "amazon": "Amazon",
            "hotmart": "Hotmart",
            "kiwify": "Kiwify",
            "monetizze": "Monetizze",
            "outro": "Outro",
        }

        return labels.get(marketplace, marketplace)

    def _price_position(
        self,
        average_price: float,
    ) -> str:
        if average_price <= 0:
            return "preço não informado"

        if average_price <= 50:
            return "baixo ticket"

        if average_price <= 200:
            return "ticket popular"

        if average_price <= 500:
            return "ticket médio"

        return "ticket alto"

    def _commission_quality(
        self,
        commission_percent: float,
    ) -> str:
        if commission_percent >= 15:
            return "comissão alta"

        if commission_percent >= 8:
            return "comissão boa"

        if commission_percent >= 3:
            return "comissão baixa/moderada"

        return "comissão baixa ou não informada"