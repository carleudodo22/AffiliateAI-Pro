from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.affiliate_product import (
    AffiliateProductCreateRequest,
    AffiliateProductResponse,
    AffiliateProductUpdateRequest,
)
from app.services.affiliate_product import AffiliateProductService


router = APIRouter(
    prefix="/api/affiliate-products",
    tags=["Affiliate Products"],
)

service = AffiliateProductService()


@router.post("/", response_model=AffiliateProductResponse)
def create_affiliate_product(
    data: AffiliateProductCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_product(
        data=data,
        db=db,
        current_user=current_user,
    )


@router.get("/", response_model=list[AffiliateProductResponse])
def list_affiliate_products(
    only_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.list_products(
        db=db,
        current_user=current_user,
        only_active=only_active,
    )


@router.get("/auto-pick", response_model=AffiliateProductResponse)
def auto_pick_affiliate_product(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_best_product(
        db=db,
        current_user=current_user,
    )


@router.get("/{product_id}", response_model=AffiliateProductResponse)
def get_affiliate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_product(
        product_id=product_id,
        db=db,
        current_user=current_user,
    )


@router.put("/{product_id}", response_model=AffiliateProductResponse)
def update_affiliate_product(
    product_id: int,
    data: AffiliateProductUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_product(
        product_id=product_id,
        data=data,
        db=db,
        current_user=current_user,
    )


@router.delete("/{product_id}")
def delete_affiliate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_product(
        product_id=product_id,
        db=db,
        current_user=current_user,
    )