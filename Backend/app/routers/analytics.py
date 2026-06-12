# app/routers/analytics.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import datetime, timedelta
import logging

from app.database.session import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/performance", summary="Plant performance analytics")
def get_performance(
    days: int = Query(default=7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    try:
        sql = text("""
            SELECT
                CAST(TimeCol AS DATE) AS dt,
                AVG(CAST(GRID_PF_MEASURED AS FLOAT))           AS avg_pf,
                AVG(CAST(GRID_FREQUENCY_MEASURED AS FLOAT))    AS avg_freq,
                MAX(CAST(INVERTER_TOTAL_ACTIVE_POWER AS FLOAT)) AS max_power,
                AVG(CAST(INVERTER_TOTAL_ACTIVE_POWER AS FLOAT)) AS avg_power,
                MAX(CAST(PLANT_DAILY_PRODUCTION AS FLOAT))     AS daily_energy
            FROM [PPC]
            WHERE TimeCol >= DATEADD(DAY, -:days, GETDATE())
            GROUP BY CAST(TimeCol AS DATE)
            ORDER BY dt
        """)
        rows = db.execute(sql, {"days": days}).fetchall()
        return {
            "data": [
                {
                    "date":         str(row[0]),
                    "label":        row[0].strftime("%b %d") if row[0] else "—",
                    "avg_pf":       round(float(row[1]), 3) if row[1] else 0,
                    "avg_freq":     round(float(row[2]), 2) if row[2] else 0,
                    "max_power_mw": round(float(row[3]) / 1000, 2) if row[3] else 0,
                    "avg_power_mw": round(float(row[4]) / 1000, 2) if row[4] else 0,
                    "daily_energy_mwh": round(float(row[5]) / 1000, 1) if row[5] else 0,
                }
                for row in rows
            ]
        }
    except Exception as e:
        logger.error(f"Performance analytics error: {e}", exc_info=True)
        return {"data": []}


@router.get("/inverter-comparison", summary="Compare all inverter outputs")
def get_inverter_comparison(
    date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        results = []
        for i in range(1, 25):
            table = f"INVERTER_{str(i).zfill(2)}"
            sql = text(f"""
                SELECT
                    AVG(CAST(ACTIVE_POWER AS FLOAT))    AS avg_power,
                    MAX(CAST(ACTIVE_POWER AS FLOAT))    AS max_power,
                    AVG(CAST(DC_VOLTAGE AS FLOAT))      AS avg_voltage,
                    AVG(CAST(DC_CURRENT AS FLOAT))      AS avg_current,
                    MAX(CAST(DAILY_ENERGY AS FLOAT))    AS daily_energy,
                    AVG(CAST(MV_TRAFO_TEMP AS FLOAT))   AS avg_temp
                FROM [{table}]
                WHERE CAST(TimeCol AS DATE) = :target_date
            """)
            row = db.execute(sql, {"target_date": target_date}).fetchone()
            results.append({
                "id":            f"INV-{str(i).zfill(3)}",
                "table":         table,
                "avg_power_kw":  round(float(row[0]), 1) if row and row[0] else 0,
                "max_power_kw":  round(float(row[1]), 1) if row and row[1] else 0,
                "avg_voltage_v": round(float(row[2]), 1) if row and row[2] else 0,
                "avg_current_a": round(float(row[3]), 1) if row and row[3] else 0,
                "daily_energy":  round(float(row[4]), 1) if row and row[4] else 0,
                "avg_temp_c":    round(float(row[5]), 1) if row and row[5] else 0,
                "power":         round(float(row[0]) / 1000, 1) if row and row[0] else 0,
            })
        return {"date": target_date, "inverters": results}
    except Exception as e:
        logger.error(f"Inverter comparison error: {e}", exc_info=True)
        return {"date": date, "inverters": []}


@router.get("/pr-irradiance", summary="Performance ratio vs irradiance trend")
def get_pr_irradiance(
    date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        sql = text("""
            SELECT
                DATEADD(HOUR, DATEDIFF(HOUR, 0, w.TimeCol), 0) AS hr,
                AVG(CAST(w.AVG_GHI_IRRADIATION AS FLOAT))      AS irr,
                AVG(CAST(p.INVERTER_TOTAL_ACTIVE_POWER AS FLOAT)) AS power
            FROM [WMS] w
            LEFT JOIN [PPC] p
                ON DATEADD(HOUR, DATEDIFF(HOUR, 0, w.TimeCol), 0)
                 = DATEADD(HOUR, DATEDIFF(HOUR, 0, p.TimeCol), 0)
            WHERE CAST(w.TimeCol AS DATE) = :target_date
            GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, w.TimeCol), 0)
            ORDER BY hr
        """)
        rows = db.execute(sql, {"target_date": target_date}).fetchall()

        installed_kw = 2000000
        data = []
        for row in rows:
            irr   = float(row[1]) if row[1] else 0
            power = float(row[2]) if row[2] else 0
            exp   = (irr / 1000) * installed_kw if irr > 0 else 1
            pr    = min(round((power / exp) * 100, 1), 100) if exp > 0 and power > 0 else 0
            data.append({
                "hour": row[0].strftime("%H:00") if row[0] else "—",
                "irr":  round(irr, 1),
                "pr":   pr,
                "power": round(power / 1000, 1),
            })

        return {"date": target_date, "data": data}
    except Exception as e:
        logger.error(f"PR irradiance error: {e}", exc_info=True)
        return {"date": date, "data": []}


@router.get("/weekly-energy", summary="Weekly energy generation")
def get_weekly_energy(
    weeks: int = Query(default=1, ge=1, le=12),
    db: Session = Depends(get_db)
):
    try:
        sql = text("""
            SELECT
                CAST(TimeCol AS DATE) AS dt,
                MAX(CAST(PLANT_DAILY_PRODUCTION AS FLOAT)) AS energy
            FROM [PPC]
            WHERE TimeCol >= DATEADD(DAY, -:days, GETDATE())
            GROUP BY CAST(TimeCol AS DATE)
            ORDER BY dt
        """)
        rows = db.execute(sql, {"days": weeks * 7}).fetchall()
        return {
            "data": [
                {
                    "date":   str(row[0]),
                    "label":  row[0].strftime("%b %d") if row[0] else "—",
                    "value":  round(float(row[1]) / 1000, 1) if row[1] else 0,
                }
                for row in rows
            ]
        }
    except Exception as e:
        logger.error(f"Weekly energy error: {e}", exc_info=True)
        return {"data": []}


@router.get("/temperature", summary="Inverter temperature analytics")
def get_temperature(
    date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        sql = text("""
            SELECT
                DATEADD(HOUR, DATEDIFF(HOUR, 0, TimeCol), 0) AS hr,
                AVG(CAST(AC_BREAKER_TEMP_18 AS FLOAT))        AS ac_temp_18,
                AVG(CAST(AC_BREAKER_TEMP_23 AS FLOAT))        AS ac_temp_23,
                AVG(CAST(AMBIENT_BOTTOM_TEMP_18 AS FLOAT))    AS amb_18,
                AVG(CAST(AMBIENT_BOTTOM_TEMP_23 AS FLOAT))    AS amb_23,
                AVG(CAST(PEC_18 AS FLOAT))                    AS pec_18,
                AVG(CAST(PEC_23 AS FLOAT))                    AS pec_23
            FROM [TEMPERATURE_REPORT]
            WHERE CAST(TimeCol AS DATE) = :target_date
            GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, TimeCol), 0)
            ORDER BY hr
        """)
        rows = db.execute(sql, {"target_date": target_date}).fetchall()
        return {
            "date": target_date,
            "data": [
                {
                    "hour":      row[0].strftime("%H:00") if row[0] else "—",
                    "ac_18":     round(float(row[1]), 1) if row[1] else 0,
                    "ac_23":     round(float(row[2]), 1) if row[2] else 0,
                    "ambient_18":round(float(row[3]), 1) if row[3] else 0,
                    "ambient_23":round(float(row[4]), 1) if row[4] else 0,
                    "pec_18":    round(float(row[5]), 1) if row[5] else 0,
                    "pec_23":    round(float(row[6]), 1) if row[6] else 0,
                }
                for row in rows
            ]
        }
    except Exception as e:
        logger.error(f"Temperature error: {e}", exc_info=True)
        return {"date": date, "data": []}


@router.get("/wms-trend", summary="Weather station trend")
def get_wms_trend(
    date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    try:
        target_date = date or datetime.now().strftime("%Y-%m-%d")
        sql = text("""
            SELECT
                DATEADD(HOUR, DATEDIFF(HOUR, 0, TimeCol), 0) AS hr,
                AVG(CAST(AVG_GHI_IRRADIATION AS FLOAT))       AS ghi,
                AVG(CAST(AVG_GTI_IRRADIATION AS FLOAT))       AS gti,
                AVG(CAST(ALL_WMS_AVG_MODULE_TEMP AS FLOAT))   AS mod_temp,
                AVG(CAST(AVG_AIR_TEMP AS FLOAT))              AS air_temp,
                AVG(CAST(AVG_WIND_SPEED AS FLOAT))            AS wind,
                AVG(CAST(AVG_RELATIVE_HUMIDITY AS FLOAT))     AS humidity
            FROM [WMS]
            WHERE CAST(TimeCol AS DATE) = :target_date
            GROUP BY DATEADD(HOUR, DATEDIFF(HOUR, 0, TimeCol), 0)
            ORDER BY hr
        """)
        rows = db.execute(sql, {"target_date": target_date}).fetchall()
        return {
            "date": target_date,
            "data": [
                {
                    "hour":     row[0].strftime("%H:00") if row[0] else "—",
                    "ghi":      round(float(row[1]), 1) if row[1] else 0,
                    "gti":      round(float(row[2]), 1) if row[2] else 0,
                    "mod_temp": round(float(row[3]), 1) if row[3] else 0,
                    "air_temp": round(float(row[4]), 1) if row[4] else 0,
                    "wind":     round(float(row[5]), 1) if row[5] else 0,
                    "humidity": round(float(row[6]), 1) if row[6] else 0,
                }
                for row in rows
            ]
        }
    except Exception as e:
        logger.error(f"WMS trend error: {e}", exc_info=True)
        return {"date": date, "data": []}