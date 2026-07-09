from datetime import datetime
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.campaign_package import CampaignPackageRun
from app.models.user import User
from app.schemas.campaign_package import (
    CampaignPackageRequest,
    CampaignPackageResponse,
    CampaignPackageUpdateRequest,
)


class CampaignPackageService:
    def create_package(
        self,
        data: CampaignPackageRequest,
        db: Session,
        current_user: User,
    ) -> CampaignPackageResponse:
        product_name = data.product_name.strip()
        niche = data.niche.strip().lower()
        marketplace = data.marketplace.strip().lower()

        score = self._calculate_score(
            average_price=data.average_price,
            commission_percent=data.commission_percent,
            marketplace=marketplace,
        )

        decision = self._decision(score)

        package_text = self._build_package_text(
            product_name=product_name,
            niche=niche,
            marketplace=marketplace,
            average_price=data.average_price,
            commission_percent=data.commission_percent,
            target_audience=data.target_audience,
            objective=data.objective,
            main_channel=data.main_channel,
            campaign_style=data.campaign_style,
            budget_style=data.budget_style,
            score=score,
            decision=decision,
        )

        source_data = {
            "source": "campaign_package_manual",
            "generated_at": datetime.utcnow().isoformat(),
            "product": {
                "product_name": product_name,
                "niche": niche,
                "marketplace": marketplace,
                "average_price": data.average_price,
                "commission_percent": data.commission_percent,
                "product_url": data.product_url,
                "affiliate_link": data.affiliate_link,
            },
            "campaign": {
                "target_audience": data.target_audience,
                "objective": data.objective,
                "main_channel": data.main_channel,
                "campaign_style": data.campaign_style,
                "budget_style": data.budget_style,
            },
            "analysis": {
                "score": str(score),
                "decision": decision,
            },
        }

        saved_package = CampaignPackageRun(
            user_id=current_user.id,
            product_name=product_name,
            niche=niche,
            marketplace=marketplace,
            score=str(score),
            decision=decision,
            package_text=package_text,
            source_data=source_data,
            status="saved",
        )

        db.add(saved_package)
        db.commit()
        db.refresh(saved_package)

        return self.get_package_response(saved_package)

    def update_package(
        self,
        package_id: int,
        data: CampaignPackageUpdateRequest,
        db: Session,
        current_user: User,
    ) -> CampaignPackageResponse:
        package = self._get_user_package(
            package_id=package_id,
            db=db,
            current_user=current_user,
        )

        if data.product_name is not None:
            clean_product_name = data.product_name.strip()

            if clean_product_name:
                package.product_name = clean_product_name

        if data.niche is not None:
            clean_niche = data.niche.strip().lower()

            if clean_niche:
                package.niche = clean_niche

        if data.marketplace is not None:
            clean_marketplace = data.marketplace.strip().lower()

            if clean_marketplace:
                package.marketplace = clean_marketplace

        if data.score is not None:
            clean_score = str(data.score).strip()

            if clean_score:
                package.score = clean_score

        if data.decision is not None:
            clean_decision = data.decision.strip()

            if clean_decision:
                package.decision = clean_decision

        if data.package_text is not None:
            package.package_text = data.package_text.strip()

        if data.status is not None:
            clean_status = data.status.strip().lower()

            if clean_status:
                package.status = clean_status

        current_source_data = package.source_data or {}

        update_log = {
            "updated": True,
            "updated_at": datetime.utcnow().isoformat(),
            "updated_fields": [
                key
                for key, value in data.model_dump().items()
                if value is not None
            ],
        }

        if data.source_data is not None:
            package.source_data = {
                **current_source_data,
                **data.source_data,
                "last_update": update_log,
            }
        else:
            package.source_data = {
                **current_source_data,
                "last_update": update_log,
            }

        db.add(package)
        db.commit()
        db.refresh(package)

        return self.get_package_response(package)

    def duplicate_package(
        self,
        package_id: int,
        db: Session,
        current_user: User,
    ) -> CampaignPackageResponse:
        original = self._get_user_package(
            package_id=package_id,
            db=db,
            current_user=current_user,
        )

        original_source_data = original.source_data or {}

        duplicated_source_data: dict[str, Any] = {
            **original_source_data,
            "duplicated": True,
            "duplicated_from_id": original.id,
            "duplicated_at": datetime.utcnow().isoformat(),
        }

        duplicated_package_text = self._build_duplicate_text(
            original_text=original.package_text or "",
            original_id=original.id,
        )

        duplicated = CampaignPackageRun(
            user_id=current_user.id,
            product_name=f"{original.product_name} (cópia)",
            niche=original.niche,
            marketplace=original.marketplace,
            score=original.score,
            decision=original.decision,
            package_text=duplicated_package_text,
            source_data=duplicated_source_data,
            status="saved",
        )

        db.add(duplicated)
        db.commit()
        db.refresh(duplicated)

        return self.get_package_response(duplicated)

    def get_package_response(
        self,
        package: CampaignPackageRun,
    ) -> CampaignPackageResponse:
        return CampaignPackageResponse(
            id=package.id,
            product_name=package.product_name,
            niche=package.niche,
            marketplace=package.marketplace,
            score=package.score,
            decision=package.decision,
            package_text=package.package_text,
            source_data=package.source_data or {},
            status=package.status,
            created_at=package.created_at,
        )

    def _get_user_package(
        self,
        package_id: int,
        db: Session,
        current_user: User,
    ) -> CampaignPackageRun:
        package = (
            db.query(CampaignPackageRun)
            .filter(CampaignPackageRun.id == package_id)
            .filter(CampaignPackageRun.user_id == current_user.id)
            .first()
        )

        if package is None:
            raise HTTPException(
                status_code=404,
                detail="Campaign Package não encontrado.",
            )

        return package

    def _calculate_score(
        self,
        average_price: float,
        commission_percent: float,
        marketplace: str,
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

        return int(max(0, min(score, 100)))

    def _decision(
        self,
        score: int,
    ) -> str:
        if score >= 85:
            return "EXCELENTE OPORTUNIDADE"

        if score >= 70:
            return "BOA OPORTUNIDADE"

        if score >= 55:
            return "OPORTUNIDADE MODERADA"

        return "VALIDAR MELHOR"

    def _build_package_text(
        self,
        product_name: str,
        niche: str,
        marketplace: str,
        average_price: float,
        commission_percent: float,
        target_audience: str,
        objective: str,
        main_channel: str,
        campaign_style: str,
        budget_style: str,
        score: int,
        decision: str,
    ) -> str:
        return f"""
AFFILIATEAI PRO — CAMPAIGN PACKAGE

PRODUTO
Nome: {product_name}
Nicho: {niche}
Marketplace: {marketplace}
Preço médio: R$ {average_price}
Comissão: {commission_percent}%

ANÁLISE
Score: {score}
Decisão: {decision}

CAMPANHA
Público-alvo: {target_audience}
Objetivo: {objective}
Canal principal: {main_channel}
Estilo de campanha: {campaign_style}
Orçamento: {budget_style}

COPY BASE
Headline: Conheça o {product_name}

Copy curta:
Se você procura uma solução prática no nicho de {niche}, o {product_name} pode ser uma boa opção. Mostre o benefício, use demonstração visual e finalize com uma chamada clara para ação.

ROTEIRO CURTO
CENA 1: Mostre uma dor comum do público.
CENA 2: Apresente o {product_name}.
CENA 3: Mostre 3 benefícios rápidos.
CENA 4: Finalize com CTA para o link.

BRIEFING VISUAL
Criar arte vertical 9:16 com o produto em destaque, texto curto, fundo moderno e CTA visível.

CHECKLIST
- Validar disponibilidade do produto.
- Confirmar comissão.
- Conferir link de afiliado.
- Criar imagem principal.
- Criar vídeo curto.
- Publicar no canal escolhido.
- Acompanhar cliques e conversões.
""".strip()

    def _build_duplicate_text(
        self,
        original_text: str,
        original_id: int,
    ) -> str:
        header = f"""
CÓPIA DE CAMPAIGN PACKAGE

Este pacote foi duplicado a partir do Campaign Package ID {original_id}.
Use esta cópia para editar, adaptar ou reaproveitar a campanha sem alterar o original.

---
""".strip()

        if not original_text:
            return header

        return f"{header}\n\n{original_text}"