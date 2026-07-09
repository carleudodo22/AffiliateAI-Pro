from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.creative_image import (
    CreativeImageHistoryItem,
    CreativeImageRequest,
    CreativeImageResponse,
)

try:
    from app.models import creative_image as creative_image_models
except Exception:
    creative_image_models = None

try:
    from app.services.workspace_profile import WorkspaceProfileService
except Exception:
    WorkspaceProfileService = None


class CreativeImageService:
    def generate_creative_image(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
        payload = self._build_creative_payload(
            data=data,
            db=db,
            current_user=current_user,
        )

        model_class = self._get_model_class()

        if model_class is None:
            return CreativeImageResponse(**payload)

        model_fields = self._get_model_fields(model_class)

        save_data: dict[str, Any] = {}

        for key, value in payload.items():
            if key in model_fields:
                save_data[key] = value

        if "user_id" in model_fields:
            save_data["user_id"] = current_user.id

        if "creative_package" in model_fields:
            save_data["creative_package"] = payload["creative_package"]

        if "source_data" in model_fields:
            save_data["source_data"] = payload["creative_package"]

        if "status" in model_fields:
            save_data["status"] = payload["status"]

        saved_creative = model_class(**save_data)

        db.add(saved_creative)
        db.commit()
        db.refresh(saved_creative)

        return self.normalize_response(saved_creative, fallback=payload)

    def create_generation(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
        return self.generate_creative_image(
            data=data,
            db=db,
            current_user=current_user,
        )

    def create_creative_image(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
        return self.generate_creative_image(
            data=data,
            db=db,
            current_user=current_user,
        )

    def generate(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> CreativeImageResponse:
        return self.generate_creative_image(
            data=data,
            db=db,
            current_user=current_user,
        )

    def normalize_response(
        self,
        creative: Any,
        fallback: dict[str, Any] | None = None,
    ) -> CreativeImageResponse:
        fallback = fallback or {}

        return CreativeImageResponse(
            id=self._get_value(creative, ["id"], fallback.get("id")),
            agent="Creative Image Agent",
            status=self._get_value(
                creative,
                ["status"],
                fallback.get("status", "completed"),
            ),
            product_name=self._get_value(
                creative,
                ["product_name"],
                fallback.get("product_name", "produto tendência"),
            ),
            niche=self._get_value(
                creative,
                ["niche"],
                fallback.get("niche", "beleza"),
            ),
            platform=self._get_value(
                creative,
                ["platform", "main_channel", "channel"],
                fallback.get("platform", "tiktok"),
            ),
            campaign_style=self._get_value(
                creative,
                ["campaign_style"],
                fallback.get("campaign_style", "viral"),
            ),
            visual_style=self._get_value(
                creative,
                ["visual_style", "image_style"],
                fallback.get("visual_style", "premium_dark"),
            ),
            target_audience=self._get_value(
                creative,
                ["target_audience"],
                fallback.get(
                    "target_audience",
                    "pessoas interessadas em soluções práticas",
                ),
            ),
            image_prompt=self._get_value(
                creative,
                ["image_prompt", "prompt"],
                fallback.get("image_prompt", ""),
            ),
            negative_prompt=self._get_value(
                creative,
                ["negative_prompt"],
                fallback.get("negative_prompt", ""),
            ),
            image_brief=self._get_value(
                creative,
                ["image_brief", "brief"],
                fallback.get("image_brief", ""),
            ),
            design_direction=self._get_value(
                creative,
                ["design_direction"],
                fallback.get("design_direction", ""),
            ),
            text_overlay=self._get_value(
                creative,
                ["text_overlay"],
                fallback.get("text_overlay", ""),
            ),
            color_direction=self._get_value(
                creative,
                ["color_direction"],
                fallback.get("color_direction", ""),
            ),
            composition=self._get_value(
                creative,
                ["composition"],
                fallback.get("composition", ""),
            ),
            creative_package=self._get_value(
                creative,
                ["creative_package", "source_data"],
                fallback.get("creative_package", {}),
            )
            or {},
            created_at=self._get_value(
                creative,
                ["created_at"],
                fallback.get("created_at"),
            ),
        )

    def normalize_history_item(
        self,
        creative: Any,
    ) -> CreativeImageHistoryItem:
        created_at = self._get_value(
            creative,
            ["created_at"],
            None,
        )

        if created_at is None:
            created_at = datetime.utcnow()

        return CreativeImageHistoryItem(
            id=self._get_value(creative, ["id"], 0) or 0,
            product_name=self._get_value(
                creative,
                ["product_name"],
                "produto tendência",
            ),
            niche=self._get_value(
                creative,
                ["niche"],
                "beleza",
            ),
            platform=self._get_value(
                creative,
                ["platform", "main_channel", "channel"],
                "tiktok",
            ),
            visual_style=self._get_value(
                creative,
                ["visual_style", "image_style"],
                "premium_dark",
            ),
            status=self._get_value(
                creative,
                ["status"],
                "completed",
            ),
            created_at=created_at,
        )

    def _build_creative_payload(
        self,
        data: CreativeImageRequest,
        db: Session,
        current_user: User,
    ) -> dict[str, Any]:
        workspace = self._get_workspace_context(
            db=db,
            current_user=current_user,
        )

        product_name = self._clean_text(
            data.product_name,
            "produto tendência",
        )

        niche = self._clean_text(
            data.niche,
            workspace.get("niche", "beleza"),
        ).lower()

        platform = self._clean_text(
            data.platform or data.main_channel or data.channel,
            workspace.get("platform", "tiktok"),
        ).lower()

        campaign_style = self._clean_text(
            data.campaign_style,
            workspace.get("tone", "viral"),
        ).lower()

        visual_style = self._clean_text(
            data.visual_style or data.image_style,
            workspace.get("visual_style", "premium_dark"),
        ).lower()

        target_audience = self._clean_text(
            data.target_audience,
            workspace.get(
                "target_audience",
                "pessoas interessadas em soluções práticas",
            ),
        )

        brand_name = workspace.get("brand_name") or "marca do afiliado"
        default_cta = workspace.get("default_cta") or "Clique no link e confira."
        preferred_words = workspace.get("preferred_words") or []
        forbidden_words = workspace.get("forbidden_words") or []
        notes = workspace.get("notes") or ""

        text_overlay = self._build_text_overlay(
            product_name=product_name,
            campaign_style=campaign_style,
            default_cta=default_cta,
        )

        color_direction = self._build_color_direction(
            visual_style=visual_style,
        )

        composition = self._build_composition(
            platform=platform,
            visual_style=visual_style,
        )

        design_direction = self._build_design_direction(
            brand_name=brand_name,
            visual_style=visual_style,
            campaign_style=campaign_style,
        )

        image_brief = self._build_image_brief(
            product_name=product_name,
            niche=niche,
            platform=platform,
            campaign_style=campaign_style,
            visual_style=visual_style,
            target_audience=target_audience,
            text_overlay=text_overlay,
            default_cta=default_cta,
        )

        image_prompt = self._build_image_prompt(
            product_name=product_name,
            niche=niche,
            platform=platform,
            campaign_style=campaign_style,
            visual_style=visual_style,
            target_audience=target_audience,
            brand_name=brand_name,
            text_overlay=text_overlay,
            color_direction=color_direction,
            composition=composition,
            extra_instructions=data.extra_instructions,
            preferred_words=preferred_words,
            notes=notes,
        )

        negative_prompt = self._build_negative_prompt(
            forbidden_words=forbidden_words,
        )

        creative_package = {
            "brand_name": brand_name,
            "product_name": product_name,
            "niche": niche,
            "platform": platform,
            "campaign_style": campaign_style,
            "visual_style": visual_style,
            "target_audience": target_audience,
            "product_url": data.product_url,
            "text_overlay": text_overlay,
            "color_direction": color_direction,
            "composition": composition,
            "design_direction": design_direction,
            "preferred_words": preferred_words,
            "forbidden_words": forbidden_words,
            "workspace_notes": notes,
            "generated_at": datetime.utcnow().isoformat(),
        }

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

    def _get_workspace_context(
        self,
        db: Session,
        current_user: User,
    ) -> dict[str, Any]:
        default_context = {
            "brand_name": "",
            "target_audience": "pessoas interessadas em soluções práticas",
            "default_cta": "Clique no link e confira.",
            "tone": "viral",
            "visual_style": "premium_dark",
            "preferred_words": [],
            "forbidden_words": [],
            "notes": "",
            "platform": "tiktok",
            "niche": "beleza",
        }

        if WorkspaceProfileService is None:
            return default_context

        try:
            profile = WorkspaceProfileService().get_or_create_profile(
                db=db,
                current_user=current_user,
            )

            return {
                "brand_name": profile.brand_name or "",
                "target_audience": (
                    profile.default_target_audience
                    or default_context["target_audience"]
                ),
                "default_cta": profile.default_cta or default_context["default_cta"],
                "tone": profile.tone or default_context["tone"],
                "visual_style": profile.visual_style or default_context["visual_style"],
                "preferred_words": profile.preferred_words or [],
                "forbidden_words": profile.forbidden_words or [],
                "notes": profile.notes or "",
                "platform": "tiktok",
                "niche": "beleza",
            }
        except Exception:
            return default_context

    def _build_text_overlay(
        self,
        product_name: str,
        campaign_style: str,
        default_cta: str,
    ) -> str:
        if campaign_style == "premium":
            return f"{product_name}\nEscolha inteligente\n{default_cta}"

        if campaign_style == "educativo":
            return f"Entenda como usar\n{product_name}\n{default_cta}"

        if campaign_style == "emocional":
            return f"Mais praticidade na rotina\n{product_name}\n{default_cta}"

        if campaign_style == "direto":
            return f"{product_name}\nConfira a oferta"

        return f"Olha esse achado\n{product_name}\n{default_cta}"

    def _build_color_direction(
        self,
        visual_style: str,
    ) -> str:
        if visual_style == "premium_dark":
            return "fundo escuro, alto contraste, detalhes em verde neon ou branco"

        if visual_style == "clean_light":
            return "fundo claro, tons suaves, bastante espaço e leitura fácil"

        if visual_style == "neon":
            return "cores vibrantes, brilho neon, contraste alto e energia visual"

        if visual_style == "luxury":
            return "tons sofisticados, preto, dourado, bege ou branco premium"

        if visual_style == "automotivo":
            return "preto, vermelho, cinza metálico, textura automotiva e contraste forte"

        if visual_style == "beleza":
            return "tons elegantes, suaves, rosé, bege, branco e iluminação limpa"

        return "visual moderno, limpo, com contraste forte e produto em destaque"

    def _build_composition(
        self,
        platform: str,
        visual_style: str,
    ) -> str:
        if platform in ["tiktok", "instagram", "youtube_shorts"]:
            return (
                "formato vertical 9:16, produto grande no centro, headline no topo, "
                "CTA no rodapé e espaço seguro para legenda"
            )

        if platform == "whatsapp":
            return (
                "arte quadrada ou vertical simples, produto em destaque, texto curto "
                "e CTA fácil de ler"
            )

        return (
            f"composição moderna no estilo {visual_style}, produto em destaque, "
            "texto curto e CTA visível"
        )

    def _build_design_direction(
        self,
        brand_name: str,
        visual_style: str,
        campaign_style: str,
    ) -> str:
        return (
            f"Direção visual para {brand_name}: criar uma peça no estilo {visual_style}, "
            f"com tom de campanha {campaign_style}, produto em destaque, leitura rápida, "
            "boa hierarquia visual e aparência profissional."
        )

    def _build_image_brief(
        self,
        product_name: str,
        niche: str,
        platform: str,
        campaign_style: str,
        visual_style: str,
        target_audience: str,
        text_overlay: str,
        default_cta: str,
    ) -> str:
        return (
            f"Criar arte para {platform} divulgando {product_name}, no nicho {niche}, "
            f"com estilo de campanha {campaign_style} e visual {visual_style}. "
            f"O público-alvo é: {target_audience}. "
            f"Texto sugerido na arte: {text_overlay}. "
            f"CTA principal: {default_cta}"
        )

    def _build_image_prompt(
        self,
        product_name: str,
        niche: str,
        platform: str,
        campaign_style: str,
        visual_style: str,
        target_audience: str,
        brand_name: str,
        text_overlay: str,
        color_direction: str,
        composition: str,
        extra_instructions: str | None,
        preferred_words: list[str],
        notes: str,
    ) -> str:
        preferred_text = ""

        if preferred_words:
            preferred_text = " Palavras/ideias preferidas: " + ", ".join(preferred_words) + "."

        notes_text = ""

        if notes:
            notes_text = f" Observações da marca: {notes}"

        extra_text = ""

        if extra_instructions:
            extra_text = f" Instruções extras: {extra_instructions.strip()}"

        return (
            f"Crie uma arte publicitária profissional para {platform}, formato vertical quando aplicável. "
            f"Produto principal: {product_name}. Nicho: {niche}. Marca/contexto: {brand_name}. "
            f"Público-alvo: {target_audience}. Estilo de campanha: {campaign_style}. "
            f"Estilo visual: {visual_style}. Direção de cores: {color_direction}. "
            f"Composição: {composition}. Texto na arte: {text_overlay}. "
            f"Produto grande, visual limpo, CTA visível, aparência moderna e pronta para anúncio."
            f"{preferred_text}{notes_text}{extra_text}"
        )

    def _build_negative_prompt(
        self,
        forbidden_words: list[str],
    ) -> str:
        base_negative = [
            "texto ilegível",
            "produto deformado",
            "logo distorcida",
            "baixa resolução",
            "poluição visual",
            "promessas exageradas",
            "aparência amadora",
            "mãos deformadas",
            "marca falsa",
        ]

        if forbidden_words:
            base_negative.extend(forbidden_words)

        return ", ".join(base_negative)

    def _clean_text(
        self,
        value: str | None,
        fallback: str,
    ) -> str:
        if value is None:
            return fallback

        clean_value = str(value).strip()

        if not clean_value:
            return fallback

        return clean_value

    def _get_value(
        self,
        obj: Any,
        names: list[str],
        fallback: Any = None,
    ) -> Any:
        if obj is None:
            return fallback

        if isinstance(obj, dict):
            for name in names:
                value = obj.get(name)

                if value is not None:
                    return value

            return fallback

        for name in names:
            value = getattr(obj, name, None)

            if value is not None:
                return value

        return fallback

    def _get_model_class(self):
        if creative_image_models is None:
            return None

        possible_names = [
            "CreativeImageGeneration",
            "CreativeImageRun",
            "CreativeGeneration",
            "CreativeImage",
        ]

        for name in possible_names:
            model_class = getattr(creative_image_models, name, None)

            if model_class is not None:
                return model_class

        return None

    def _get_model_fields(
        self,
        model_class: Any,
    ) -> set[str]:
        try:
            return set(model_class.__table__.columns.keys())
        except Exception:
            return set()