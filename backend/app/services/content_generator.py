from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.content_generation import ContentGeneration
from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
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
        workspace = self._get_workspace_profile(
            db=db,
            current_user=current_user,
        )

        workspace_data = self._workspace_to_dict(workspace)

        product_name = data.product_name.strip() or "produto tendência"
        niche = data.niche.strip().lower() or "beleza"

        platform = (
            data.platform
            or data.main_channel
            or data.channel
            or "tiktok"
        )

        target_audience = (
            data.target_audience
            or workspace_data["default_target_audience"]
            or f"pessoas interessadas em produtos do nicho de {niche}"
        )

        fallback_package = self._build_content_package(
            product_name=product_name,
            niche=niche,
            platform=platform,
            content_type=data.content_type,
            objective=data.objective,
            campaign_style=data.campaign_style,
            target_audience=target_audience,
            product_url=data.product_url or "",
            keywords=data.keywords or "",
            workspace=workspace_data,
        )

        ai_result = ai_engine.generate_json(
            system_prompt=(
                "Você é o Content Generator Agent do AffiliateAI Pro. "
                "Sua função é gerar conteúdo para afiliados usando o Workspace Profile "
                "do usuário, respeitando marca, tom, CTA, palavras preferidas e proibidas."
            ),
            user_prompt=(
                f"Produto: {product_name}\n"
                f"Nicho: {niche}\n"
                f"Plataforma: {platform}\n"
                f"Tipo de conteúdo: {data.content_type}\n"
                f"Objetivo: {data.objective}\n"
                f"Estilo de campanha: {data.campaign_style}\n"
                f"Público-alvo: {target_audience}\n"
                f"URL do produto: {data.product_url or 'não informada'}\n"
                f"Palavras-chave: {data.keywords or 'não informadas'}\n"
                f"Marca: {workspace_data['brand_name'] or 'não definida'}\n"
                f"Tom de voz: {workspace_data['tone']}\n"
                f"CTA padrão: {workspace_data['default_cta']}\n"
                f"Palavras preferidas: {workspace_data['preferred_words']}\n"
                f"Palavras proibidas: {workspace_data['forbidden_words']}\n"
                f"Observações: {workspace_data['notes'] or 'nenhuma'}"
            ),
            fallback_data=fallback_package,
        )

        content_package = ai_result.get("data", fallback_package)

        content_package["ai_engine"] = {
            "provider": ai_result.get("provider", "mock"),
            "model": ai_result.get("model", "affiliateai-local-mock"),
            "mode": ai_result.get("mode", "safe_mock"),
        }

        content_package["workspace_profile"] = workspace_data
        content_package["personalization_enabled"] = True

        response_data = self._build_response_data(
            product_name=product_name,
            niche=niche,
            platform=platform,
            content_type=data.content_type,
            target_audience=target_audience,
            content_package=content_package,
            workspace=workspace_data,
        )

        response_data = self._apply_forbidden_words_to_response(
            response_data,
            workspace_data,
        )

        saved_content = self._save_content_safely(
            data=response_data,
            db=db,
            current_user=current_user,
        )

        if saved_content is not None:
            response_data["id"] = getattr(saved_content, "id", None)
            response_data["created_at"] = getattr(
                saved_content,
                "created_at",
                datetime.utcnow(),
            )
        else:
            response_data["id"] = None
            response_data["status"] = "completed_unsaved"
            response_data["created_at"] = datetime.utcnow()

        return ContentGeneratorResponse(**response_data)

    def get_content_response(
        self,
        content: ContentGeneration,
    ) -> ContentGeneratorResponse:
        content_package = self._safe_dict(
            self._safe_get(content, "content_package", {})
        )

        product_name = self._safe_get(
            content,
            "product_name",
            content_package.get("product_name", "produto tendência"),
        )

        niche = self._safe_get(
            content,
            "niche",
            content_package.get("niche", "nicho"),
        )

        platform = self._safe_get(
            content,
            "platform",
            self._safe_get(
                content,
                "channel",
                content_package.get("platform", "tiktok"),
            ),
        )

        content_type = self._safe_get(
            content,
            "content_type",
            content_package.get("content_type", "short_video"),
        )

        headline = self._safe_get(
            content,
            "headline",
            content_package.get("headline", f"Conheça o {product_name}"),
        )

        caption = self._safe_get(
            content,
            "caption",
            content_package.get("caption", ""),
        )

        script = self._safe_get(
            content,
            "script",
            content_package.get("script", ""),
        )

        short_copy = self._safe_get(
            content,
            "short_copy",
            content_package.get("short_copy", caption),
        )

        hashtags = self._safe_list(
            self._safe_get(
                content,
                "hashtags",
                content_package.get("hashtags", []),
            )
        )

        ctas = self._safe_list(
            self._safe_get(
                content,
                "ctas",
                content_package.get("ctas", []),
            )
        )

        target_audience = self._safe_get(
            content,
            "target_audience",
            content_package.get("target_audience", "Público não informado"),
        )

        generated_content = self._safe_get(
            content,
            "generated_content",
            content_package.get("generated_content", ""),
        )

        if not generated_content:
            generated_content = self._build_generated_content_text(
                headline=headline,
                caption=caption,
                script=script,
                short_copy=short_copy,
                hashtags=hashtags,
                ctas=ctas,
            )

        return ContentGeneratorResponse(
            id=self._safe_get(content, "id", None),
            agent="Content Generator Agent",
            status=self._safe_get(content, "status", "completed"),
            product_name=product_name,
            niche=niche,
            platform=platform,
            content_type=content_type,
            target_audience=target_audience,
            headline=headline,
            caption=caption,
            script=script,
            short_copy=short_copy,
            hashtags=hashtags,
            ctas=ctas,
            generated_content=generated_content,
            content_package=content_package,
            created_at=self._safe_get(content, "created_at", datetime.utcnow()),
        )

    def normalize_history_item(
        self,
        content: ContentGeneration,
    ) -> dict[str, Any]:
        content_response = self.get_content_response(content)

        return {
            "id": content_response.id or 0,
            "product_name": content_response.product_name,
            "niche": content_response.niche,
            "platform": content_response.platform,
            "content_type": content_response.content_type,
            "headline": content_response.headline,
            "status": content_response.status,
            "created_at": content_response.created_at or datetime.utcnow(),
        }

    def _get_workspace_profile(
        self,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile | None:
        return (
            db.query(WorkspaceProfile)
            .filter(WorkspaceProfile.user_id == current_user.id)
            .first()
        )

    def _workspace_to_dict(
        self,
        workspace: WorkspaceProfile | None,
    ) -> dict[str, Any]:
        if workspace is None:
            return {
                "id": None,
                "project_name": "AffiliateAI Pro",
                "brand_name": "",
                "default_target_audience": (
                    "pessoas interessadas em soluções práticas e ofertas úteis"
                ),
                "default_cta": "Clique no link e confira a oferta.",
                "tone": "direto",
                "visual_style": "premium_dark",
                "language": "pt-BR",
                "preferred_words": [],
                "forbidden_words": [],
                "notes": "",
            }

        return {
            "id": workspace.id,
            "project_name": workspace.project_name or "AffiliateAI Pro",
            "brand_name": workspace.brand_name or "",
            "default_target_audience": (
                workspace.default_target_audience
                or "pessoas interessadas em soluções práticas e ofertas úteis"
            ),
            "default_cta": workspace.default_cta
            or "Clique no link e confira a oferta.",
            "tone": workspace.tone or "direto",
            "visual_style": workspace.visual_style or "premium_dark",
            "language": workspace.language or "pt-BR",
            "preferred_words": workspace.preferred_words or [],
            "forbidden_words": workspace.forbidden_words or [],
            "notes": workspace.notes or "",
        }

    def _build_content_package(
        self,
        product_name: str,
        niche: str,
        platform: str,
        content_type: str,
        objective: str,
        campaign_style: str,
        target_audience: str,
        product_url: str,
        keywords: str,
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        headline = self._build_headline(
            product_name=product_name,
            campaign_style=campaign_style,
            workspace=workspace,
        )

        caption = self._build_caption(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            workspace=workspace,
        )

        script = self._build_script(
            product_name=product_name,
            niche=niche,
            platform=platform,
            workspace=workspace,
        )

        short_copy = self._build_short_copy(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            workspace=workspace,
        )

        hashtags = self._build_hashtags(
            product_name=product_name,
            niche=niche,
            workspace=workspace,
        )

        ctas = self._build_ctas(workspace)

        generated_content = self._build_generated_content_text(
            headline=headline,
            caption=caption,
            script=script,
            short_copy=short_copy,
            hashtags=hashtags,
            ctas=ctas,
        )

        return {
            "product_name": product_name,
            "niche": niche,
            "platform": platform,
            "content_type": content_type,
            "objective": objective,
            "campaign_style": campaign_style,
            "target_audience": target_audience,
            "product_url": product_url,
            "keywords": keywords,
            "headline": headline,
            "caption": caption,
            "script": script,
            "short_copy": short_copy,
            "hashtags": hashtags,
            "ctas": ctas,
            "generated_content": generated_content,
            "workspace_profile": workspace,
            "personalization_enabled": True,
        }

    def _build_response_data(
        self,
        product_name: str,
        niche: str,
        platform: str,
        content_type: str,
        target_audience: str,
        content_package: dict[str, Any],
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        headline = str(
            content_package.get(
                "headline",
                self._build_headline(
                    product_name=product_name,
                    campaign_style="viral",
                    workspace=workspace,
                ),
            )
        )

        caption = str(
            content_package.get(
                "caption",
                self._build_caption(
                    product_name=product_name,
                    niche=niche,
                    target_audience=target_audience,
                    workspace=workspace,
                ),
            )
        )

        script = str(
            content_package.get(
                "script",
                self._build_script(
                    product_name=product_name,
                    niche=niche,
                    platform=platform,
                    workspace=workspace,
                ),
            )
        )

        short_copy = str(
            content_package.get(
                "short_copy",
                self._build_short_copy(
                    product_name=product_name,
                    niche=niche,
                    target_audience=target_audience,
                    workspace=workspace,
                ),
            )
        )

        hashtags = self._safe_list(
            content_package.get(
                "hashtags",
                self._build_hashtags(
                    product_name=product_name,
                    niche=niche,
                    workspace=workspace,
                ),
            )
        )

        ctas = self._safe_list(
            content_package.get(
                "ctas",
                self._build_ctas(workspace),
            )
        )

        generated_content = str(
            content_package.get(
                "generated_content",
                self._build_generated_content_text(
                    headline=headline,
                    caption=caption,
                    script=script,
                    short_copy=short_copy,
                    hashtags=hashtags,
                    ctas=ctas,
                ),
            )
        )

        return {
            "id": None,
            "agent": "Content Generator Agent",
            "status": "completed",
            "product_name": product_name,
            "niche": niche,
            "platform": platform,
            "content_type": content_type,
            "target_audience": target_audience,
            "headline": headline,
            "caption": caption,
            "script": script,
            "short_copy": short_copy,
            "hashtags": hashtags,
            "ctas": ctas,
            "generated_content": generated_content,
            "content_package": content_package,
            "created_at": datetime.utcnow(),
        }

    def _save_content_safely(
        self,
        data: dict[str, Any],
        db: Session,
        current_user: User,
    ) -> ContentGeneration | None:
        possible_payload = {
            "user_id": current_user.id,
            "product_name": data["product_name"],
            "niche": data["niche"],
            "platform": data["platform"],
            "channel": data["platform"],
            "content_type": data["content_type"],
            "target_audience": data["target_audience"],
            "headline": data["headline"],
            "caption": data["caption"],
            "script": data["script"],
            "short_copy": data["short_copy"],
            "hashtags": data["hashtags"],
            "ctas": data["ctas"],
            "generated_content": data["generated_content"],
            "content_package": data["content_package"],
            "status": data["status"],
        }

        try:
            model_columns = set(ContentGeneration.__table__.columns.keys())

            payload = {
                key: value
                for key, value in possible_payload.items()
                if key in model_columns
            }

            content = ContentGeneration(**payload)

            db.add(content)
            db.commit()
            db.refresh(content)

            return content
        except Exception:
            db.rollback()
            return None

    def _build_headline(
        self,
        product_name: str,
        campaign_style: str,
        workspace: dict[str, Any],
    ) -> str:
        brand_name = workspace["brand_name"]
        tone = workspace["tone"]

        brand_prefix = f"{brand_name}: " if brand_name else ""

        if tone == "premium":
            return f"{brand_prefix}{product_name} para quem busca uma escolha mais inteligente"

        if tone == "emocional":
            return f"{brand_prefix}O {product_name} pode facilitar sua rotina"

        if tone == "agressivo":
            return f"{brand_prefix}Você precisa conhecer o {product_name}"

        if tone == "educativo":
            return f"{brand_prefix}Entenda como o {product_name} pode ajudar"

        if campaign_style == "viral":
            return f"{brand_prefix}Esse {product_name} está chamando atenção"

        return f"{brand_prefix}Conheça o {product_name}"

    def _build_caption(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]
        tone = workspace["tone"]
        preferred_words = self._preferred_words_text(workspace)

        if tone == "premium":
            return (
                f"Para {target_audience}, o {product_name} pode ser uma opção mais prática "
                f"e bem posicionada no nicho de {niche}. Conteúdo limpo, benefício real "
                f"e chamada clara. {cta} {preferred_words}"
            )

        if tone == "agressivo":
            return (
                f"Se você ainda não testou o {product_name}, pode estar deixando uma boa oportunidade passar. "
                f"Mostre a dor, apresente a solução e finalize direto. {cta} {preferred_words}"
            )

        if tone == "educativo":
            return (
                f"Entenda como o {product_name} pode ajudar no nicho de {niche}. "
                f"Mostre funcionamento, benefício e aplicação prática. {cta} {preferred_words}"
            )

        if tone == "emocional":
            return (
                f"Às vezes uma solução simples muda a rotina. O {product_name} pode ajudar "
                f"{target_audience} com mais praticidade no dia a dia. {cta} {preferred_words}"
            )

        return (
            f"O {product_name} pode ser uma opção prática para {target_audience} no nicho de {niche}. "
            f"Mostre o benefício de forma simples, visual e direta. {cta} {preferred_words}"
        )

    def _build_short_copy(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]

        return (
            f"Produto: {product_name}. Público: {target_audience}. "
            f"Foco: benefício prático no nicho de {niche}. CTA: {cta}"
        )

    def _build_script(
        self,
        product_name: str,
        niche: str,
        platform: str,
        workspace: dict[str, Any],
    ) -> str:
        cta = workspace["default_cta"]
        tone = workspace["tone"]

        if tone == "educativo":
            return (
                f"CENA 1: Explique uma dúvida comum no nicho de {niche}. "
                f"CENA 2: Mostre o {product_name} e explique para que serve. "
                "CENA 3: Liste 3 benefícios práticos com texto na tela. "
                f"CENA 4: Finalize com: '{cta}'"
            )

        if tone == "agressivo":
            return (
                f"CENA 1: Abra com uma dor forte do nicho de {niche}. "
                f"CENA 2: Apresente o {product_name} como solução direta. "
                "CENA 3: Mostre o produto com cortes rápidos e texto forte. "
                f"CENA 4: Feche com CTA: '{cta}'"
            )

        return (
            f"CENA 1: Mostre uma dor comum do nicho de {niche}. "
            f"CENA 2: Apresente o {product_name}. "
            "CENA 3: Mostre 3 benefícios rápidos. "
            f"CENA 4: Finalize para {platform} com CTA: '{cta}'"
        )

    def _build_hashtags(
        self,
        product_name: str,
        niche: str,
        workspace: dict[str, Any],
    ) -> list[str]:
        brand_name = workspace["brand_name"]

        hashtags = [
            "#afiliados",
            "#marketingdigital",
            "#achadinhos",
            "#oferta",
            f"#{niche.replace(' ', '')}",
            f"#{product_name.replace(' ', '')}",
        ]

        if brand_name:
            hashtags.append(f"#{brand_name.replace(' ', '')}")

        return hashtags

    def _build_ctas(
        self,
        workspace: dict[str, Any],
    ) -> list[str]:
        default_cta = workspace["default_cta"]

        ctas = [
            default_cta,
            "Veja a oferta disponível.",
            "Confira os detalhes antes que mude.",
        ]

        clean_ctas: list[str] = []

        for cta in ctas:
            if cta not in clean_ctas:
                clean_ctas.append(cta)

        return clean_ctas

    def _build_generated_content_text(
        self,
        headline: str,
        caption: str,
        script: str,
        short_copy: str,
        hashtags: list[str],
        ctas: list[str],
    ) -> str:
        hashtags_text = " ".join(hashtags)
        ctas_text = "\n".join([f"- {cta}" for cta in ctas])

        return f"""
HEADLINE
{headline}

COPY / LEGENDA
{caption}

COPY CURTA
{short_copy}

ROTEIRO
{script}

CTAS
{ctas_text}

HASHTAGS
{hashtags_text}
""".strip()

    def _preferred_words_text(
        self,
        workspace: dict[str, Any],
    ) -> str:
        preferred_words = workspace.get("preferred_words", [])

        if not preferred_words:
            return ""

        words = ", ".join([str(word) for word in preferred_words])

        return f"Priorizar ideias como: {words}."

    def _apply_forbidden_words_to_response(
        self,
        data: dict[str, Any],
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        data["headline"] = self._apply_forbidden_words(data["headline"], workspace)
        data["caption"] = self._apply_forbidden_words(data["caption"], workspace)
        data["script"] = self._apply_forbidden_words(data["script"], workspace)
        data["short_copy"] = self._apply_forbidden_words(
            data["short_copy"],
            workspace,
        )
        data["generated_content"] = self._apply_forbidden_words(
            data["generated_content"],
            workspace,
        )

        return data

    def _apply_forbidden_words(
        self,
        text: str,
        workspace: dict[str, Any],
    ) -> str:
        forbidden_words = workspace.get("forbidden_words", [])

        clean_text = text

        for word in forbidden_words:
            word_text = str(word).strip()

            if not word_text:
                continue

            clean_text = clean_text.replace(word_text, "[termo removido]")
            clean_text = clean_text.replace(word_text.capitalize(), "[termo removido]")
            clean_text = clean_text.replace(word_text.upper(), "[termo removido]")

        return clean_text

    def _safe_get(self, obj, field: str, fallback=None):
        value = getattr(obj, field, fallback)

        if value is None or value == "":
            return fallback

        return value

    def _safe_list(self, value) -> list[str]:
        if isinstance(value, list):
            return [str(item) for item in value]

        if isinstance(value, tuple):
            return [str(item) for item in value]

        if isinstance(value, str) and value.strip():
            return [value]

        return []

    def _safe_dict(self, value) -> dict[str, Any]:
        if isinstance(value, dict):
            return value

        return {}