from sqlalchemy.orm import Session

from app.models.content_generation import ContentGeneration
from app.models.user import User
from app.schemas.content_generator import (
    ContentGeneratorRequest,
    ContentGeneratorResponse,
)
from app.services.ai_engine import ai_engine


class ContentGeneratorService:
    def generate_content(
        self,
        data: ContentGeneratorRequest,
        db: Session,
        current_user: User,
    ) -> ContentGeneratorResponse:
        fallback_package = self._build_fallback_package(data)

        ai_result = ai_engine.generate_json(
            system_prompt=(
                "Você é o Content Generator Agent do AffiliateAI Pro. "
                "Sua função é criar conteúdo de afiliados com copy, legenda, "
                "roteiro, CTA, WhatsApp, hashtags e variações de anúncio."
            ),
            user_prompt=(
                f"Produto: {data.product_name}\n"
                f"Nicho: {data.niche}\n"
                f"Público-alvo: {data.target_audience or 'não informado'}\n"
                f"Plataforma: {data.platform}\n"
                f"Tom: {data.tone}\n"
                f"Objetivo: {data.objective}"
            ),
            fallback_data=fallback_package,
        )

        content_package = ai_result.get("data", fallback_package)

        content_package["ai_engine"] = {
            "provider": ai_result.get("provider", "mock"),
            "model": ai_result.get("model", "affiliateai-local-mock"),
            "mode": ai_result.get("mode", "safe_mock"),
        }

        content_generation = ContentGeneration(
            user_id=current_user.id,
            product_name=data.product_name.strip(),
            niche=data.niche.strip().lower(),
            target_audience=data.target_audience,
            platform=data.platform,
            tone=data.tone,
            objective=data.objective,
            headline=content_package["headline"],
            short_copy=content_package["short_copy"],
            caption=content_package["caption"],
            video_script=content_package["video_script"],
            whatsapp_text=content_package["whatsapp_text"],
            cta=content_package["cta"],
            hashtags=content_package["hashtags"],
            ad_variations=content_package["ad_variations"],
            content_package=content_package,
            status="completed",
        )

        db.add(content_generation)
        db.commit()
        db.refresh(content_generation)

        return self.get_content_response(content_generation)

    def get_content_response(
        self,
        content_generation: ContentGeneration,
    ) -> ContentGeneratorResponse:
        return ContentGeneratorResponse(
            id=content_generation.id,
            agent="Content Generator Agent",
            status=content_generation.status,
            product_name=content_generation.product_name,
            niche=content_generation.niche,
            target_audience=content_generation.target_audience,
            platform=content_generation.platform,
            tone=content_generation.tone,
            objective=content_generation.objective,
            headline=content_generation.headline,
            short_copy=content_generation.short_copy,
            caption=content_generation.caption,
            video_script=content_generation.video_script,
            whatsapp_text=content_generation.whatsapp_text,
            cta=content_generation.cta,
            hashtags=content_generation.hashtags,
            ad_variations=content_generation.ad_variations,
            content_package=content_generation.content_package,
            created_at=content_generation.created_at,
        )

    def _build_fallback_package(
        self,
        data: ContentGeneratorRequest,
    ) -> dict:
        product_name = data.product_name.strip()
        niche = data.niche.strip().lower()
        target_audience = (
            data.target_audience
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        platform_label = self._format_platform(data.platform)
        tone_label = self._format_tone(data.tone)
        objective_label = self._format_objective(data.objective)

        headline = self._build_headline(
            product_name=product_name,
            niche=niche,
            tone=data.tone,
        )

        short_copy = (
            f"Se você está no nicho de {niche} e quer uma solução prática, "
            f"o {product_name} pode ser uma ótima opção. Ele chama atenção, "
            f"resolve uma dor clara e pode funcionar muito bem em campanhas "
            f"com tom {tone_label} para {objective_label}."
        )

        caption = (
            f"Esse é o tipo de produto que prende atenção rápido: {product_name}. "
            f"Ideal para {target_audience}. Use uma demonstração simples, mostre "
            f"o benefício principal e finalize com uma chamada direta para ação."
        )

        video_script = (
            f"CENA 1 - Dor: Mostre uma situação comum do público no nicho de {niche}.\n"
            f"CENA 2 - Produto: Apresente o {product_name} como solução prática.\n"
            f"CENA 3 - Demonstração: Mostre o produto sendo usado de forma simples.\n"
            f"CENA 4 - Benefício: Destaque economia de tempo, praticidade ou resultado.\n"
            f"CENA 5 - CTA: Convide a pessoa para clicar no link e conferir a oferta."
        )

        whatsapp_text = (
            f"Olha esse produto que encontrei: {product_name}.\n\n"
            f"Ele pode ajudar bastante quem procura uma solução prática no nicho de {niche}. "
            f"Dá uma olhada na oferta e vê se faz sentido pra você."
        )

        cta = self._build_cta(data.objective)

        hashtags = [
            "#afiliados",
            "#marketingdigital",
            "#achadinhos",
            "#oferta",
            f"#{niche.replace(' ', '')}",
            f"#{product_name.lower().replace(' ', '')}",
            f"#{platform_label.lower().replace(' ', '')}",
        ]

        ad_variations = [
            (
                f"Variação 1: {product_name} para quem quer praticidade "
                f"no nicho de {niche}."
            ),
            (
                f"Variação 2: Veja por que esse produto está chamando atenção: "
                f"{product_name}."
            ),
            (
                f"Variação 3: Uma solução simples, visual e direta para "
                f"{target_audience}."
            ),
        ]

        return {
            "headline": headline,
            "short_copy": short_copy,
            "caption": caption,
            "video_script": video_script,
            "whatsapp_text": whatsapp_text,
            "cta": cta,
            "hashtags": hashtags,
            "ad_variations": ad_variations,
            "strategy": {
                "platform": platform_label,
                "tone": tone_label,
                "objective": objective_label,
                "angle": (
                    f"Use uma abordagem {tone_label}, com demonstração rápida, "
                    f"benefício claro e CTA direto."
                ),
            },
        }

    def _build_headline(
        self,
        product_name: str,
        niche: str,
        tone: str,
    ) -> str:
        if tone == "premium":
            return f"{product_name}: uma solução premium para quem valoriza resultado"

        if tone == "emocional":
            return f"O detalhe que pode transformar sua rotina no nicho de {niche}"

        if tone == "agressivo":
            return f"Pare de perder tempo: conheça o {product_name}"

        if tone == "direto":
            return f"{product_name}: prático, útil e pronto para resolver sua necessidade"

        if tone == "popular":
            return f"O achadinho que está chamando atenção: {product_name}"

        return f"Esse {product_name} pode viralizar no nicho de {niche}"

    def _build_cta(
        self,
        objective: str,
    ) -> str:
        if objective == "capturar_lead":
            return "Cadastre-se agora e receba a indicação completa."

        if objective == "aquecer_audiencia":
            return "Salve esse conteúdo e acompanhe as próximas dicas."

        if objective == "validar_produto":
            return "Veja a oferta e descubra se esse produto faz sentido para você."

        return "Clique no link e confira a oferta agora."

    def _format_platform(
        self,
        platform: str,
    ) -> str:
        labels = {
            "tiktok": "TikTok",
            "instagram": "Instagram",
            "youtube_shorts": "YouTube Shorts",
            "whatsapp": "WhatsApp",
            "facebook_ads": "Facebook Ads",
            "google": "Google",
        }

        return labels.get(platform, platform)

    def _format_tone(
        self,
        tone: str,
    ) -> str:
        labels = {
            "viral": "viral",
            "direto": "direto",
            "premium": "premium",
            "emocional": "emocional",
            "agressivo": "agressivo",
            "popular": "popular",
        }

        return labels.get(tone, tone)

    def _format_objective(
        self,
        objective: str,
    ) -> str:
        labels = {
            "vender": "venda",
            "capturar_lead": "captura de lead",
            "aquecer_audiencia": "aquecimento de audiência",
            "validar_produto": "validação de produto",
        }

        return labels.get(objective, objective)