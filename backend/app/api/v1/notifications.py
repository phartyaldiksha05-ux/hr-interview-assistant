from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.schemas.push_subscription import (
    PushSubscriptionCreate,
    PushSubscriptionDelete,
    PushSubscriptionStatus,
)

router = APIRouter(prefix="/notifications/push", tags=["push notifications"])


@router.post("/subscribe", response_model=PushSubscriptionStatus)
def subscribe(
    payload: PushSubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = db.scalar(
        select(PushSubscription).where(PushSubscription.endpoint == payload.endpoint)
    )

    if subscription is None:
        subscription = PushSubscription(
            user_id=current_user.id,
            endpoint=payload.endpoint,
            p256dh=payload.keys.p256dh,
            auth=payload.keys.auth,
        )
        db.add(subscription)
    elif subscription.user_id != current_user.id:
        # Do not allow one authenticated user to take over a push endpoint
        # that is currently registered to another account.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Push subscription is already registered to another account",
        )
    else:
        # The same browser may refresh/recreate its subscription keys.
        subscription.p256dh = payload.keys.p256dh
        subscription.auth = payload.keys.auth

    db.commit()

    device_count = db.scalar(
        select(func.count())
        .select_from(PushSubscription)
        .where(PushSubscription.user_id == current_user.id)
    ) or 0

    return PushSubscriptionStatus(enabled=device_count > 0, device_count=device_count)


@router.delete("/subscribe", response_model=PushSubscriptionStatus)
def unsubscribe(
    payload: PushSubscriptionDelete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = db.scalar(
        select(PushSubscription).where(
            PushSubscription.endpoint == payload.endpoint,
            PushSubscription.user_id == current_user.id,
        )
    )

    if subscription is not None:
        db.delete(subscription)
        db.commit()

    device_count = db.scalar(
        select(func.count())
        .select_from(PushSubscription)
        .where(PushSubscription.user_id == current_user.id)
    ) or 0

    return PushSubscriptionStatus(enabled=device_count > 0, device_count=device_count)


@router.get("/status", response_model=PushSubscriptionStatus)
def status_(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device_count = db.scalar(
        select(func.count())
        .select_from(PushSubscription)
        .where(PushSubscription.user_id == current_user.id)
    ) or 0

    return PushSubscriptionStatus(enabled=device_count > 0, device_count=device_count)
