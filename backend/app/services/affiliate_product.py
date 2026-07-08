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