from models.report import ReportModel
from db.database import get_database
from typing import List

async def create_report(user_id: str, report_data: dict):
    db = get_database()
    report = ReportModel(user_id=user_id, **report_data)
    result = await db["reports"].insert_one(report.model_dump(by_alias=True, exclude=["id"]))
    created_report = await db["reports"].find_one({"_id": result.inserted_id})
    return ReportModel(**created_report)

async def get_user_reports(user_id: str, limit: int = 10) -> List[ReportModel]:
    db = get_database()
    cursor = db["reports"].find({"user_id": user_id}).sort("generated_at", -1).limit(limit)
    reports = await cursor.to_list(length=limit)
    return [ReportModel(**r) for r in reports]
