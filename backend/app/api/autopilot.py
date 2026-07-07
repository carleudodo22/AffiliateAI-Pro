from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.schemas.autopilot import AutopilotRequest, AutopilotResponse


router = APIRouter(
    prefix="/api/autopilot",
    tags=["Affiliate Autopilot"],
)


@router.post("/run", response_model=AutopilotResponse)
def run_autopilot(
    data: AutopilotRequest,
    current_user: User = Depends(get_current_user),
):
    niche = data.niche.strip().lower()
    audience = data.target_audience or f"pessoas interessadas em {niche}"

    product_map = {
        "beleza": {
            "product": "escova secadora",
            "marketplace": "shopee",
            "score": 84,
        },
        "fitness": {
            "product": "mini elástico para treino",
            "marketplace": "mercado_livre",
            "score": 79,
        },
        "automotivo": {
            "product": "aspirador portátil automotivo",
            "marketplace": "amazon",
            "score": 76,
        },
        "casa": {
            "product": "mini processador elétrico",
            "marketplace": "shopee",
            "score": 82,
        },
    }

    selected = product_map.get(
        niche,
        {
            "product": f"produto tendência de {niche}",
            "marketplace": "generic",
            "score": 72,
        },
    )

    score = selected["score"]

    if score >= 85:
        decision = "EXCELENTE OPORTUNIDADE"
    elif score >= 70:
        decision = "BOA OPORTUNIDADE"
    elif score >= 55:
        decision = "OPORTUNIDADE MODERADA"
    else:
        decision = "VALIDAR MELHOR"

    product = selected["product"]

    return AutopilotResponse(
        agent="Affiliate Autopilot",
        status="completed",
        niche=niche,
        selected_product=product,
        marketplace=selected["marketplace"],
        score=score,
        decision=decision,
        strategy=(
            f"Posicionar {product} como uma solução prática para {audience}. "
            f"Usar conteúdo visual, demonstração rápida, dor clara e CTA direto no canal {data.main_channel}."
        ),
        headline=f"Conheça o {product}",
        short_copy=(
            f"Você ainda perde tempo tentando resolver isso do jeito difícil? "
            f"O {product} pode facilitar sua rotina. Clique e confira a oferta."
        ),
        video_script=(
            f"CENA 1: Mostre o problema do público em {niche}. "
            f"CENA 2: Apresente o {product}. "
            f"CENA 3: Mostre 3 benefícios rápidos. "
            f"CENA 4: Finalize com CTA: 'Clique no link e confira'."
        ),
        image_brief=(
            f"Imagem vertical 9:16 profissional para afiliado. Produto: {product}. "
            f"Nicho: {niche}. Estilo: {data.campaign_style}. Fundo moderno, produto em destaque, texto curto e CTA forte."
        ),
        voiceover_script=(
            f"Você sabia que muita gente em {niche} ainda sofre com isso? "
            f"O {product} pode facilitar sua rotina e entregar mais praticidade no dia a dia."
        ),
        checklist=[
            "Confirmar disponibilidade do produto.",
            "Confirmar comissão da plataforma.",
            "Gerar imagem final.",
            "Gerar vídeo final.",
            "Adicionar link de afiliado.",
            "Postar no canal escolhido.",
        ],
    )