"""
M3: Company Documents Routes
Owner: Backend Dev 2
Dependencies: M1, M2

CRUD for company documents — USP, Compliances, Policies, Marketing Goals, etc.
Used by Admin (My Company) and Ethics Reviewer (Document Updation).
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.db.database import get_db
from app.models.models import User, UserRole, CompanyDocument
from app.schemas.schemas import DocumentCreate, DocumentOut, DocumentUpdate
from app.core.security import require_roles, get_current_user

router = APIRouter(prefix="/documents", tags=["Company Documents"])


@router.get("/", response_model=List[DocumentOut])
async def list_documents(
    doc_type: str = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(CompanyDocument).where(CompanyDocument.company_id == user.company_id)
    if doc_type:
        query = query.where(CompanyDocument.doc_type == doc_type)
    result = await db.execute(query.order_by(CompanyDocument.priority.desc()))
    return result.scalars().all()


@router.post("/", response_model=DocumentOut)
async def create_document(
    body: DocumentCreate,
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.ETHICS_REVIEWER])),
    db: AsyncSession = Depends(get_db),
):
    doc = CompanyDocument(
        company_id=user.company_id,
        doc_type=body.doc_type,
        title=body.title,
        content=body.content,
    )
    db.add(doc)
    await db.flush()
    return doc


@router.patch("/{doc_id}", response_model=DocumentOut)
async def update_document(
    doc_id: str,
    body: DocumentUpdate,
    user: User = Depends(require_roles([UserRole.ADMIN, UserRole.ETHICS_REVIEWER])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyDocument).where(
            CompanyDocument.id == doc_id,
            CompanyDocument.company_id == user.company_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(doc, field, value)
    doc.version += 1
    return doc


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    user: User = Depends(require_roles([UserRole.ADMIN])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CompanyDocument).where(
            CompanyDocument.id == doc_id,
            CompanyDocument.company_id == user.company_id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    await db.delete(doc)
    return {"detail": "Document deleted"}
