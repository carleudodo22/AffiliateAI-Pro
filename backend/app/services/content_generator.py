from sqlalchemy.orm import Session

from app.models.content_generation import ContentGeneration
from app.models.user import User
from app.schemas.content_generator import (
    ContentGeneratorRequest,
    ContentGeneratorResponse,
)


class ContentGeneratorService:
    def generate_content(
        self,
        data: ContentGeneratorRequest,
        db: Session,
        current_user: User,
    ) -> ContentGeneratorResponse:
        product_name = data.product_name.strip()
        niche = data.niche.strip().lower()
        target_audience = (
            data.target_audience
            or f"pessoas interessadas em soluções práticas no nicho de {niche}"
        )

        headline = self._build_headline(
            product_name=product_name,
            tone=data.tone,
        )

        short_copy = self._build_short_copy(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            tone=data.tone,
        )

        caption = self._build_caption(
            product_name=product_name,
            niche=niche,
            platform=data.platform,
            objective=data.objective,
        )

        video_script = self._build_video_script(
            product_name=product_name,
            niche=niche,
            platform=data.platform,
        )

        whatsapp_text = self._build_whatsapp_text(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
        )

        cta = self._build_cta(objective=data.objective)

        hashtags = self._build_hashtags(
            product_name=product_name,
            niche=niche,
            platform=data.platform,
        )

        ad_variations = self._build_ad_variations(
            product_name=product_name,
            niche=niche,
            tone=data.tone,
        )

        content_package = {
            "summary": {
                "product_name": product_name,
                "niche": niche,
                "target_audience": target_audience,
                "platform": data.platform,
                "tone": data.tone,
                "objective": data.objective,
            },
            "generated_content": {
                "headline": headline,
                "short_copy": short_copy,
                "caption": caption,
                "video_script": video_script,
                "whatsapp_text": whatsapp_text,
                "cta": cta,
                "hashtags": hashtags,
                "ad_variations": ad_variations,
            },
            "publishing_plan": {
                "main_platform": data.platform,
                "recommended_format": self._recommended_format(data.platform),
                "posting_angle": (
                    "Começar com uma dor ou curiosidade, apresentar o produto "
                    "como solução simples e finalizar com CTA direto."
                ),
                "test_variations": [
                    "Teste 1: foco em dor.",
                    "Teste 2: foco em curiosidade.",
                    "Teste 3: foco em benefício rápido.",
                ],
            },
        }

        saved_content = ContentGeneration(
            user_id=current_user.id,
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            platform=data.platform,
            tone=data.tone,
            objective=data.objective,
            headline=headline,
            short_copy=short_copy,
            caption=caption,
            video_script=video_script,
            whatsapp_text=whatsapp_text,
            cta=cta,
            hashtags=hashtags,
            ad_variations=ad_variations,
            content_package=content_package,
            status="completed",
        )

        db.add(saved_content)
        db.commit()
        db.refresh(saved_content)

        return self._to_response(saved_content)

    def get_content_response(
        self,
        content: ContentGeneration,
    ) -> ContentGeneratorResponse:
        return self._to_response(content)

    def _to_response(
        self,
        content: ContentGeneration,
    ) -> ContentGeneratorResponse:
        return ContentGeneratorResponse(
            id=content.id,
            agent="Content Generator",
            status=content.status,
            product_name=content.product_name,
            niche=content.niche,
            target_audience=content.target_audience,
            platform=content.platform,
            tone=content.tone,
            objective=content.objective,
            headline=content.headline,
            short_copy=content.short_copy,
            caption=content.caption,
            video_script=content.video_script,
            whatsapp_text=content.whatsapp_text,
            cta=content.cta,
            hashtags=content.hashtags,
            ad_variations=content.ad_variations,
            content_package=content.content_package,
            created_at=content.created_at,
        )

    def _build_headline(self, product_name: str, tone: str) -> str:
        if tone == "premium":
            return f"{product_name}: mais praticidade com qualidade no dia a dia"

        if tone == "emocional":
            return f"Você merece uma rotina mais simples com {product_name}"

        if tone == "agressivo":
            return f"Pare de perder tempo: conheça o {product_name}"

        if tone == "direto":
            return f"Conheça o {product_name} e veja se faz sentido para você"

        return f"Esse {product_name} está chamando atenção"

    def _build_short_copy(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        tone: str,
    ) -> str:
        if tone == "agressivo":
            return (
                f"Se você está no nicho de {niche} e ainda resolve tudo do jeito difícil, "
                f"talvez esteja na hora de conhecer o {product_name}. Uma opção prática "
                f"para {target_audience}."
            )

        if tone == "premium":
            return (
                f"O {product_name} é uma opção para quem busca mais praticidade, "
                f"boa apresentação e uma solução útil dentro do nicho de {niche}."
            )

        return (
            f"Se você está no nicho de {niche} e quer mais praticidade, "
            f"o {product_name} pode ser uma ótima opção. Ele conversa diretamente "
            f"com {target_audience} e pode ser apresentado com conteúdo simples, visual e direto."
        )

    def _build_caption(
        self,
        product_name: str,
        niche: str,
        platform: str,
        objective: str,
    ) -> str:
        if objective == "capturar_lead":
            return (
                f"Quer receber mais achadinhos e oportunidades no nicho de {niche}? "
                f"O {product_name} é um exemplo de produto que pode facilitar a rotina. "
                f"Comente ou chame no direct para saber mais."
            )

        if objective == "validar_produto":
            return (
                f"Estou analisando esse produto no nicho de {niche}: {product_name}. "
                f"Você usaria algo assim no dia a dia?"
            )

        return (
            f"O {product_name} está chamando atenção no nicho de {niche}. "
            f"Uma solução prática, visual e fácil de entender. Confira a oferta e veja se faz sentido para você."
        )

    def _build_video_script(
        self,
        product_name: str,
        niche: str,
        platform: str,
    ) -> str:
        return (
            f"CENA 1: Abra mostrando uma dor comum no nicho de {niche}. "
            f"Texto na tela: 'Você ainda passa por isso?'. "
            f"CENA 2: Mostre rapidamente o problema ou a rotina difícil. "
            f"CENA 3: Apresente o {product_name} como solução prática. "
            f"CENA 4: Mostre 3 benefícios em cortes rápidos. "
            f"CENA 5: Finalize com CTA: 'Clique no link e confira a oferta'. "
            f"Formato recomendado para {platform}: vídeo vertical, rápido e direto."
        )

    def _build_whatsapp_text(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
    ) -> str:
        return (
            f"Olha esse produto que encontrei: {product_name}. "
            f"Ele pode ser uma boa opção para {target_audience}, principalmente "
            f"para quem busca praticidade no nicho de {niche}. Dá uma olhada na oferta."
        )

    def _build_cta(self, objective: str) -> str:
        if objective == "capturar_lead":
            return "Chame no direct para receber mais detalhes."

        if objective == "aquecer_audiencia":
            return "Salve esse conteúdo para ver depois."

        if objective == "validar_produto":
            return "Comente se você usaria esse produto."

        return "Clique no link e confira a oferta."

    def _build_hashtags(
        self,
        product_name: str,
        niche: str,
        platform: str,
    ) -> list[str]:
        clean_product = product_name.replace(" ", "")
        clean_niche = niche.replace(" ", "")

        base_hashtags = [
            "#afiliados",
            "#marketingdigital",
            "#achadinhos",
            "#oferta",
            f"#{clean_niche}",
            f"#{clean_product}",
        ]

        if platform == "tiktok":
            base_hashtags.extend(["#tiktokmefezcomprar", "#viral"])

        if platform == "instagram":
            base_hashtags.extend(["#reels", "#dicas"])

        if platform == "youtube_shorts":
            base_hashtags.extend(["#shorts", "#produtos"])

        return base_hashtags

    def _build_ad_variations(
        self,
        product_name: str,
        niche: str,
        tone: str,
    ) -> list[str]:
        return [
            f"Variação 1: {product_name} para quem quer praticidade no dia a dia.",
            f"Variação 2: Veja por que esse produto está chamando atenção no nicho de {niche}.",
            f"Variação 3: Uma solução simples para quem busca resultado rápido.",
            f"Variação 4: O tipo de produto que chama atenção porque resolve uma dor clara.",
            f"Variação 5: Teste criativo em tom {tone}, com foco em benefício rápido e CTA direto.",
        ]

    def _recommended_format(self, platform: str) -> str:
        if platform in ["tiktok", "instagram", "youtube_shorts"]:
            return "Vídeo vertical 9:16 entre 20 e 35 segundos."

        if platform == "whatsapp":
            return "Mensagem curta com oferta direta e link."

        if platform == "facebook_ads":
            return "Criativo direto com headline forte, benefício claro e CTA."

        if platform == "google":
            return "Anúncio textual com intenção de busca e CTA objetivo."

        return "Conteúdo curto, visual e direto."