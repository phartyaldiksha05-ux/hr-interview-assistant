"""add email otp verification fields

Revision ID: f0d9e4168a14
Revises: 107146ecb220
Create Date: 2026-09-30 20:26:24.589557

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f0d9e4168a14"
down_revision: Union[str, None] = "107146ecb220"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Existing users are treated as already verified.
    op.add_column(
        "users",
        sa.Column(
            "email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "otp_hash",
            sa.String(length=255),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "otp_expires_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "otp_last_sent_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "users",
        sa.Column(
            "otp_resend_count",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    # Remove migration-time defaults after existing rows are populated.
    op.alter_column(
        "users",
        "email_verified",
        server_default=None,
    )

    op.alter_column(
        "users",
        "otp_resend_count",
        server_default=None,
    )


def downgrade() -> None:
    op.drop_column("users", "otp_resend_count")
    op.drop_column("users", "otp_last_sent_at")
    op.drop_column("users", "otp_expires_at")
    op.drop_column("users", "otp_hash")
    op.drop_column("users", "email_verified")