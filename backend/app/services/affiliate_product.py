from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.affiliate_product import AffiliateProduct
from app.models.user import User
from app.schemas.affiliate_product import (
    AffiliateProductCreateRequest,
    AffiliateProductUpdateRequest,
)


class AffiliateProductService:
    def create_product(
        self,
        data: AffiliateProductCreateRequest,
        db: Session,
        current_user: User,
    ) -> AffiliateProduct:
        product = AffiliateProduct(
            user_id=current_user.id,
            product_name=data.product_name.strip(),
            niche=data.niche.strip().lower(),
            marketplace=data.marketplace,
            product_url=data.product_url,
            affiliate_link=data.affiliate_link,
            average_price=data.average_price,
            commission_percent=data.commission_percent,
            status=data.status,
            notes=data.notes,
            is_active=True,
        )

        db.add(product)
        db.commit()
        db.refresh(product)

        return product

    def create_demo_products(
        self,
        db: Session,
        current_user: User,
    ) -> list[AffiliateProduct]:
        demo_products = self._get_demo_products_data()

        created_products: list[AffiliateProduct] = []

        for item in demo_products:
            existing_product = (
                db.query(AffiliateProduct)
                .filter(AffiliateProduct.user_id == current_user.id)
                .filter(AffiliateProduct.product_name == item["product_name"])
                .first()
            )

            if existing_product is not None:
                created_products.append(existing_product)
                continue

            product = AffiliateProduct(
                user_id=current_user.id,
                product_name=item["product_name"],
                niche=item["niche"],
                marketplace=item["marketplace"],
                product_url=item["product_url"],
                affiliate_link=item["affiliate_link"],
                average_price=item["average_price"],
                commission_percent=item["commission_percent"],
                status=item["status"],
                notes=item["notes"],
                is_active=True,
            )

            db.add(product)
            created_products.append(product)

        db.commit()

        for product in created_products:
            db.refresh(product)

        return created_products

    def delete_demo_products(
        self,
        db: Session,
        current_user: User,
    ) -> dict:
        demo_names = [
            item["product_name"]
            for item in self._get_demo_products_data()
        ]

        demo_products = (
            db.query(AffiliateProduct)
            .filter(AffiliateProduct.user_id == current_user.id)
            .filter(AffiliateProduct.product_name.in_(demo_names))
            .all()
        )

        deleted_count = len(demo_products)

        for product in demo_products:
            db.delete(product)

        db.commit()

        return {
            "status": "deleted",
            "deleted_count": deleted_count,
            "message": f"{deleted_count} produto(s) demo removido(s) com sucesso.",
        }

    def list_products(
        self,
        db: Session,
        current_user: User,
        only_active: bool = True,
    ) -> list[AffiliateProduct]:
        query = db.query(AffiliateProduct).filter(
            AffiliateProduct.user_id == current_user.id
        )

        if only_active:
            query = query.filter(AffiliateProduct.is_active == True)

        return query.order_by(AffiliateProduct.created_at.desc()).all()

    def get_best_product(
        self,
        db: Session,
        current_user: User,
    ) -> AffiliateProduct:
        products = (
            db.query(AffiliateProduct)
            .filter(AffiliateProduct.user_id == current_user.id)
            .filter(AffiliateProduct.is_active == True)
            .all()
        )

        if not products:
            raise HTTPException(
                status_code=404,
                detail="Nenhum produto ativo encontrado no catálogo.",
            )

        ranked_products = sorted(
            products,
            key=self._calculate_auto_pick_score,
            reverse=True,
        )

        return ranked_products[0]

    def get_product(
        self,
        product_id: int,
        db: Session,
        current_user: User,
    ) -> AffiliateProduct:
        product = (
            db.query(AffiliateProduct)
            .filter(AffiliateProduct.id == product_id)
            .filter(AffiliateProduct.user_id == current_user.id)
            .first()
        )

        if product is None:
            raise HTTPException(
                status_code=404,
                detail="Produto não encontrado.",
            )

        return product

    def update_product(
        self,
        product_id: int,
        data: AffiliateProductUpdateRequest,
        db: Session,
        current_user: User,
    ) -> AffiliateProduct:
        product = self.get_product(
            product_id=product_id,
            db=db,
            current_user=current_user,
        )

        update_data = data.model_dump(exclude_unset=True)

        if "product_name" in update_data and update_data["product_name"] is not None:
            product.product_name = update_data["product_name"].strip()

        if "niche" in update_data and update_data["niche"] is not None:
            product.niche = update_data["niche"].strip().lower()

        if "marketplace" in update_data and update_data["marketplace"] is not None:
            product.marketplace = update_data["marketplace"]

        if "product_url" in update_data:
            product.product_url = update_data["product_url"]

        if "affiliate_link" in update_data:
            product.affiliate_link = update_data["affiliate_link"]

        if "average_price" in update_data and update_data["average_price"] is not None:
            product.average_price = update_data["average_price"]

        if (
            "commission_percent" in update_data
            and update_data["commission_percent"] is not None
        ):
            product.commission_percent = update_data["commission_percent"]

        if "status" in update_data and update_data["status"] is not None:
            product.status = update_data["status"]

        if "notes" in update_data:
            product.notes = update_data["notes"]

        if "is_active" in update_data and update_data["is_active"] is not None:
            product.is_active = update_data["is_active"]

        db.add(product)
        db.commit()
        db.refresh(product)

        return product

    def delete_product(
        self,
        product_id: int,
        db: Session,
        current_user: User,
    ) -> dict:
        product = self.get_product(
            product_id=product_id,
            db=db,
            current_user=current_user,
        )

        db.delete(product)
        db.commit()

        return {
            "status": "deleted",
            "message": "Produto removido com sucesso.",
        }

    def _get_demo_products_data(self) -> list[dict]:
        return [
            {
                "product_name": "Escova secadora 3 em 1",
                "niche": "beleza",
                "marketplace": "shopee",
                "product_url": "https://exemplo.com/produto/escova-secadora",
                "affiliate_link": "https://exemplo.com/afiliado/escova-secadora",
                "average_price": 119.90,
                "commission_percent": 12,
                "status": "afiliado",
                "notes": "Produto visual, bom para antes e depois, forte para TikTok e Reels.",
            },
            {
                "product_name": "Mini processador elétrico",
                "niche": "casa",
                "marketplace": "shopee",
                "product_url": "https://exemplo.com/produto/mini-processador",
                "affiliate_link": "https://exemplo.com/afiliado/mini-processador",
                "average_price": 89.90,
                "commission_percent": 13,
                "status": "afiliado",
                "notes": "Produto prático para cozinha, ótimo para demonstração rápida.",
            },
            {
                "product_name": "Escova removedora de pelos pet",
                "niche": "pet",
                "marketplace": "mercado_livre",
                "product_url": "https://exemplo.com/produto/escova-pet",
                "affiliate_link": "https://exemplo.com/afiliado/escova-pet",
                "average_price": 49.90,
                "commission_percent": 10,
                "status": "afiliado",
                "notes": "Boa dor para donos de pets, fácil de mostrar resultado visual.",
            },
            {
                "product_name": "Mini elástico para treino",
                "niche": "fitness",
                "marketplace": "amazon",
                "product_url": "https://exemplo.com/produto/mini-elastico",
                "affiliate_link": "https://exemplo.com/afiliado/mini-elastico",
                "average_price": 39.90,
                "commission_percent": 11,
                "status": "afiliado",
                "notes": "Produto barato, impulsivo e bom para treino em casa.",
            },
            {
                "product_name": "Aspirador portátil automotivo",
                "niche": "automotivo",
                "marketplace": "amazon",
                "product_url": "https://exemplo.com/produto/aspirador-automotivo",
                "affiliate_link": "https://exemplo.com/afiliado/aspirador-automotivo",
                "average_price": 99.90,
                "commission_percent": 10,
                "status": "afiliado",
                "notes": "Produto visual para antes/depois na limpeza do carro.",
            },
        ]

    def _calculate_auto_pick_score(
        self,
        product: AffiliateProduct,
    ) -> float:
        score = 0

        if product.status == "afiliado":
            score += 40

        if product.affiliate_link:
            score += 25

        if product.product_url:
            score += 8

        if product.commission_percent:
            score += product.commission_percent * 2.5

        price = product.average_price or 0

        if 30 <= price <= 200:
            score += 20
        elif 200 < price <= 500:
            score += 12
        elif 1 <= price < 30:
            score += 8
        elif price > 500:
            score += 4

        if product.marketplace in ["shopee", "mercado_livre", "amazon"]:
            score += 8

        if product.marketplace in ["hotmart", "kiwify", "monetizze"]:
            score += 10

        return score