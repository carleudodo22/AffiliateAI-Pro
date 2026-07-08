from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.workspace_profile import (
    WorkspaceProfileRequest,
    WorkspaceProfileResponse,
)
from app.services.workspace_profile import WorkspaceProfileService


router = APIRouter(
    prefix="/api/workspace-profile",
    tags=["Workspace Profile"],
)

service = WorkspaceProfileService()


@router.get("/me", response_model=WorkspaceProfileResponse)
def get_my_workspace_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_or_create_profile(
        db=db,
        current_user=current_user,
    )


@router.put("/me", response_model=WorkspaceProfileResponse)
def update_my_workspace_profile(
    data: WorkspaceProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_profile(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/presets")
def list_workspace_presets():
    return service.list_presets()


@router.post("/presets/{preset_key}", response_model=WorkspaceProfileResponse)
def apply_workspace_preset(
    preset_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.apply_preset(
        preset_key=preset_key,
        db=db,
        current_user=current_user,
    )


@router.get("/preview")
def preview_my_workspace_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = service.get_or_create_profile(
        db=db,
        current_user=current_user,
    )

    brand_name = profile.brand_name or "Marca não definida"
    project_name = profile.project_name or "AffiliateAI Pro"
    target_audience = (
        profile.default_target_audience
        or "pessoas interessadas em soluções práticas e ofertas úteis"
    )
    default_cta = profile.default_cta or "Clique no link e confira a oferta."
    tone = profile.tone or "direto"
    visual_style = profile.visual_style or "premium_dark"
    preferred_words = profile.preferred_words or []
    forbidden_words = profile.forbidden_words or []
    notes = profile.notes or ""

    preview_headline = _build_preview_headline(
        brand_name=brand_name,
        tone=tone,
    )

    preview_copy = _build_preview_copy(
        brand_name=brand_name,
        target_audience=target_audience,
        default_cta=default_cta,
        tone=tone,
        preferred_words=preferred_words,
    )

    preview_visual = _build_preview_visual(
        brand_name=brand_name,
        visual_style=visual_style,
        default_cta=default_cta,
    )

    completion_items = {
        "project_name": bool(profile.project_name),
        "brand_name": bool(profile.brand_name),
        "target_audience": bool(profile.default_target_audience),
        "default_cta": bool(profile.default_cta),
        "tone": bool(profile.tone),
        "visual_style": bool(profile.visual_style),
        "preferred_words": bool(preferred_words),
        "forbidden_words": bool(forbidden_words),
        "notes": bool(notes),
    }

    completed_count = len(
        [value for value in completion_items.values() if value is True]
    )

    total_count = len(completion_items)

    completion_percent = int((completed_count / total_count) * 100)

    return {
        "status": "ok",
        "message": "Workspace Profile carregado com sucesso.",
        "completion": {
            "completed_count": completed_count,
            "total_count": total_count,
            "completion_percent": completion_percent,
            "items": completion_items,
        },
        "workspace": {
            "id": profile.id,
            "project_name": project_name,
            "brand_name": brand_name,
            "default_target_audience": target_audience,
            "default_cta": default_cta,
            "tone": tone,
            "visual_style": visual_style,
            "language": profile.language or "pt-BR",
            "preferred_words": preferred_words,
            "forbidden_words": forbidden_words,
            "notes": notes,
        },
        "agent_preview": {
            "headline": preview_headline,
            "copy": preview_copy,
            "visual_direction": preview_visual,
            "content_rules": [
                f"Usar tom de voz: {tone}.",
                f"Usar CTA padrão: {default_cta}",
                "Evitar palavras proibidas cadastradas no Workspace.",
                "Priorizar palavras preferidas quando fizer sentido.",
                "Manter a campanha alinhada com a marca do usuário.",
            ],
        },
    }


def _build_preview_headline(
    brand_name: str,
    tone: str,
) -> str:
    if tone == "premium":
        return f"{brand_name}: campanhas mais inteligentes para vender melhor"

    if tone == "viral":
        return f"{brand_name}: esse tipo de oferta chama atenção"

    if tone == "emocional":
        return f"{brand_name}: uma mensagem simples pode conectar melhor"

    if tone == "agressivo":
        return f"{brand_name}: pare de criar campanha genérica"

    if tone == "educativo":
        return f"{brand_name}: entenda como transformar produto em campanha"

    if tone == "minimalista":
        return f"{brand_name}: clareza, oferta e ação"

    return f"{brand_name}: campanha direta, prática e pronta para ação"


def _build_preview_copy(
    brand_name: str,
    target_audience: str,
    default_cta: str,
    tone: str,
    preferred_words: list[str],
) -> str:
    preferred_text = ""

    if preferred_words:
        preferred_text = " Priorizar ideias como: " + ", ".join(preferred_words) + "."

    if tone == "premium":
        return (
            f"A marca {brand_name} deve se comunicar com {target_audience} usando uma abordagem "
            f"limpa, profissional e focada em valor real. {default_cta}{preferred_text}"
        )

    if tone == "agressivo":
        return (
            f"A marca {brand_name} deve falar direto com a dor de {target_audience}, apresentar "
            f"a solução rapidamente e conduzir para ação. {default_cta}{preferred_text}"
        )

    if tone == "educativo":
        return (
            f"A marca {brand_name} deve explicar de forma simples o problema, mostrar o produto "
            f"como solução e orientar {target_audience} até a decisão. {default_cta}{preferred_text}"
        )

    if tone == "emocional":
        return (
            f"A marca {brand_name} deve criar conexão com {target_audience}, mostrando situações "
            f"reais, benefício prático e uma chamada leve para ação. {default_cta}{preferred_text}"
        )

    return (
        f"A marca {brand_name} deve falar com {target_audience} de forma simples, direta e focada "
        f"em benefício prático. {default_cta}{preferred_text}"
    )


def _build_preview_visual(
    brand_name: str,
    visual_style: str,
    default_cta: str,
) -> str:
    style_map = {
        "premium_dark": "usar fundo escuro premium, alto contraste, elementos modernos e CTA forte",
        "clean_light": "usar fundo claro, visual limpo, textos objetivos e bastante espaço visual",
        "neon": "usar visual futurista, brilho neon, contraste forte e sensação de energia",
        "luxury": "usar estética sofisticada, elegante, com sensação de produto premium",
        "popular": "usar visual chamativo, direto, acessível e com foco em oferta",
        "automotivo": "usar visual forte, escuro, robusto, com textura mecânica e contraste vermelho/preto",
        "beleza": "usar estética elegante, suave, limpa e focada em transformação",
    }

    direction = style_map.get(
        visual_style,
        "usar visual moderno, com produto em destaque e CTA claro",
    )

    return (
        f"Direção visual para {brand_name}: {direction}. "
        f"Incluir chamada visual curta com CTA: {default_cta}"
    )