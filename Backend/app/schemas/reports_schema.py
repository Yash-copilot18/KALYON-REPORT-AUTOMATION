# app/schemas/reports_schema.py

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


class IntervalEnum(str, Enum):
    raw     = "raw"
    min1    = "1min"
    min5    = "5min"
    min15   = "15min"
    min30   = "30min"
    hourly  = "hourly"
    daily   = "daily"
    monthly = "monthly"


class AggFuncEnum(str, Enum):
    avg = "avg"
    min = "min"
    max = "max"
    sum = "sum"


class ReportDataRequest(BaseModel):
    equipment_type: str = Field(..., description="e.g. Inverter, WMS, PPC")
    equipment_id:   str = Field(..., description="e.g. INVERTER_01")
    tags:           List[str] = Field(..., min_length=1)
    from_datetime:  datetime
    to_datetime:    datetime
    interval:       IntervalEnum = IntervalEnum.raw
    agg_function:   AggFuncEnum  = AggFuncEnum.avg
    page:           int = Field(default=1, ge=1)
    page_size:      int = Field(default=100, ge=1, le=10000)

    @field_validator("to_datetime")
    @classmethod
    def to_must_be_after_from(cls, v, info):
        if "from_datetime" in info.data and v <= info.data["from_datetime"]:
            raise ValueError("to_datetime must be after from_datetime")
        return v

    @field_validator("tags")
    @classmethod
    def tags_not_empty(cls, v):
        if not v:
            raise ValueError("At least one tag required")
        return v