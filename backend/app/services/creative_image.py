from sqlalchemy.orm import Session

from app.models.creative_image import CreativeImageGeneration
from app.models.user import User
from app.schemas.creative_image import (
    CreativeImageRequest,
    CreativeImageResponse,
)
from app.services.ai_engine import ai_engine


class CreativeImageService:
    def generate_creative(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
        fallback_package = self._build_fallback_package(data)

        ai_result = ai_engine.generate_json(
            system_prompt=(
                "Você é o Creative Image Agent do AffiliateAI Pro. "
                "Sua função é criar direção visual para artes de afiliados, "
                "incluindo título, subtítulo, CTA, prompt de imagem, negative prompt, "
                "layout, fundo, tipografia, paleta e checklist."
            ),
            user_prompt=(
                f"Produto: {data.product_name}\n"
                f"Nicho: {data.niche}\n"
                f"Público-alvo: {data.target_audience or 'não informado'}\n"
                f"Plataforma: {data.platform}\n"
                f"Estilo visual: {data.creative_style}\n"
                f"Objetivo: {data.objective}"
            ),
            fallback_data=fallback_package,
        )

        creative_package = ai_result.get("data", fallback_package)

        creative_package["ai_engine"] = {
            "provider": ai_result.get("provider", "mock"),
            "model": ai_result.get("model", "affiliateai-local-mock"),
            "mode": ai_result.get("mode", "safe_mock"),
        }

        creative_generation = CreativeImageGeneration(
            user_id=current_user.id,
            product_name=data.product_name.strip(),
            niche=data.niche.strip().lower(),
            target_audience=data.target_audience,
            platform=data.platform,
            creative_style=data.creative_style,
            objective=data.objective,
            art_headline=creative_package["art_headline"],
            art_subtitle=creative_package["art_subtitle"],
            cta=creative_package["cta"],
            visual_brief=creative_package["visual_brief"],
            image_prompt=creative_package["image_prompt"],
            negative_prompt=creative_package["negative_prompt"],
            layout_direction=creative_package["layout_direction"],
            background_style=creative_package["background_style"],
            typography_direction=creative_package["typography_direction"],
            color_palette=creative_package["color_palette"],
            checklist=creative_package["checklist"],
            creative_package=creative_package,
            status="completed",
        )

        db.add(creative_generation)
        db.commit()
        db.refresh(creative_generation)

        return self.get_creative_response(creative_generation)

    def get_creative_response(
        self,
        creative_generation: CreativeImageGeneration,
    ) -> CreativeImageResponse:
        return CreativeImageResponse(
            id=creative_generation.id,
            agent="Creative Image Agent",
            status=creative_generation.status,
            product_name=creative_generation.product_name,
            niche=creative_generation.niche,
            target_audience=creative_generation.target_audience,
            platform=creative_generation.platform,
            creative_style=creative_generation.creative_style,
            objective=creative_generation.objective,
            art_headline=creative_generation.art_headline,
            art_subtitle=creative_generation.art_subtitle,
            cta=creative_generation.cta,
            visual_brief=creative_generation.visual_brief,
            image_prompt=creative_generation.image_prompt,
            negative_prompt=creative_generation.negative_prompt,
            layout_direction=creative_generation.layout_direction,
            background_style=creative_generation.background_style,
            typography_direction=creative_generation.typography_direction,
            color_palette=creative_generation.color_palette,
            checklist=creative_generation.checklist,
            creative_package=creative_generation.creative_package,
            created_at=creative_generation.created_at,
        )

    def _build_fallback_package(
        self,
        data: CreativeImageRequest,
    ) -> dict:
        product_name = data.product_name.strip()
        niche = data.niche.strip().lower()
        target_audience = (
            data.target_audience
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        platform_label = self._format_platform(data.platform)
        style_label = self._format_style(data.creative_style)
        objective_label = self._format_objective(data.objective)

        art_headline = self._build_headline(
            product_name=product_name,
            niche=niche,
            style=data.creative_style,
        )

        art_subtitle = (
            f"Uma solução prática para {target_audience}, com foco em "
            f"{objective_label} e visual pensado para {platform_label}."
        )

        cta = self._build_cta(data.objective)

        visual_brief = (
            f"Arte vertical 9:16 para promover {product_name} no nicho de {niche}. "
            f"O produto deve aparecer grande, nítido e centralizado. A composição "
            f"precisa ter visual {style_label}, contraste forte, leitura rápida, "
            f"título chamativo, subtítulo curto e CTA visível. Ideal para campanha "
            f"em {platform_label}."
        )

        image_prompt = (
            f"Crie uma arte publicitária vertical 9:16 para vender {product_name}, "
            f"produto do nicho de {niche}, direcionado para {target_audience}. "
            f"Estilo visual {style_label}, aparência moderna, profissional e de alta conversão. "
            f"Produto em destaque no centro, iluminação premium, fundo com profundidade, "
            f"contraste forte, espaço para título grande no topo, subtítulo curto no meio "
            f"e botão de CTA na parte inferior. Visual limpo, impactante, pronto para redes sociais."
        )

        negative_prompt = (
            "baixa qualidade, texto ilegível, letras deformadas, layout poluído, "
            "produto cortado, excesso de elementos, imagem borrada, proporção errada, "
            "mãos deformadas, objetos duplicados, marca falsa, logo inventada"
        )

        layout_direction = (
            "Use estrutura vertical 9:16. Título grande no topo, produto como elemento "
            "principal no centro, benefício curto próximo ao produto e CTA forte no rodapé. "
            "Evite excesso de texto e mantenha hierarquia visual clara."
        )

        background_style = self._build_background_style(data.creative_style)

        typography_direction = (
            "Tipografia grande, pesada e legível em tela pequena. Use no máximo dois pesos "
            "de fonte. Título com alto contraste, subtítulo mais discreto e CTA com aparência "
            "de botão clicável."
        )

        color_palette = self._build_color_palette(data.creative_style)

        checklist = [
            "Produto grande e fácil de reconhecer",
            "Título legível em celular",
            "CTA visível no primeiro olhar",
            "Formato vertical 9:16",
            "Pouco texto e alta clareza visual",
            "Contraste forte entre fundo, produto e texto",
            "Visual compatível com campanha de afiliados",
        ]

        return {
            "art_headline": art_headline,
            "art_subtitle": art_subtitle,
            "cta": cta,
            "visual_brief": visual_brief,
            "image_prompt": image_prompt,
            "negative_prompt": negative_prompt,
            "layout_direction": layout_direction,
            "background_style": background_style,
            "typography_direction": typography_direction,
            "color_palette": color_palette,
            "checklist": checklist,
            "strategy": {
                "platform": platform_label,
                "style": style_label,
                "objective": objective_label,
                "angle": (
                    f"Criar uma arte {style_label}, com foco em benefício rápido, "
                    f"demonstração visual e CTA direto para {objective_label}."
                ),
            },
        }

    def _build_headline(
        self,
        product_name: str,
        niche: str,
        style: str,
    ) -> str:
        if style == "premium":
            return f"{product_name}: visual premium para uma rotina melhor"

        if style == "emocional":
            return f"O detalhe que pode facilitar sua vida no nicho de {niche}"

        if style == "agressivo":
            return f"Pare de perder tempo: conheça o {product_name}"

        if style == "direto":
            return f"{product_name}: simples, prático e eficiente"

        if style == "popular":
            return f"O achadinho que todo mundo está procurando"

        if style == "minimalista":
            return f"{product_name} para quem busca praticidade"

        return f"Esse {product_name} pode chamar muita atenção"

    def _build_cta(
        self,
        objective: str,
    ) -> str:
        if objective == "capturar_lead":
            return "Receba a indicação agora"

        if objective == "aquecer_audiencia":
            return "Salve para ver depois"

        if objective == "validar_produto":
            return "Veja se combina com você"

        return "Confira a oferta agora"

    def _build_background_style(
        self,
        style: str,
    ) -> str:
        if style == "premium":
            return (
                "Fundo escuro sofisticado, com iluminação suave, reflexos discretos "
                "e aparência de produto premium."
            )

        if style == "emocional":
            return (
                "Fundo acolhedor, com iluminação quente, sensação humana e atmosfera "
                "de transformação pessoal."
            )

        if style == "agressivo":
            return (
                "Fundo escuro com contraste alto, textura energética, impacto visual "
                "e sensação de urgência."
            )

        if style == "minimalista":
            return (
                "Fundo limpo, poucos elementos, bastante espaço negativo e foco total "
                "no produto."
            )

        if style == "popular":
            return (
                "Fundo colorido, chamativo, com aparência de achadinho/oferta e energia "
                "de rede social."
            )

        return (
            "Fundo moderno com contraste, profundidade, brilho controlado e aparência "
            "viral para redes sociais."
        )

    def _build_color_palette(
        self,
        style: str,
    ) -> list[str]:
        if style == "premium":
            return ["preto", "dourado", "branco", "cinza grafite"]

        if style == "emocional":
            return ["bege", "branco quente", "marrom claro", "verde suave"]

        if style == "agressivo":
            return ["preto", "vermelho", "branco", "cinza escuro"]

        if style == "minimalista":
            return ["branco", "preto", "cinza claro", "verde suave"]

        if style == "popular":
            return ["amarelo", "vermelho", "branco", "azul"]

        return ["verde neon", "preto", "branco", "cinza escuro"]

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
            "pinterest": "Pinterest",
        }

        return labels.get(platform, platform)

    def _format_style(
        self,
        style: str,
    ) -> str:
        labels = {
            "viral": "viral",
            "direto": "direto",
            "premium": "premium",
            "popular": "popular",
            "emocional": "emocional",
            "agressivo": "agressivo",
            "minimalista": "minimalista",
        }

        return labels.get(style, style)

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