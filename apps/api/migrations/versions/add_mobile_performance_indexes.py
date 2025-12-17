"""Add database indexes for mobile queries performance"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_mobile_performance_indexes'
down_revision = 'a8452ce612ad'
branch_labels = None
depends_on = None

def upgrade():
    # Add index on mobile_simulations.user_id for faster joins
    op.create_index(
        'ix_mobile_simulations_user_id',
        'mobile_simulations',
        ['user_id']
    )
    
    # Add index on mobile_simulations.status for faster filtering
    op.create_index(
        'ix_mobile_simulations_status',
        'mobile_simulations',
        ['status']
    )
    
    # Add index on mobile_simulations.created_at for faster date filtering
    op.create_index(
        'ix_mobile_simulations_created_at',
        'mobile_simulations',
        ['created_at']
    )
    
    # Add index on users.role for faster mobile_client filtering
    op.create_index(
        'ix_users_role',
        'users',
        ['role']
    )

def downgrade():
    op.drop_index('ix_mobile_simulations_user_id', table_name='mobile_simulations')
    op.drop_index('ix_mobile_simulations_status', table_name='mobile_simulations')
    op.drop_index('ix_mobile_simulations_created_at', table_name='mobile_simulations')
    op.drop_index('ix_users_role', table_name='users')
