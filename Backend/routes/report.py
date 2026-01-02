from fastapi import APIRouter, Depends
from typing import List
from schemas.report import ReportCreate, ReportResponse
from services.report_service import create_report, get_user_reports
from utils.security import get_current_user_id

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/", response_model=ReportResponse)
async def create_new_report(report: ReportCreate, user_id: str = Depends(get_current_user_id)):
    new_report = await create_report(user_id, report.model_dump())
    return ReportResponse(
        id=str(new_report.id),
        generated_at=new_report.generated_at,
        emotion_summary=new_report.emotion_summary,
        file_reference=new_report.file_reference
    )

@router.get("/", response_model=List[ReportResponse])
async def list_reports(user_id: str = Depends(get_current_user_id)):
    reports = await get_user_reports(user_id)
    return [
        ReportResponse(
            id=str(r.id),
            generated_at=r.generated_at,
            emotion_summary=r.emotion_summary,
            file_reference=r.file_reference
        ) for r in reports
    ]
