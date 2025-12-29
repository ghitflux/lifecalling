from sqlalchemy import case, or_, func, and_, not_
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


def build_handled_case_expression(db, source_list=None):
    normalized_sources = [s for s in (source_list or []) if s]

    def apply_source_filter(query, case_id_column):
        if not normalized_sources:
            return query
        return query.join(Case, Case.id == case_id_column).filter(
            Case.source.in_(normalized_sources)
        )

    activity_ids_union = (
        apply_source_filter(
            db.query(CaseEvent.case_id.label("case_id")).filter(
                CaseEvent.case_id.isnot(None),
                CaseEvent.type.in_(HANDLED_EVENT_TYPES),
            ),
            CaseEvent.case_id,
        )
        .union_all(
            apply_source_filter(
                db.query(Attachment.case_id.label("case_id")).filter(
                    Attachment.case_id.isnot(None)
                ),
                Attachment.case_id,
            ),
            apply_source_filter(
                db.query(ContractAttachment.case_id.label("case_id")).filter(
                    ContractAttachment.case_id.isnot(None)
                ),
                ContractAttachment.case_id,
            ),
            apply_source_filter(
                db.query(Comment.case_id.label("case_id")).filter(
                    Comment.case_id.isnot(None),
                    Comment.deleted_at.is_(None),
                ),
                Comment.case_id,
            ),
            apply_source_filter(
                db.query(Contract.case_id.label("case_id")).filter(
                    Contract.case_id.isnot(None)
                ),
                Contract.case_id,
            ),
        )
        .subquery()
    )
    activity_ids_query = db.query(activity_ids_union.c.case_id)

    assignment_history_jsonb = Case.assignment_history.cast(JSONB)
    history_len = case(
        (
            func.jsonb_typeof(assignment_history_jsonb) == "array",
            func.jsonb_array_length(assignment_history_jsonb),
        ),
        else_=0,
    )
    has_assignment_history = history_len > 0

    return or_(
        func.coalesce(Case.status, "novo") != "novo",
        Case.assigned_user_id.isnot(None),
        Case.assigned_at.isnot(None),
        has_assignment_history,
        Case.id.in_(activity_ids_query),
    )


def build_unhandled_case_expression(db):
    assignment_history_jsonb = Case.assignment_history.cast(JSONB)
    history_len = case(
        (
            func.jsonb_typeof(assignment_history_jsonb) == "array",
            func.jsonb_array_length(assignment_history_jsonb),
        ),
        else_=0,
    )

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

    return and_(
        func.coalesce(Case.status, "novo") == "novo",
        Case.assigned_user_id.is_(None),
        Case.assigned_at.is_(None),
        history_len <= 0,
        not_(has_assignment_event),
        not_(has_attachment),
        not_(has_contract_attachment),
        not_(has_comment),
        not_(has_contract),
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
