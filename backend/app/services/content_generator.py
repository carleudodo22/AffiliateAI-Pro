from sqlalchemy.orm import Session

from app.models.content_generation import ContentGeneration
from app.models.user import User
from app.schemas.content_generator import (
    ContentGeneratorRequest,
    ContentGeneratorResponse,
    GeneratedContentPackage,
)


class ContentGeneratorService:
    def generate_content(
        self,
        data: ContentGeneratorRequest,
        db: Session | None = None,
        current_user: User | None = None,
    ) -> ContentGeneratorResponse:
        niche = data.niche.strip().lower()
        product_name = data.product_name.strip().lower()

        content = GeneratedContentPackage(
            headline=f"Conheça o {product_name}",
            product_description=(
                f"O {product_name} é uma solução prática para o nicho de {niche}. "
                "Ideal para criar desejo, demonstrar valor e gerar conversão."
            ),
            short_sales_copy=(
                f"Você ainda perde tempo procurando solução? O {product_name} pode "
                "facilitar sua rotina. Clique e confira a oferta."
            ),
            video_hooks=[
                f"Você precisa ver isso antes de comprar qualquer produto de {niche}.",
                f"Testei o {product_name} e olha o resultado.",
                f"O erro que muita gente comete antes de escolher {product_name}.",
            ],
            video_scripts=[
                (
                    f"CENA 1: Mostre o problema. "
                    f"CENA 2: Apresente o {product_name}. "
                    f"CENA 3: Mostre o benefício. "
                    f"CENA 4: Chame para clicar no link."
                ),
                (
                    f"Comece com uma pergunta forte sobre {niche}. "
                    f"Mostre o {product_name} em uso. "
                    f"Finalize com uma chamada direta para a oferta."
                ),
            ],
            instagram_caption=(
                f"Se você busca praticidade em {niche}, conheça o {product_name}. "
                "Uma opção simples para resolver uma dor real do dia a dia."
            ),
            tiktok_caption=(
                f"Esse {product_name} pode facilitar sua rotina 👀 "
                "#achadinhos #afiliados #produto"
            ),
            whatsapp_message=(
                f"Olha esse produto que encontrei: {product_name}. "
                f"Ele é voltado para quem busca solução em {niche}. Dá uma olhada."
            ),
            ad_copy=(
                f"Conheça o {product_name}. Uma solução prática para quem procura "
                f"resultado no nicho de {niche}. Clique e confira."
            ),
            ctas=[
                "Clique no link e confira.",
                "Veja a oferta disponível.",
                "Garanta o seu enquanto está disponível.",
            ],
            hashtags=[
                "#afiliados",
                "#marketingdigital",
                "#achadinhos",
                "#produto",
                f"#{niche.replace(' ', '')}",
                f"#{product_name.replace(' ', '')}",
            ],
        )

        response = ContentGeneratorResponse(
            agent="Content Generator",
            source_analysis_id=data.analysis_id,
            niche=niche,
            product_name=product_name,
            platform=data.platform,
            tone=data.tone,
            objective=data.objective,
            content=content,
        )

        if db is not None and current_user is not None:
            saved_content = ContentGeneration(
                user_id=current_user.id,
                source_analysis_id=data.analysis_id,
                niche=niche,
                product_name=product_name,
                marketplace=data.marketplace,
                main_channel=data.main_channel,
                platform=data.platform,
                tone=data.tone,
                objective=data.objective,
                target_audience=data.target_audience,
                generated_data=response.model_dump(),
            )

            db.add(saved_content)
            db.commit()
            db.refresh(saved_content)

            response.id = saved_content.id

        return response