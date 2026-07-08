from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.models.product_analysis import ProductAnalysis
from app.models.user import User
from app.models.workspace_profile import WorkspaceProfile
from app.schemas.product_hunter import (
    ProductHunterRequest,
    ProductHunterResponse,
)
from app.services.ai_engine import ai_engine


class ProductHunterService:
    def analyze_product(
        self,
        data: ProductHunterRequest,
        db: Session,
        current_user: User,
    ) -> ProductHunterResponse:
        workspace = self._get_workspace_profile(
            db=db,
            current_user=current_user,
        )

        workspace_data = self._workspace_to_dict(workspace)

        clean_product_name = data.product_name.strip()
        clean_niche = data.niche.strip().lower()
        clean_marketplace = self._normalize_marketplace(data.marketplace)

        target_audience = (
            data.target_audience
            or workspace_data["default_target_audience"]
            or f"pessoas interessadas em produtos do nicho de {clean_niche}"
        )

        fallback_package = self._build_fallback_package(
            product_name=clean_product_name,
            niche=clean_niche,
            marketplace=clean_marketplace,
            average_price=data.average_price,
            commission_percent=data.commission_percent,
            target_audience=target_audience,
            product_url=data.product_url or "",
            traffic_channel=data.traffic_channel or "tiktok",
            competition_level=data.competition_level or "media",
            workspace=workspace_data,
        )

        ai_result = ai_engine.generate_json(
            system_prompt=(
                "Você é o Product Hunter Agent do AffiliateAI Pro. "
                "Sua função é analisar produtos para afiliados considerando score, decisão, "
                "público-alvo, oportunidades, riscos, ângulos de conteúdo, canais recomendados "
                "e o Workspace Profile do usuário."
            ),
            user_prompt=(
                f"Produto: {clean_product_name}\n"
                f"Nicho: {clean_niche}\n"
                f"Marketplace: {clean_marketplace}\n"
                f"Preço médio: {data.average_price}\n"
                f"Comissão: {data.commission_percent}%\n"
                f"Público-alvo: {target_audience}\n"
                f"URL do produto: {data.product_url or 'não informada'}\n"
                f"Canal: {data.traffic_channel or 'tiktok'}\n"
                f"Concorrência: {data.competition_level or 'media'}\n"
                f"Marca: {workspace_data['brand_name'] or 'não definida'}\n"
                f"Tom de voz: {workspace_data['tone']}\n"
                f"CTA padrão: {workspace_data['default_cta']}\n"
                f"Palavras preferidas: {workspace_data['preferred_words']}\n"
                f"Palavras proibidas: {workspace_data['forbidden_words']}\n"
                f"Observações: {workspace_data['notes'] or 'nenhuma'}"
            ),
            fallback_data=fallback_package,
        )

        analysis_package = ai_result.get("data", fallback_package)

        analysis_package["ai_engine"] = {
            "provider": ai_result.get("provider", "mock"),
            "model": ai_result.get("model", "affiliateai-local-mock"),
            "mode": ai_result.get("mode", "safe_mock"),
        }

        analysis_package["workspace_profile"] = workspace_data
        analysis_package["personalization_enabled"] = True

        response_data = self._build_response_data(
            product_name=clean_product_name,
            niche=clean_niche,
            marketplace=clean_marketplace,
            average_price=data.average_price,
            commission_percent=data.commission_percent,
            target_audience=target_audience,
            analysis_package=analysis_package,
            workspace=workspace_data,
        )

        response_data = self._apply_forbidden_words_to_response(
            response_data,
            workspace_data,
        )

        saved_analysis = self._save_analysis_safely(
            data=response_data,
            source_request=data,
            db=db,
            current_user=current_user,
        )

        if saved_analysis is not None:
            response_data["id"] = getattr(saved_analysis, "id", None)
            response_data["created_at"] = getattr(
                saved_analysis,
                "created_at",
                datetime.utcnow(),
            )
        else:
            response_data["id"] = None
            response_data["status"] = "completed_unsaved"
            response_data["created_at"] = datetime.utcnow()

        return ProductHunterResponse(**response_data)

    def get_product_response(
        self,
        analysis: ProductAnalysis,
    ) -> ProductHunterResponse:
        return ProductHunterResponse(
            id=self._safe_get(analysis, "id", None),
            agent="Product Hunter Agent",
            status=self._safe_get(analysis, "status", "completed"),
            product_name=self._safe_get(
                analysis,
                "product_name",
                "Produto analisado",
            ),
            niche=self._safe_get(analysis, "niche", "nicho"),
            marketplace=self._safe_get(analysis, "marketplace", "não definido"),
            average_price=float(self._safe_get(analysis, "average_price", 0) or 0),
            commission_percent=float(
                self._safe_get(analysis, "commission_percent", 0) or 0
            ),
            score=str(self._safe_get(analysis, "score", "--")),
            decision=self._safe_get(analysis, "decision", "não definido"),
            summary=self._safe_get(
                analysis,
                "summary",
                "Registro antigo carregado com dados seguros.",
            ),
            strengths=self._safe_list(
                self._safe_get(
                    analysis,
                    "strengths",
                    [
                        "Produto salvo no histórico.",
                        "Pode ser usado como referência para campanha.",
                    ],
                )
            ),
            weaknesses=self._safe_list(
                self._safe_get(
                    analysis,
                    "weaknesses",
                    [
                        "Registro antigo com alguns campos incompletos.",
                    ],
                )
            ),
            opportunities=self._safe_list(
                self._safe_get(
                    analysis,
                    "opportunities",
                    [
                        "Reanalisar o produto para gerar uma análise atualizada.",
                    ],
                )
            ),
            risks=self._safe_list(
                self._safe_get(
                    analysis,
                    "risks",
                    [
                        "Dados antigos podem não representar a oportunidade atual.",
                    ],
                )
            ),
            target_audience=self._safe_get(
                analysis,
                "target_audience",
                "Público não informado",
            ),
            content_angles=self._safe_list(
                self._safe_get(
                    analysis,
                    "content_angles",
                    [
                        "Review rápido do produto",
                        "Demonstração prática",
                        "Achadinho com foco em benefício",
                    ],
                )
            ),
            recommended_channels=self._safe_list(
                self._safe_get(
                    analysis,
                    "recommended_channels",
                    ["TikTok", "Instagram Reels", "YouTube Shorts"],
                )
            ),
            analysis_package=self._safe_dict(
                self._safe_get(
                    analysis,
                    "analysis_package",
                    {
                        "legacy_record": True,
                        "message": "Registro antigo normalizado pelo backend.",
                    },
                )
            ),
            created_at=self._safe_get(analysis, "created_at", datetime.utcnow()),
        )

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

    def _save_analysis_safely(
        self,
        data: dict[str, Any],
        source_request: ProductHunterRequest,
        db: Session,
        current_user: User,
    ) -> ProductAnalysis | None:
        possible_payload = {
            "user_id": current_user.id,
            "product_name": data["product_name"],
            "niche": data["niche"],
            "marketplace": data["marketplace"],
            "average_price": data["average_price"],
            "commission_percent": data["commission_percent"],
            "score": data["score"],
            "decision": data["decision"],
            "summary": data["summary"],
            "strengths": data["strengths"],
            "weaknesses": data["weaknesses"],
            "opportunities": data["opportunities"],
            "risks": data["risks"],
            "target_audience": data["target_audience"],
            "content_angles": data["content_angles"],
            "recommended_channels": data["recommended_channels"],
            "analysis_package": data["analysis_package"],
            "status": data["status"],
            "product_url": source_request.product_url,
            "traffic_channel": source_request.traffic_channel or "tiktok",
            "competition_level": source_request.competition_level or "media",
            "opportunity_score": data["score"],
            "opportunity_level": data["decision"],
            "recommendation": data["summary"],
            "analysis_summary": data["summary"],
        }

        try:
            model_columns = set(ProductAnalysis.__table__.columns.keys())

            payload = {
                key: value
                for key, value in possible_payload.items()
                if key in model_columns
            }

            analysis = ProductAnalysis(**payload)

            db.add(analysis)
            db.commit()
            db.refresh(analysis)

            return analysis
        except Exception:
            db.rollback()
            return None

    def _build_response_data(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
        average_price: float,
        commission_percent: float,
        target_audience: str,
        analysis_package: dict[str, Any],
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        score = str(analysis_package.get("score", "--"))
        decision = str(analysis_package.get("decision", "não definido"))

        summary = str(
            analysis_package.get(
                "summary",
                self._build_summary(
                    product_name=product_name,
                    niche=niche,
                    marketplace=marketplace,
                    target_audience=target_audience,
                    workspace=workspace,
                ),
            )
        )

        return {
            "id": None,
            "agent": "Product Hunter Agent",
            "status": "completed",
            "product_name": product_name,
            "niche": niche,
            "marketplace": marketplace,
            "average_price": average_price,
            "commission_percent": commission_percent,
            "score": score,
            "decision": decision,
            "summary": summary,
            "strengths": self._safe_list(
                analysis_package.get(
                    "strengths",
                    self._build_strengths(
                        product_name=product_name,
                        niche=niche,
                        workspace=workspace,
                    ),
                )
            ),
            "weaknesses": self._safe_list(
                analysis_package.get(
                    "weaknesses",
                    [
                        "É necessário validar preço, avaliações e disponibilidade.",
                        "A concorrência pode exigir criativos mais fortes.",
                    ],
                )
            ),
            "opportunities": self._safe_list(
                analysis_package.get(
                    "opportunities",
                    self._build_opportunities(
                        product_name=product_name,
                        niche=niche,
                        workspace=workspace,
                    ),
                )
            ),
            "risks": self._safe_list(
                analysis_package.get(
                    "risks",
                    [
                        "Produto pode ter variação de preço ou estoque.",
                        "Comissão pode mudar conforme marketplace.",
                        "Criativo fraco pode diminuir conversão.",
                    ],
                )
            ),
            "target_audience": target_audience,
            "content_angles": self._safe_list(
                analysis_package.get(
                    "content_angles",
                    self._build_content_angles(
                        product_name=product_name,
                        niche=niche,
                        target_audience=target_audience,
                        workspace=workspace,
                    ),
                )
            ),
            "recommended_channels": self._safe_list(
                analysis_package.get(
                    "recommended_channels",
                    ["TikTok", "Instagram Reels", "YouTube Shorts"],
                )
            ),
            "analysis_package": analysis_package,
            "created_at": datetime.utcnow(),
        }

    def _build_fallback_package(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
        average_price: float,
        commission_percent: float,
        target_audience: str,
        product_url: str,
        traffic_channel: str,
        competition_level: str,
        workspace: dict[str, Any],
    ) -> dict[str, Any]:
        score_number = self._calculate_score(
            average_price=average_price,
            commission_percent=commission_percent,
            marketplace=marketplace,
            competition_level=competition_level,
        )

        decision = self._decision(score_number)

        return {
            "score": str(score_number),
            "decision": decision,
            "summary": self._build_summary(
                product_name=product_name,
                niche=niche,
                marketplace=marketplace,
                target_audience=target_audience,
                workspace=workspace,
            ),
            "strengths": self._build_strengths(
                product_name=product_name,
                niche=niche,
                workspace=workspace,
            ),
            "weaknesses": [
                "É necessário validar preço, avaliações e disponibilidade.",
                "A concorrência pode exigir criativos mais fortes.",
            ],
            "opportunities": self._build_opportunities(
                product_name=product_name,
                niche=niche,
                workspace=workspace,
            ),
            "risks": [
                "Produto pode ter variação de preço ou estoque.",
                "Comissão pode mudar conforme marketplace.",
                "Criativo fraco pode diminuir conversão.",
            ],
            "target_audience": target_audience,
            "content_angles": self._build_content_angles(
                product_name=product_name,
                niche=niche,
                target_audience=target_audience,
                workspace=workspace,
            ),
            "recommended_channels": self._recommended_channels(traffic_channel),
            "workspace_profile": workspace,
            "personalization_enabled": True,
            "input_data": {
                "product_name": product_name,
                "niche": niche,
                "marketplace": marketplace,
                "average_price": average_price,
                "commission_percent": commission_percent,
                "target_audience": target_audience,
                "product_url": product_url,
                "traffic_channel": traffic_channel,
                "competition_level": competition_level,
            },
        }

    def _build_summary(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> str:
        brand_name = workspace["brand_name"]
        tone = workspace["tone"]
        cta = workspace["default_cta"]
        preferred_words = self._preferred_words_text(workspace)

        brand_part = f" para a marca {brand_name}" if brand_name else ""

        if tone == "premium":
            return (
                f"O produto {product_name}{brand_part} tem potencial no nicho de {niche}, "
                f"principalmente se for apresentado com comunicação limpa, benefício real "
                f"e posicionamento de valor para {target_audience}. Marketplace: {marketplace}. "
                f"CTA recomendado: {cta}. {preferred_words}"
            )

        if tone == "agressivo":
            return (
                f"O produto {product_name}{brand_part} pode funcionar bem no nicho de {niche} "
                f"com abordagem direta, dor clara e demonstração rápida para {target_audience}. "
                f"Marketplace: {marketplace}. CTA recomendado: {cta}. {preferred_words}"
            )

        if tone == "educativo":
            return (
                f"O produto {product_name}{brand_part} pode ser trabalhado com conteúdo explicativo, "
                f"mostrando como ele funciona, para quem serve e quais problemas resolve no nicho de {niche}. "
                f"Público: {target_audience}. CTA recomendado: {cta}. {preferred_words}"
            )

        return (
            f"O produto {product_name}{brand_part} foi analisado para o nicho de {niche}. "
            f"Ele pode funcionar bem para {target_audience}, principalmente com conteúdo direto, "
            f"visual e simples. Marketplace: {marketplace}. CTA recomendado: {cta}. {preferred_words}"
        )

    def _build_strengths(
        self,
        product_name: str,
        niche: str,
        workspace: dict[str, Any],
    ) -> list[str]:
        tone = workspace["tone"]

        strengths = [
            "Produto com boa possibilidade de demonstração em conteúdo curto.",
            "Pode ser usado em campanhas de afiliados com CTA direto.",
            "Nicho permite criação de conteúdo recorrente.",
        ]

        if workspace["brand_name"]:
            strengths.append(
                f"Pode ser alinhado com a marca {workspace['brand_name']}."
            )

        if tone == "premium":
            strengths.append("Pode ser posicionado com aparência mais profissional e limpa.")

        if tone == "educativo":
            strengths.append("Permite criar conteúdo explicativo e comparativo.")

        if tone == "agressivo":
            strengths.append("Permite comunicação forte com dor, solução e oferta.")

        return strengths

    def _build_opportunities(
        self,
        product_name: str,
        niche: str,
        workspace: dict[str, Any],
    ) -> list[str]:
        cta = workspace["default_cta"]

        return [
            f"Criar vídeo mostrando o problema que o {product_name} resolve.",
            "Testar headline com dor, curiosidade e benefício rápido.",
            "Usar prova visual, antes/depois ou demonstração prática.",
            f"Finalizar os criativos com o CTA padrão: {cta}",
            f"Gerar conteúdo recorrente no nicho de {niche}.",
        ]

    def _build_content_angles(
        self,
        product_name: str,
        niche: str,
        target_audience: str,
        workspace: dict[str, Any],
    ) -> list[str]:
        tone = workspace["tone"]

        if tone == "educativo":
            return [
                f"Como o {product_name} funciona na prática",
                f"Para quem o {product_name} faz sentido",
                f"3 benefícios do {product_name} no nicho de {niche}",
                f"O que analisar antes de comprar {product_name}",
            ]

        if tone == "premium":
            return [
                f"Por que o {product_name} pode ser uma escolha mais inteligente",
                f"Review limpo e direto do {product_name}",
                f"Benefícios reais do {product_name}",
                f"Como o {product_name} pode ajudar {target_audience}",
            ]

        if tone == "agressivo":
            return [
                f"Você ainda não testou o {product_name}?",
                f"O erro de ignorar esse tipo de produto no nicho de {niche}",
                f"Veja o que o {product_name} pode resolver",
                f"Oferta direta para quem quer praticidade",
            ]

        return [
            f"Review honesto do {product_name}",
            f"Vale a pena comprar {product_name}?",
            f"Achadinho para quem está no nicho de {niche}",
            f"Como usar {product_name} no dia a dia",
        ]

    def _calculate_score(
        self,
        average_price: float,
        commission_percent: float,
        marketplace: str,
        competition_level: str,
    ) -> int:
        score = 45

        if commission_percent >= 15:
            score += 22
        elif commission_percent >= 10:
            score += 16
        elif commission_percent >= 5:
            score += 9
        else:
            score += 4

        if 30 <= average_price <= 200:
            score += 18
        elif 200 < average_price <= 500:
            score += 12
        elif 1 <= average_price < 30:
            score += 8
        elif average_price > 500:
            score += 5

        if marketplace in ["shopee", "mercado_livre", "amazon"]:
            score += 8

        if marketplace in ["hotmart", "kiwify", "monetizze"]:
            score += 10

        normalized_competition = competition_level.strip().lower()

        if normalized_competition in ["baixa", "baixo", "low"]:
            score += 10
        elif normalized_competition in ["media", "média", "medio", "médio"]:
            score += 5
        elif normalized_competition in ["alta", "alto", "high"]:
            score -= 4

        return int(max(0, min(score, 100)))

    def _decision(self, score: int) -> str:
        if score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if score >= 70:
            return "BOA OPORTUNIDADE"

        if score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "VALIDAR MELHOR"

    def _recommended_channels(self, traffic_channel: str) -> list[str]:
        channel = traffic_channel.strip().lower()

        labels = {
            "tiktok": "TikTok",
            "instagram": "Instagram Reels",
            "youtube_shorts": "YouTube Shorts",
            "whatsapp": "WhatsApp",
            "pinterest": "Pinterest",
            "facebook_ads": "Facebook Ads",
            "google": "Google",
        }

        main_channel = labels.get(channel, "TikTok")

        channels = [main_channel, "Instagram Reels", "YouTube Shorts"]

        unique_channels = []

        for item in channels:
            if item not in unique_channels:
                unique_channels.append(item)

        return unique_channels

    def _normalize_marketplace(self, value: str) -> str:
        normalized = value.strip().lower().replace(" ", "_").replace("-", "_")

        aliases = {
            "shopee": "shopee",
            "mercado_livre": "mercado_livre",
            "mercadolivre": "mercado_livre",
            "amazon": "amazon",
            "hotmart": "hotmart",
            "kiwify": "kiwify",
            "monetizze": "monetizze",
            "outro": "outro",
        }

        return aliases.get(normalized, normalized or "outro")

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
        data["summary"] = self._apply_forbidden_words(data["summary"], workspace)
        data["strengths"] = [
            self._apply_forbidden_words(item, workspace)
            for item in data["strengths"]
        ]
        data["weaknesses"] = [
            self._apply_forbidden_words(item, workspace)
            for item in data["weaknesses"]
        ]
        data["opportunities"] = [
            self._apply_forbidden_words(item, workspace)
            for item in data["opportunities"]
        ]
        data["risks"] = [
            self._apply_forbidden_words(item, workspace)
            for item in data["risks"]
        ]
        data["content_angles"] = [
            self._apply_forbidden_words(item, workspace)
            for item in data["content_angles"]
        ]

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