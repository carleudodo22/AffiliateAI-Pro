from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
from app.schemas.workspace_profile import WorkspaceProfileRequest


class WorkspaceProfileService:
    def get_or_create_profile(
        self,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile:
        profile = (
            db.query(WorkspaceProfile)
            .filter(WorkspaceProfile.user_id == current_user.id)
            .first()
        )

        if profile is not None:
            return profile

        profile = WorkspaceProfile(
            user_id=current_user.id,
            **self._get_default_profile_data(),
        )

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    def update_profile(
        self,
        data: WorkspaceProfileRequest,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile:
        profile = self.get_or_create_profile(
            db=db,
            current_user=current_user,
        )

        profile.project_name = self._clean_text(
            value=data.project_name,
            fallback="AffiliateAI Pro",
        )

        profile.brand_name = self._clean_text(
            value=data.brand_name,
            fallback="",
        )

        profile.default_target_audience = self._clean_text(
            value=data.default_target_audience,
            fallback="pessoas interessadas em soluções práticas e ofertas úteis",
        )

        profile.default_cta = self._clean_text(
            value=data.default_cta,
            fallback="Clique no link e confira a oferta.",
        )

        profile.tone = data.tone
        profile.visual_style = data.visual_style
        profile.language = data.language

        profile.preferred_words = self._clean_list(data.preferred_words)
        profile.forbidden_words = self._clean_list(data.forbidden_words)

        profile.notes = data.notes.strip() if data.notes else None
        profile.extra_data = data.extra_data or {}

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    def reset_profile(
        self,
        db: Session,
        current_user: User,
        keep_brand: bool = True,
    ) -> WorkspaceProfile:
        profile = self.get_or_create_profile(
            db=db,
            current_user=current_user,
        )

        old_brand_name = profile.brand_name or ""
        old_project_name = profile.project_name or "AffiliateAI Pro"

        default_data = self._get_default_profile_data()

        if keep_brand:
            profile.project_name = old_project_name
            profile.brand_name = old_brand_name
        else:
            profile.project_name = default_data["project_name"]
            profile.brand_name = default_data["brand_name"]

        profile.default_target_audience = default_data["default_target_audience"]
        profile.default_cta = default_data["default_cta"]
        profile.tone = default_data["tone"]
        profile.visual_style = default_data["visual_style"]
        profile.language = default_data["language"]
        profile.preferred_words = default_data["preferred_words"]
        profile.forbidden_words = default_data["forbidden_words"]
        profile.notes = default_data["notes"]

        profile.extra_data = {
            **(profile.extra_data or {}),
            "last_action": "reset_to_default",
            "kept_brand": keep_brand,
        }

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    def list_presets(self) -> dict[str, Any]:
        presets = self._get_presets()

        return {
            "status": "ok",
            "message": "Presets de Workspace disponíveis.",
            "total": len(presets),
            "presets": [
                {
                    "key": key,
                    "name": value["name"],
                    "description": value["description"],
                    "tone": value["tone"],
                    "visual_style": value["visual_style"],
                    "default_cta": value["default_cta"],
                }
                for key, value in presets.items()
            ],
        }

    def apply_preset(
        self,
        preset_key: str,
        db: Session,
        current_user: User,
    ) -> WorkspaceProfile:
        presets = self._get_presets()

        clean_key = preset_key.strip().lower()

        if clean_key not in presets:
            raise HTTPException(
                status_code=404,
                detail="Preset de Workspace não encontrado.",
            )

        preset = presets[clean_key]

        profile = self.get_or_create_profile(
            db=db,
            current_user=current_user,
        )

        current_brand_name = profile.brand_name or ""
        current_project_name = profile.project_name or "AffiliateAI Pro"

        profile.project_name = current_project_name
        profile.brand_name = current_brand_name

        profile.default_target_audience = preset["default_target_audience"]
        profile.default_cta = preset["default_cta"]

        profile.tone = preset["tone"]
        profile.visual_style = preset["visual_style"]
        profile.language = "pt-BR"

        profile.preferred_words = preset["preferred_words"]
        profile.forbidden_words = preset["forbidden_words"]
        profile.notes = preset["notes"]

        profile.extra_data = {
            **(profile.extra_data or {}),
            "last_applied_preset": clean_key,
            "last_applied_preset_name": preset["name"],
        }

        db.add(profile)
        db.commit()
        db.refresh(profile)

        return profile

    def _get_default_profile_data(self) -> dict[str, Any]:
        return {
            "project_name": "AffiliateAI Pro",
            "brand_name": "",
            "default_target_audience": (
                "pessoas interessadas em soluções práticas e ofertas úteis"
            ),
            "default_cta": "Clique no link e confira a oferta.",
            "tone": "direto",
            "visual_style": "premium_dark",
            "language": "pt-BR",
            "preferred_words": [
                "estratégia",
                "oferta",
                "resultado",
                "prático",
            ],
            "forbidden_words": [
                "milagre",
                "dinheiro fácil",
                "garantido",
            ],
            "notes": (
                "Gerar campanhas com aparência profissional, direta e sem promessas exageradas."
            ),
            "extra_data": {},
        }

    def _clean_text(
        self,
        value: str,
        fallback: str,
    ) -> str:
        clean_value = value.strip()

        if not clean_value:
            return fallback

        return clean_value

    def _clean_list(
        self,
        values: list[str],
    ) -> list[str]:
        clean_values: list[str] = []

        for value in values:
            clean_value = str(value).strip()

            if not clean_value:
                continue

            if clean_value in clean_values:
                continue

            clean_values.append(clean_value)

        return clean_values

    def _get_presets(self) -> dict[str, dict[str, Any]]:
        return {
            "afiliado_direto": {
                "name": "Afiliado Direto",
                "description": "Campanhas simples, objetivas e focadas em vender sem enrolação.",
                "default_target_audience": (
                    "pessoas que querem encontrar produtos úteis, ofertas práticas "
                    "e soluções simples para o dia a dia"
                ),
                "default_cta": "Clique no link e confira a oferta agora.",
                "tone": "direto",
                "visual_style": "premium_dark",
                "preferred_words": [
                    "oferta",
                    "prático",
                    "resultado",
                    "benefício",
                    "solução",
                ],
                "forbidden_words": [
                    "milagre",
                    "garantido",
                    "dinheiro fácil",
                    "100% garantido",
                ],
                "notes": (
                    "Criar campanhas diretas, com benefício claro, sem promessas exageradas "
                    "e com CTA objetivo."
                ),
            },
            "premium_dark": {
                "name": "Premium Dark",
                "description": "Comunicação mais sofisticada, visual escuro e aparência profissional.",
                "default_target_audience": (
                    "pessoas que valorizam qualidade, apresentação profissional e escolhas "
                    "mais inteligentes antes de comprar"
                ),
                "default_cta": "Veja os detalhes da oferta e compare antes de decidir.",
                "tone": "premium",
                "visual_style": "premium_dark",
                "preferred_words": [
                    "inteligente",
                    "profissional",
                    "qualidade",
                    "valor",
                    "estratégia",
                ],
                "forbidden_words": [
                    "baratinho",
                    "milagre",
                    "garantido",
                    "imperdível demais",
                ],
                "notes": (
                    "Evitar aparência amadora. Usar linguagem limpa, visual premium, "
                    "benefício real e CTA elegante."
                ),
            },
            "viral_tiktok": {
                "name": "Viral TikTok",
                "description": "Campanhas com gancho forte, curiosidade e ritmo rápido.",
                "default_target_audience": (
                    "pessoas que consomem vídeos curtos, gostam de achadinhos, novidades "
                    "e produtos fáceis de entender rapidamente"
                ),
                "default_cta": "Veja o produto no link antes que a oferta mude.",
                "tone": "viral",
                "visual_style": "neon",
                "preferred_words": [
                    "achadinho",
                    "curiosidade",
                    "viral",
                    "rápido",
                    "atenção",
                ],
                "forbidden_words": [
                    "garantido",
                    "milagre",
                    "fique rico",
                    "dinheiro fácil",
                ],
                "notes": (
                    "Criar ganchos fortes para os 3 primeiros segundos. Usar curiosidade, "
                    "demonstração visual e CTA rápido."
                ),
            },
            "educativo": {
                "name": "Educativo",
                "description": "Conteúdo explicativo, confiável e bom para produtos que precisam de contexto.",
                "default_target_audience": (
                    "pessoas que querem entender melhor um produto antes de comprar "
                    "e valorizam explicações simples"
                ),
                "default_cta": "Confira os detalhes e veja se faz sentido para você.",
                "tone": "educativo",
                "visual_style": "clean_light",
                "preferred_words": [
                    "entenda",
                    "aprenda",
                    "compare",
                    "benefício",
                    "funciona",
                ],
                "forbidden_words": [
                    "milagre",
                    "sem esforço",
                    "garantido",
                    "resultado instantâneo",
                ],
                "notes": (
                    "Explicar o problema, mostrar como o produto ajuda e orientar a decisão "
                    "sem forçar a venda."
                ),
            },
            "beleza": {
                "name": "Beleza",
                "description": "Campanhas para produtos de beleza, autocuidado e transformação visual.",
                "default_target_audience": (
                    "pessoas interessadas em beleza, autocuidado, praticidade, transformação "
                    "visual e produtos fáceis de usar"
                ),
                "default_cta": "Clique no link e veja como esse produto pode ajudar na sua rotina.",
                "tone": "emocional",
                "visual_style": "beleza",
                "preferred_words": [
                    "beleza",
                    "rotina",
                    "cuidado",
                    "praticidade",
                    "transformação",
                ],
                "forbidden_words": [
                    "perfeito",
                    "milagre",
                    "resultado garantido",
                    "sem defeitos",
                ],
                "notes": (
                    "Usar linguagem próxima, visual limpo, foco em rotina, cuidado e transformação "
                    "realista."
                ),
            },
            "automotivo": {
                "name": "Automotivo",
                "description": "Campanhas para produtos automotivos com visual forte e direto.",
                "default_target_audience": (
                    "pessoas que cuidam do carro, gostam de praticidade automotiva e procuram "
                    "produtos úteis para manutenção, limpeza ou organização"
                ),
                "default_cta": "Confira o produto no link e veja se serve para o seu carro.",
                "tone": "direto",
                "visual_style": "automotivo",
                "preferred_words": [
                    "carro",
                    "prático",
                    "limpeza",
                    "proteção",
                    "manutenção",
                ],
                "forbidden_words": [
                    "milagre",
                    "garantido",
                    "serve em todos",
                    "nunca mais",
                ],
                "notes": (
                    "Usar visual forte, direto, com produto em destaque. Evitar promessa técnica "
                    "sem validação."
                ),
            },
        }