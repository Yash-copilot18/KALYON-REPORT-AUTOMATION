# app/routers/reports_v2.py

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
import io
import csv
import logging
from datetime import datetime

from app.database.session import get_db
from app.schemas.reports_schema import ReportDataRequest
from app.services.reports_service import ReportsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/reports-v2", tags=["Reports v2"])


@router.get("/equipment-types", summary="Get all equipment types")
def get_equipment_types(db: Session = Depends(get_db)):
    return ReportsService.get_equipment_types(db)


@router.get("/equipment-list", summary="Get equipment list for a type")
def get_equipment_list(
    type: str = Query(..., description="Equipment type"),
    db: Session = Depends(get_db),
):
    return ReportsService.get_equipment_list(db, type)


@router.get("/tags", summary="Get tags for an equipment")
def get_tags(
    equipment_type: str = Query(...),
    equipment_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    return ReportsService.get_tags(db, equipment_type, equipment_id)


@router.post("/data", summary="Fetch report data")
def get_report_data(
    req: ReportDataRequest,
    db: Session = Depends(get_db),
):
    return ReportsService.get_report_data(db, req)


@router.post("/export/csv", summary="Export report as CSV")
def export_csv(
    req: ReportDataRequest,
    db: Session = Depends(get_db),
):
    req.page      = 1
    req.page_size = 10000
    result  = ReportsService.get_report_data(db, req)
    rows    = result.get("rows", [])
    cols    = result.get("columns", [])
    output  = io.StringIO()
    writer  = csv.DictWriter(output, fieldnames=cols, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({c: row.get(c, "") for c in cols})
    output.seek(0)
    ts       = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{req.equipment_type}_{req.equipment_id}_{ts}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/summary", summary="Get summary statistics")
def get_summary(
    req: ReportDataRequest,
    db: Session = Depends(get_db),
):
    from app.repositories.reports_repository import (
        EQUIPMENT_REGISTRY, _safe_name, _build_agg_expr
    )
    from sqlalchemy import text

    config   = EQUIPMENT_REGISTRY.get(req.equipment_type, {})
    tag_meta = config.get("tags", {})

    column_names = []
    for tag in req.tags:
        if tag in tag_meta:
            column_names.append(tag)
        else:
            found = next(
                (col for col, meta in tag_meta.items() if meta["label"] == tag),
                tag
            )
            column_names.append(found)

    for col in column_names:
        if not _safe_name(col):
            raise HTTPException(400, detail=f"Invalid tag: {col}")

    table     = req.equipment_id
    agg_parts = []
    for col in column_names:
        agg_parts.extend([
            f"AVG(CAST([{col}] AS FLOAT)) AS [{col}_avg]",
            f"MIN(CAST([{col}] AS FLOAT)) AS [{col}_min]",
            f"MAX(CAST([{col}] AS FLOAT)) AS [{col}_max]",
            f"SUM(CAST([{col}] AS FLOAT)) AS [{col}_sum]",
        ])

    sql = text(f"""
        SELECT COUNT(*) AS record_count, {', '.join(agg_parts)}
        FROM [{table}]
        WHERE TimeCol BETWEEN :from_dt AND :to_dt
    """)

    try:
        row = db.execute(sql, {
            "from_dt": req.from_datetime.strftime("%Y-%m-%d %H:%M:%S"),
            "to_dt":   req.to_datetime.strftime("%Y-%m-%d %H:%M:%S"),
        }).fetchone()

        if not row:
            return {"record_count": 0, "stats": {}}

        stats = {"record_count": row[0]}
        idx   = 1
        for col in column_names:
            label        = tag_meta.get(col, {}).get("label", col)
            stats[label] = {
                "avg": round(float(row[idx]),   4) if row[idx]   is not None else None,
                "min": round(float(row[idx+1]), 4) if row[idx+1] is not None else None,
                "max": round(float(row[idx+2]), 4) if row[idx+2] is not None else None,
                "sum": round(float(row[idx+3]), 4) if row[idx+3] is not None else None,
            }
            idx += 4
        return stats
    except Exception as e:
        logger.error(f"Summary error: {e}", exc_info=True)
        raise HTTPException(500, detail=str(e))