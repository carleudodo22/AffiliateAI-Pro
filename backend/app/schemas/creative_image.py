from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.creative_image import CreativeImageGeneration
from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
from app.schemas.creative_image import CreativeImageRequest, CreativeImageResponse
from app.services.ai_engine import ai_engine


class CreativeImageService:
    def generate_creative(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
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

        visual_style = (
            data.visual_style
            or data.image_style
            or workspace_data["visual_style"]
            or "premium_dark"
        )

        target_audience = (
            data.target_audience
            or workspace_data["default_target_audience"]
            or f"pessoas interessadas em produtos do nicho de {niche}"
        )

        fallback_package = self._build_creative_package(
            product_name=product_name,
            niche=niche,
            platform=platform,
            campaign_style=data.campaign_style,
            visual_style=visual_style,
            target_audience=target_audience,
            product_url=data.product_url or "",
            extra_instructions=data.extra_instructions or "",
            workspace=workspace_data,
        )

        ai_result = ai_engine.generate_json(
            system_prompt=(
                "Você é o Creative Image Agent do AffiliateAI Pro. "
                "Sua função é gerar prompts e briefings visuais para anúncios de afiliados, "
                "respeitando o Workspace Profile do usuário, marca, tom, CTA, estilo visual, "
                "palavras preferidas e palavras proibidas."
            ),
            user_prompt=(
                f"Produto: {product_name}\n"
                f"Nicho: {niche}\n"
                f"Plataforma: {platform}\n"
                f"Estilo de campanha: {data.campaign_style}\n"
                f"Estilo visual: {visual_style}\n"
                f"Público-alvo: {target_audience}\n"
                f"URL do produto: {data.product_url or 'não informada'}\n"
                f"Instruções extras: {data.extra_instructions or 'nenhuma'}\n"
                f"Marca: {workspace_data['brand_name'] or 'não definida'}\n"
                f"Tom de voz: {workspace_data['tone']}\n"
                f"CTA padrão: {workspace_data['default_cta']}\n"
                f"Palavras preferidas: {workspace_data['preferred_words']}\n"
                f"Palavras proibidas: {workspace_data['forbidden_words']}\n"
                f"Observações: {workspace_data['notes'] or 'nenhuma'}"
            ),
            fallback_data=fallback_package,
        )

        creative_package = ai_result.get("data", fallback_package)

        creative_package["ai_engine"] = {
            "provider": ai_result.get("provider", "mock"),
            "model": ai_result.get("model", "affiliateai-local-mock"),
            "mode": ai_result.get("mode", "safe_mock"),
        }

        creative_package["workspace_profile"] = workspace_data
        creative_package["personalization_enabled"] = True

        response_data = self._build_response_data(
            product_name=product_name,
            niche=niche,
            platform=platform,
            campaign_style=data.campaign_style,
            visual_style=visual_style,
            target_audience=target_audience,
            creative_package=creative_package,
            workspace=workspace_data,
        )

        response_data = self._apply_forbidden_words_to_response(
            data=response_data,
            workspace=workspace_data,
        )

        saved_creative = self._save_creative_safely(
            data=response_data,
            db=db,
            current_user=current_user,
        )

        if saved_creative is not None:
            response_data["id"] = getattr(saved_creative, "id", None)
            response_data["created_at"] = getattr(
                saved_creative,
                "created_at",
                datetime.utcnow(),
            )
        else:
            response_data["id"] = None
            response_data["status"] = "completed_unsaved"
            response_data["created_at"] = datetime.utcnow()

        return CreativeImageResponse(**response_data)

    def get_creative_response(
        self,
        creative: CreativeImageGeneration,
    ) -> CreativeImageResponse:
        creative_package = self._safe_dict(
            self._safe_get(creative, "creative_package", {})
        )

        product_name = self._safe_get(
            creative,
            "product_name",
            creative_package.get("product_name", "produto tendência"),
        )

        niche = self._safe_get(
            creative,
            "niche",
            creative_package.get("niche", "nicho"),
        )

        platform = self._safe_get(
            creative,
            "platform",
            self._safe_get(
                creative,
                "channel",
                creative_package.get("platform", "tiktok"),
            ),
        )

        campaign_style = self._safe_get(
            creative,
            "campaign_style",
            creative_package.get("campaign_style", "viral"),
        )

        visual_style = self._safe_get(
            creative,
            "visual_style",
            self._safe_get(
                creative,
                "image_style",
                creative_package.get("visual_style", "premium_dark"),
            ),
        )

        target_audience = self._safe_get(
            creative,
            "target_audience",
            creative_package.get("target_audience", "Público não informado"),
        )

        image_prompt = self._safe_get(
            creative,
            "image_prompt",
            creative_package.get("image_prompt", ""),
        )

        negative_prompt = self._safe_get(
            creative,
            "negative_prompt",
            creative_package.get("negative_prompt", ""),
        )

        image_brief = self._safe_get(
            creative,
            "image_brief",
            creative_package.get("image_brief", image_prompt),
        )

        design_direction = self._safe_get(
            creative,
            "design_direction",
            creative_package.get("design_direction", ""),
        )

        text_overlay = self._safe_get(
            creative,
            "text_overlay",
            creative_package.get("text_overlay", ""),
        )

        color_direction = self._safe_get(
            creative,
            "color_direction",
            creative_package.get("color_direction", ""),
        )

        composition = self._safe_get(
            creative,
            "composition",
            creative_package.get("composition", ""),
        )

        return CreativeImageResponse(
            id=self._safe_get(creative, "id", None),
            agent="Creative Image Agent",
            status=self._safe_get(creative, "status", "completed"),
            product_name=product_name,
            niche=niche,
            platform=platform,
            campaign_style=campaign_style,
            visual_style=visual_style,
            target_audience=target_audience,
            image_prompt=image_prompt,
            negative_prompt=negative_prompt,
            image_brief=image_brief,
            design_direction=design_direction,
            text_overlay=text_overlay,
            color_direction=color_direction,
            composition=composition,
            creative_package=creative_package,
            created_at=self._safe_get(creative, "created_at", datetime.utcnow()),
        )

    def normalize_history_item(
        self,
        creative: CreativeImageGeneration,
    ) -> dict[str, Any]:
        creative_response = self.get_creative_response(creative)

        return {
            "id": creative_response.id or 0,
            "product_name": creative_response.product_name,
            "niche": creative_response.niche,
            "platform": creative_response.platform,
            "visual_style": creative_response.visual_style,
            "status": creative_response.status,
            "created_at": creative_response.created_at or datetime.utcnow(),
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

    def _build_creative_package(
        self,
        product_name: str,
        niche: str,
        platform: str,
        campaign_style: str,
        visual_style: str,
        target_audience: str,
        product_url: str,
        extra_instructions: str,
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        image_prompt = self._build_image_prompt(
            product_name=product_name,
            niche=niche,
            platform=platform,
            campaign_style=campaign_style,
            visual_style=visual_style,
            target_audience=target_audience,
            workspace=workspace,
        )

        negative_prompt = self._build_negative_prompt(workspace)

        image_brief = self._build_image_brief(
            product_name=product_name,
            niche=niche,
            target_audience=target_audience,
            campaign_style=campaign_style,
            visual_style=visual_style,
            workspace=workspace,
        )

        design_direction = self._build_design_direction(
            visual_style=visual_style,
            workspace=workspace,
        )

        text_overlay = self._build_text_overlay(
            product_name=product_name,
            workspace=workspace,
        )

        color_direction = self._build_color_direction(visual_style)

        composition = self._build_composition(
            product_name=product_name,
            platform=platform,
            workspace=workspace,
        )

        return {
            "product_name": product_name,
            "niche": niche,
            "platform": platform,
            "campaign_style": campaign_style,
            "visual_style": visual_style,
            "target_audience": target_audience,
            "product_url": product_url,
            "extra_instructions": extra_instructions,
            "image_prompt": image_prompt,
            "negative_prompt": negative_prompt,
            "image_brief": image_brief,
            "design_direction": design_direction,
            "text_overlay": text_overlay,
            "color_direction": color_direction,
            "composition": composition,
            "workspace_profile": workspace,
            "personalization_enabled": True,
        }

    def _build_response_data(
        self,
        product_name: str,
        niche: str,
        platform: str,
        campaign_style: str,
        visual_style: str,
        target_audience: str,
        creative_package: dict[str, Any],
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        image_prompt = str(
            creative_package.get(
                "image_prompt",
                self._build_image_prompt(
                    product_name=product_name,
                    niche=niche,
                    platform=platform,
                    campaign_style=campaign_style,
                    visual_style=visual_style,
                    target_audience=target_audience,
                    workspace=workspace,
                ),
            )
        )

        negative_prompt = str(
            creative_package.get(
                "negative_prompt",
                self._build_negative_prompt(workspace),
            )
        )

        image_brief = str(
            creative_package.get(
                "image_brief",
                self._build_image_brief(
                    product_name=product_name,
                    niche=niche,
                    target_audience=target_audience,
                    campaign_style=campaign_style,
                    visual_style=visual_style,
                    workspace=workspace,
                ),
            )
        )

        design_direction = str(
            creative_package.get(
                "design_direction",
                self._build_design_direction(
                    visual_style=visual_style,
                    workspace=workspace,
                ),
            )
        )

        text_overlay = str(
            creative_package.get(
                "text_overlay",
                self._build_text_overlay(
                    product_name=product_name,
                    workspace=workspace,
                ),
            )
        )

        color_direction = str(
            creative_package.get(
                "color_direction",
                self._build_color_direction(visual_style),
            )
        )

        composition = str(
            creative_package.get(
                "composition",
                self._build_composition(
                    product_name=product_name,
                    platform=platform,
                    workspace=workspace,
                ),
            )
        )

        return {
            "id": None,
            "agent": "Creative Image Agent",
            "status": "completed",
            "product_name": product_name,
            "niche": niche,
            "platform": platform,
            "campaign_style": campaign_style,
            "visual_style": visual_style,
            "target_audience": target_audience,
            "image_prompt": image_prompt,
            "negative_prompt": negative_prompt,
            "image_brief": image_brief,
            "design_direction": design_direction,
            "text_overlay": text_overlay,
            "color_direction": color_direction,
            "composition": composition,
            "creative_package": creative_package,
            "created_at": datetime.utcnow(),
        }

    def _save_creative_safely(
        self,
        data: dict[str, Any],
        db: Session,
        current_user: User,
    ) -> CreativeImageGeneration | None:
        possible_payload = {
            "user_id": current_user.id,
            "product_name": data["product_name"],
            "niche": data["niche"],
            "platform": data["platform"],
            "channel": data["platform"],
            "campaign_style": data["campaign_style"],
            "visual_style": data["visual_style"],
            "image_style": data["visual_style"],
            "target_audience": data["target_audience"],
            "image_prompt": data["image_prompt"],
            "negative_prompt": data["negative_prompt"],
            "image_brief": data["image_brief"],
            "design_direction": data["design_direction"],
            "text_overlay": data["text_overlay"],
            "color_direction": data["color_direction"],
            "composition": data["composition"],
            "creative_package": data["creative_package"],
            "status": data["status"],
            "prompt": data["image_prompt"],
            "result": data["image_prompt"],
        }

        try:
            model_columns = set(CreativeImageGeneration.__table__.columns.keys())

            payload = {
                key: value
                for key, value in possible_payload.items()
                if key in model_columns
            }

            creative = CreativeImageGeneration(**payload)

            db.add(creative)
            db.commit()
            db.refresh(creative)

            return creative
        except Exception:
            db.rollback()
            return None

    def _build_image_prompt(
        self,
        product_name: str,
        niche: str,
        platform: str,
        campaign_style: str,
        visual_style: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> str:
        brand_name = workspace["brand_name"]
        cta = workspace["default_cta"]
        tone = workspace["tone"]
        preferred_words = self._preferred_words_text(workspace)

        brand_instruction = (
            f"Adicionar referência visual discreta da marca {brand_name}. "
            if brand_name
            else ""
        )

        visual_direction = self._build_design_direction(
            visual_style=visual_style,
            workspace=workspace,
        )

        return (
            f"Imagem publicitária vertical 9:16 para {platform}. "
            f"Produto principal em destaque: {product_name}. "
            f"Nicho: {niche}. Público-alvo: {target_audience}. "
            f"Estilo da campanha: {campaign_style}. Tom de voz: {tone}. "
            f"Direção visual: {visual_direction}. {brand_instruction}"
            f"Composição moderna, produto grande no centro, fundo profissional, "
            f"texto curto na arte, CTA visual: '{cta}'. {preferred_words}"
        )

    def _build_negative_prompt(
        self,
        workspace: dict[str, Any],
    ) -> str:
        forbidden_words = workspace.get("forbidden_words", [])

        base_negative = [
            "texto ilegível",
            "mãos deformadas",
            "produto distorcido",
            "logo falsa",
            "promessa exagerada",
            "layout poluído",
            "baixa resolução",
            "imagem amadora",
        ]

        for word in forbidden_words:
            word_text = str(word).strip()

            if word_text:
                base_negative.append(word_text)

        return ", ".join(base_negative)

    def _build_image_brief(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        campaign_style: str,
        visual_style: str,
        workspace: dict[str, Any],
    ) -> str:
        brand_name = workspace["brand_name"] or "marca não definida"
        cta = workspace["default_cta"]

        return (
            f"Criar uma arte 9:16 para campanha de afiliado. Produto: {product_name}. "
            f"Nicho: {niche}. Público: {target_audience}. Marca/Workspace: {brand_name}. "
            f"Estilo visual: {visual_style}. Estilo de campanha: {campaign_style}. "
            f"A arte deve transmitir valor, clareza, benefício prático e finalizar com CTA: {cta}."
        )

    def _build_design_direction(
        self,
        visual_style: str,
        workspace: dict[str, Any],
    ) -> str:
        style_map = {
            "premium_dark": "fundo escuro premium, alto contraste, detalhes em verde neon, visual SaaS moderno",
            "clean_light": "fundo claro, limpo, minimalista, organizado e moderno",
            "neon": "visual futurista com neon, brilho, contraste forte e energia",
            "luxury": "visual luxuoso, sofisticado, elegante, com sensação premium",
            "popular": "visual chamativo, acessível, colorido, foco em oferta e benefício",
            "automotivo": "visual automotivo, forte, escuro, textura mecânica, aparência robusta",
            "beleza": "visual elegante, limpo, suave, com sensação de cuidado e transformação",
        }

        direction = style_map.get(
            visual_style,
            "visual moderno, alto contraste, produto em destaque e CTA claro",
        )

        notes = workspace.get("notes") or ""

        if notes:
            direction += f". Observações da marca: {notes}"

        return direction

    def _build_text_overlay(
        self,
        product_name: str,
        workspace: dict[str, Any],
    ) -> str:
        tone = workspace["tone"]
        cta = workspace["default_cta"]

        if tone == "premium":
            return f"{product_name}\nEscolha prática\n{cta}"

        if tone == "agressivo":
            return f"Você precisa ver isso\n{product_name}\n{cta}"

        if tone == "educativo":
            return f"Entenda como funciona\n{product_name}\n{cta}"

        if tone == "emocional":
            return f"Mais praticidade na rotina\n{product_name}\n{cta}"

        return f"{product_name}\nOferta em destaque\n{cta}"

    def _build_color_direction(
        self,
        visual_style: str,
    ) -> str:
        color_map = {
            "premium_dark": "preto, grafite, verde neon, branco",
            "clean_light": "branco, cinza claro, preto suave, verde discreto",
            "neon": "preto, verde neon, azul neon, roxo",
            "luxury": "preto, dourado, branco, tons sofisticados",
            "popular": "cores fortes, amarelo, vermelho, azul, contraste alto",
            "automotivo": "preto, vermelho, cinza, branco, textura metálica",
            "beleza": "tons claros, nude, rosa suave, branco, dourado discreto",
        }

        return color_map.get(
            visual_style,
            "cores modernas, alto contraste e leitura fácil",
        )

    def _build_composition(
        self,
        product_name: str,
        platform: str,
        workspace: dict[str, Any],
    ) -> str:
        brand_name = workspace["brand_name"]

        brand_part = (
            f"Adicionar nome da marca {brand_name} de forma discreta no rodapé. "
            if brand_name
            else ""
        )

        return (
            f"Formato vertical 9:16 otimizado para {platform}. "
            f"Produto {product_name} grande no centro, título curto no topo, "
            f"benefício principal no meio, CTA no rodapé. {brand_part}"
            "Manter espaço visual, contraste forte e leitura rápida em celular."
        )

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
        data["image_prompt"] = self._apply_forbidden_words(
            data["image_prompt"],
            workspace,
        )
        data["negative_prompt"] = self._apply_forbidden_words(
            data["negative_prompt"],
            workspace,
        )
        data["image_brief"] = self._apply_forbidden_words(
            data["image_brief"],
            workspace,
        )
        data["design_direction"] = self._apply_forbidden_words(
            data["design_direction"],
            workspace,
        )
        data["text_overlay"] = self._apply_forbidden_words(
            data["text_overlay"],
            workspace,
        )
        data["color_direction"] = self._apply_forbidden_words(
            data["color_direction"],
            workspace,
        )
        data["composition"] = self._apply_forbidden_words(
            data["composition"],
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

    def _safe_dict(self, value) -> dict[str, Any]:
        if isinstance(value, dict):
            return value

        return {}