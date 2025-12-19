from sqlalchemy import case, or_, func
from sqlalchemy.dialects.postgresql import JSONB

from ..models import (
    Case,
    Attachment,
    Contract,
    ContractAttachment,
    Comment,
    CaseEvent,
)

HANDLED_EVENT_TYPES = (
    "case.assigned",
    "case.reassigned",
    "case.released",
    "case.expired",
    "case.returned_to_pipeline",
    "case.assignment_cleared",
    "case.reopened",
)


def build_handled_case_expression(db):
    assignment_history_jsonb = Case.assignment_history.cast(JSONB)
    history_len = case(
        (
            func.jsonb_typeof(assignment_history_jsonb) == "array",
            func.jsonb_array_length(assignment_history_jsonb),
        ),
        else_=0,
    )
    has_assignment_history = history_len > 0
    has_assignment_event = db.query(CaseEvent.id).filter(
        CaseEvent.case_id == Case.id,
        CaseEvent.type.in_(HANDLED_EVENT_TYPES),
    ).exists()
    has_attachment = db.query(Attachment.id).filter(
        Attachment.case_id == Case.id
    ).exists()
    has_contract_attachment = db.query(ContractAttachment.id).filter(
        ContractAttachment.case_id == Case.id
    ).exists()
    has_comment = db.query(Comment.id).filter(
        Comment.case_id == Case.id,
        Comment.deleted_at.is_(None),
    ).exists()
    has_contract = db.query(Contract.id).filter(
        Contract.case_id == Case.id
    ).exists()

    return or_(
        func.coalesce(Case.status, "novo") != "novo",
        Case.assigned_user_id.isnot(None),
        Case.assigned_at.isnot(None),
        has_assignment_history,
        has_assignment_event,
        has_attachment,
        has_contract_attachment,
        has_comment,
        has_contract,
    )


def get_latest_handled_case_for_clients(db, client_ids):
    if not client_ids:
        return None

    handled_expr = build_handled_case_expression(db)
    return (
        db.query(Case)
        .filter(Case.client_id.in_(client_ids))
        .filter(handled_expr)
        .order_by(Case.id.desc())
        .first()
    )
