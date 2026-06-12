# app/services/reports_service.py

from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from fastapi import HTTPException
import logging

from app.repositories.reports_repository import ReportsRepository, EQUIPMENT_REGISTRY
from app.schemas.reports_schema import ReportDataRequest

logger = logging.getLogger(__name__)


class ReportsService:

    @staticmethod
    def get_equipment_types(db: Session) -> List[Dict]:
        try:
            return ReportsRepository.get_equipment_types(db)
        except Exception as e:
            logger.error(f"get_equipment_types error: {e}", exc_info=True)
            return [
                {"equipment_type": k, "table_name": v["tables"][0], "count": 0}
                for k, v in EQUIPMENT_REGISTRY.items()
            ]

    @staticmethod
    def get_equipment_list(db: Session, equipment_type: str) -> List[Dict]:
        if not equipment_type:
            raise HTTPException(400, detail="equipment_type is required")
        try:
            return ReportsRepository.get_equipment_list(db, equipment_type)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"get_equipment_list error: {e}", exc_info=True)
            raise HTTPException(500, detail=str(e))

    @staticmethod
    def get_tags(
        db: Session,
        equipment_type: str,
        equipment_id: Optional[str] = None
    ) -> List[Dict]:
        if not equipment_type:
            raise HTTPException(400, detail="equipment_type is required")
        try:
            return ReportsRepository.get_tags(db, equipment_type, equipment_id)
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"get_tags error: {e}", exc_info=True)
            raise HTTPException(500, detail=str(e))

    @staticmethod
    def get_report_data(db: Session, req: ReportDataRequest) -> Dict:
        if not req.tags:
            raise HTTPException(400, detail="At least one tag is required")

        if req.to_datetime <= req.from_datetime:
            raise HTTPException(400, detail="to_datetime must be after from_datetime")

        config   = EQUIPMENT_REGISTRY.get(req.equipment_type, {})
        tag_meta = config.get("tags", {})

        column_names = []
        for tag in req.tags:
            if tag in tag_meta:
                column_names.append(tag)
            else:
                found = next(
                    (col for col, meta in tag_meta.items()
                     if meta["label"] == tag or col == tag),
                    tag
                )
                column_names.append(found)

        try:
            return ReportsRepository.get_report_data(
                db             = db,
                equipment_type = req.equipment_type,
                equipment_id   = req.equipment_id,
                tags           = column_names,
                from_datetime  = req.from_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                to_datetime    = req.to_datetime.strftime("%Y-%m-%d %H:%M:%S"),
                interval       = req.interval.value,
                agg_function   = req.agg_function.value,
                page           = req.page,
                page_size      = req.page_size,
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"get_report_data error: {e}", exc_info=True)
            raise HTTPException(500, detail=f"Report failed: {str(e)}")