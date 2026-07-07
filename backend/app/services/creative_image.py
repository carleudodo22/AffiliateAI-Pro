from sqlalchemy.orm import Session

from app.models.creative_image import CreativeImageGeneration
from app.models.user import User
from app.schemas.creative_image import CreativeImageRequest, CreativeImageResponse


class CreativeImageService:
    def generate_creative(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
        product_name = data.product_name.strip()
        niche = data.niche.strip().lower()
        target_audience = (
            data.target_audience
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        art_headline = self._build_art_headline(
            product_name=product_name,
            creative_style=data.creative_style,
        )

        art_subtitle = self._build_art_subtitle(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
        )

        cta = self._build_cta(data.objective)

        visual_brief = self._build_visual_brief(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            platform=data.platform,
            creative_style=data.creative_style,
        )

        image_prompt = self._build_image_prompt(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            platform=data.platform,
            creative_style=data.creative_style,
            art_headline=art_headline,
            art_subtitle=art_subtitle,
            cta=cta,
        )

        negative_prompt = (
            "texto ilegível, baixa qualidade, imagem borrada, arte poluída, "
            "logo falsa, marca inventada, excesso de elementos, deformações, "
            "mãos deformadas, produto distorcido, aparência amadora"
        )

        layout_direction = self._build_layout_direction(data.platform)
        background_style = self._build_background_style(data.creative_style)
        typography_direction = self._build_typography_direction(data.creative_style)
        color_palette = self._build_color_palette(data.creative_style)

        checklist = [
            "Conferir se o produto está visualmente claro.",
            "Usar formato vertical 9:16.",
            "Manter título grande e legível.",
            "Colocar CTA em área de destaque.",
            "Evitar excesso de texto na arte.",
            "Testar variação com fundo mais limpo.",
            "Publicar com copy curta e link de afiliado.",
        ]

        creative_package = {
            "summary": {
                "product_name": product_name,
                "niche": niche,
                "target_audience": target_audience,
                "platform": data.platform,
                "creative_style": data.creative_style,
                "objective": data.objective,
            },
            "art_texts": {
                "headline": art_headline,
                "subtitle": art_subtitle,
                "cta": cta,
            },
            "visual_direction": {
                "visual_brief": visual_brief,
                "image_prompt": image_prompt,
                "negative_prompt": negative_prompt,
                "layout_direction": layout_direction,
                "background_style": background_style,
                "typography_direction": typography_direction,
                "color_palette": color_palette,
            },
            "publishing_notes": {
                "recommended_format": "Vertical 9:16, ideal para Reels, TikTok e Shorts.",
                "safe_area": "Manter título e CTA longe das bordas.",
                "creative_angle": (
                    "Usar produto em destaque, benefício claro, contraste forte "
                    "e CTA simples."
                ),
            },
            "checklist": checklist,
        }

        saved_creative = CreativeImageGeneration(
            user_id=current_user.id,
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            platform=data.platform,
            creative_style=data.creative_style,
            objective=data.objective,
            art_headline=art_headline,
            art_subtitle=art_subtitle,
            cta=cta,
            visual_brief=visual_brief,
            image_prompt=image_prompt,
            negative_prompt=negative_prompt,
            layout_direction=layout_direction,
            background_style=background_style,
            typography_direction=typography_direction,
            color_palette=color_palette,
            checklist=checklist,
            creative_package=creative_package,
            status="completed",
        )

        db.add(saved_creative)
        db.commit()
        db.refresh(saved_creative)

        return self._to_response(saved_creative)

    def get_creative_response(
        self,
        creative: CreativeImageGeneration,
    ) -> CreativeImageResponse:
        return self._to_response(creative)

    def _to_response(
        self,
        creative: CreativeImageGeneration,
    ) -> CreativeImageResponse:
        return CreativeImageResponse(
            id=creative.id,
            agent="Creative Image Agent",
            status=creative.status,
            product_name=creative.product_name,
            niche=creative.niche,
            target_audience=creative.target_audience,
            platform=creative.platform,
            creative_style=creative.creative_style,
            objective=creative.objective,
            art_headline=creative.art_headline,
            art_subtitle=creative.art_subtitle,
            cta=creative.cta,
            visual_brief=creative.visual_brief,
            image_prompt=creative.image_prompt,
            negative_prompt=creative.negative_prompt,
            layout_direction=creative.layout_direction,
            background_style=creative.background_style,
            typography_direction=creative.typography_direction,
            color_palette=creative.color_palette,
            checklist=creative.checklist,
            creative_package=creative.creative_package,
            created_at=creative.created_at,
        )

    def _build_art_headline(self, product_name: str, creative_style: str) -> str:
        if creative_style == "premium":
            return f"{product_name} com mais praticidade"

        if creative_style == "emocional":
            return f"Facilite sua rotina com {product_name}"

        if creative_style == "agressivo":
            return f"Pare de perder tempo"

        if creative_style == "direto":
            return f"Conheça o {product_name}"

        if creative_style == "minimalista":
            return f"{product_name}"

        return f"Esse {product_name} está chamando atenção"

    def _build_art_subtitle(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
    ) -> str:
        return (
            f"Uma opção prática para {target_audience}, ideal para quem busca "
            f"soluções simples no nicho de {niche}."
        )

    def _build_cta(self, objective: str) -> str:
        if objective == "capturar_lead":
            return "Chame no direct"

        if objective == "aquecer_audiencia":
            return "Salve para ver depois"

        if objective == "validar_produto":
            return "Você usaria?"

        return "Confira a oferta"

    def _build_visual_brief(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        platform: str,
        creative_style: str,
    ) -> str:
        return (
            f"Criar uma arte vertical 9:16 para divulgar o produto {product_name} "
            f"no nicho de {niche}. Público-alvo: {target_audience}. "
            f"Estilo visual: {creative_style}. Plataforma principal: {platform}. "
            "O produto deve aparecer grande no centro, com título forte, subtítulo curto, "
            "CTA visível e composição moderna de alto impacto."
        )

    def _build_image_prompt(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        platform: str,
        creative_style: str,
        art_headline: str,
        art_subtitle: str,
        cta: str,
    ) -> str:
        return (
            "Crie uma arte publicitária vertical 9:16, estilo SaaS/marketing de afiliados, "
            f"para o produto '{product_name}', nicho '{niche}', público '{target_audience}'. "
            f"Estilo visual '{creative_style}', pensada para '{platform}'. "
            "Produto em destaque no centro, iluminação profissional, fundo moderno, "
            "contraste forte, composição limpa, aparência premium e comercial. "
            f"Texto principal grande: '{art_headline}'. "
            f"Subtítulo menor: '{art_subtitle}'. "
            f"Botão/CTA destacado: '{cta}'. "
            "Design profissional, alta legibilidade, elementos bem espaçados, "
            "sem poluição visual, pronto para Reels, TikTok e Shorts."
        )

    def _build_layout_direction(self, platform: str) -> str:
        if platform in ["tiktok", "instagram", "youtube_shorts"]:
            return (
                "Layout vertical 9:16. Cabeçalho com título grande, produto no centro, "
                "benefício curto abaixo e CTA no rodapé. Manter área segura para interface da plataforma."
            )

        if platform == "whatsapp":
            return (
                "Arte vertical simples, com produto grande, texto curto e CTA direto. "
                "Evitar excesso de informação para facilitar o envio em grupos e listas."
            )

        if platform == "facebook_ads":
            return (
                "Layout com benefício claro, produto em destaque e CTA forte. "
                "Visual mais limpo para anúncio pago."
            )

        return (
            "Layout limpo e direto, com título forte, produto central e CTA visível."
        )

    def _build_background_style(self, creative_style: str) -> str:
        if creative_style == "premium":
            return "Fundo escuro sofisticado, luz suave, reflexos discretos e aparência elegante."

        if creative_style == "popular":
            return "Fundo colorido, chamativo, com elementos de oferta e sensação de achadinho."

        if creative_style == "emocional":
            return "Fundo acolhedor, luz suave, sensação humana e próxima."

        if creative_style == "agressivo":
            return "Fundo de alto contraste, energia visual forte, destaque intenso no CTA."

        if creative_style == "minimalista":
            return "Fundo limpo, poucos elementos, bastante espaço negativo e produto bem destacado."

        return "Fundo moderno, dinâmico, com brilho, profundidade e aparência viral."

    def _build_typography_direction(self, creative_style: str) -> str:
        if creative_style == "premium":
            return "Fonte forte, elegante, com pouco texto e hierarquia visual clara."

        if creative_style == "agressivo":
            return "Fonte pesada, grande, com palavras de impacto e CTA muito visível."

        if creative_style == "minimalista":
            return "Tipografia simples, limpa, com poucas palavras e muito respiro."

        return "Tipografia grande, moderna, legível em tela pequena e com contraste forte."

    def _build_color_palette(self, creative_style: str) -> list[str]:
        if creative_style == "premium":
            return ["preto", "dourado", "branco", "cinza escuro"]

        if creative_style == "popular":
            return ["amarelo", "vermelho", "branco", "azul"]

        if creative_style == "emocional":
            return ["bege", "branco", "marrom claro", "rosa suave"]

        if creative_style == "agressivo":
            return ["preto", "vermelho", "branco", "amarelo"]

        if creative_style == "minimalista":
            return ["branco", "preto", "cinza claro", "verde suave"]

        return ["preto", "verde neon", "branco", "cinza escuro"]