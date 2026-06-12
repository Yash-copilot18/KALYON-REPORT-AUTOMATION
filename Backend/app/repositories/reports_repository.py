# app/repositories/reports_repository.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any, Optional
from fastapi import HTTPException
import logging
import re

logger = logging.getLogger(__name__)

# ── Complete Equipment Registry ───────────────────────────────────────────────
# Maps every table in Kalyan database to equipment type, tags and metadata

EQUIPMENT_REGISTRY = {

    # ── Inverters ─────────────────────────────────────────────────────────────
    "Inverter": {
        "tables": [f"INVERTER_{str(i).zfill(2)}" for i in range(1, 25)],
        "time_col": "TimeCol",
        "tags": {
            "DC_VOLTAGE":                   {"unit": "V",    "label": "DC Voltage"},
            "DC_CURRENT":                   {"unit": "A",    "label": "DC Current"},
            "DC_POWER":                     {"unit": "kW",   "label": "DC Power"},
            "GRID_CURRENT_PHASE1":          {"unit": "A",    "label": "Grid Current Phase 1"},
            "GRID_CURRENT_PHASE2":          {"unit": "A",    "label": "Grid Current Phase 2"},
            "GRID_CURRENT_PHASE3":          {"unit": "A",    "label": "Grid Current Phase 3"},
            "GRID_LINE_VOLT_UV":            {"unit": "V",    "label": "Grid Voltage UV"},
            "GRID_LINE_VOLT_VW":            {"unit": "V",    "label": "Grid Voltage VW"},
            "GRID_LINE_VOLT_WU":            {"unit": "V",    "label": "Grid Voltage WU"},
            "ACTIVE_POWER":                 {"unit": "kW",   "label": "Active Power"},
            "REACTIVE_POWER":               {"unit": "kVAR", "label": "Reactive Power"},
            "APPARENT_POWER":               {"unit": "kVA",  "label": "Apparent Power"},
            "DAILY_ENERGY":                 {"unit": "kWh",  "label": "Daily Energy"},
            "MONTHLY_ENERGY":               {"unit": "kWh",  "label": "Monthly Energy"},
            "YEARLY_ENERGY":                {"unit": "kWh",  "label": "Yearly Energy"},
            "LIFETIME_ENERGY":              {"unit": "kWh",  "label": "Lifetime Energy"},
            "DAILY_REACT_ENERGY":           {"unit": "kVARh","label": "Daily Reactive Energy"},
            "MONTHLY_REACT_ENERGY":         {"unit": "kVARh","label": "Monthly Reactive Energy"},
            "DAILY_RUN_MIN":                {"unit": "min",  "label": "Daily Run Time"},
            "MONTHLY_RUN_HR":               {"unit": "hr",   "label": "Monthly Run Hours"},
            "YEARLY_RUN_HR":                {"unit": "hr",   "label": "Yearly Run Hours"},
            "LIFETIME_RUN_HR":              {"unit": "hr",   "label": "Lifetime Run Hours"},
            "DOWN_TIME_MIN":                {"unit": "min",  "label": "Down Time"},
            "OK_TIME_MIN":                  {"unit": "min",  "label": "OK Time"},
            "SLEEP_TIME_MIN":               {"unit": "min",  "label": "Sleep Time"},
            "GRID_OUTAGE_TIME_MIN":         {"unit": "min",  "label": "Grid Outage Time"},
            "GRID_OPR_TIME_MIN":            {"unit": "min",  "label": "Grid Operating Time"},
            "PRIMEPACK_IGBT_HEATSINK_TEMP": {"unit": "C",    "label": "IGBT Heatsink Temp"},
            "IHM_IGBT_HEAT_SINK_TEMP":      {"unit": "C",    "label": "IHM IGBT Temp"},
            "AMPLIFIER_BOARD_TEMP":         {"unit": "C",    "label": "Amplifier Board Temp"},
            "AIR_INLET_HEAT_SINK_TEMP":     {"unit": "C",    "label": "Air Inlet Heatsink Temp"},
            "CONTROL_SECTION_TEMP":         {"unit": "C",    "label": "Control Section Temp"},
            "PE_SECTION_TEMP":              {"unit": "C",    "label": "PE Section Temp"},
            "AC_SECTION_TEMP":              {"unit": "C",    "label": "AC Section Temp"},
            "DC_SECTION_TEMP":              {"unit": "C",    "label": "DC Section Temp"},
            "LINE_FILTER_TEMP":             {"unit": "C",    "label": "Line Filter Temp"},
            "MV_TRAFO_TEMP":                {"unit": "C",    "label": "MV Transformer Temp"},
            "STRING_CURRENT1":              {"unit": "A",    "label": "String Current 1"},
            "STRING_CURRENT2":              {"unit": "A",    "label": "String Current 2"},
            "STRING_CURRENT3":              {"unit": "A",    "label": "String Current 3"},
            "STRING_CURRENT4":              {"unit": "A",    "label": "String Current 4"},
            "STRING_CURRENT5":              {"unit": "A",    "label": "String Current 5"},
            "STRING_CURRENT6":              {"unit": "A",    "label": "String Current 6"},
            "STRING_CURRENT7":              {"unit": "A",    "label": "String Current 7"},
            "STRING_CURRENT8":              {"unit": "A",    "label": "String Current 8"},
            "STRING_CURRENT9":              {"unit": "A",    "label": "String Current 9"},
            "STRING_CURRENT10":             {"unit": "A",    "label": "String Current 10"},
        }
    },

    # ── String Combiner Boxes ─────────────────────────────────────────────────
    "String Combiner": {
        "tables": (
            [f"INVERTER{i}_SMB" for i in range(1, 10)] +
            [f"INVERTER{i}_SMB" for i in range(10, 25)]
        ),
        "time_col": "TimeCol",
        "tags": {
            "SCB1_DC_POWER":        {"unit": "kW",  "label": "SCB1 DC Power"},
            "SCB1_DC_VOLTAGE":      {"unit": "V",   "label": "SCB1 DC Voltage"},
            "SCB1_INTERNAL_TEMP":   {"unit": "C",   "label": "SCB1 Internal Temp"},
            "SCB1_TOTAL_CURRENT":   {"unit": "A",   "label": "SCB1 Total Current"},
            "SCB1_STRING_CURRENT1": {"unit": "A",   "label": "SCB1 String Current 1"},
            "SCB1_STRING_CURRENT2": {"unit": "A",   "label": "SCB1 String Current 2"},
            "SCB1_STRING_CURRENT3": {"unit": "A",   "label": "SCB1 String Current 3"},
            "SCB2_DC_POWER":        {"unit": "kW",  "label": "SCB2 DC Power"},
            "SCB2_DC_VOLTAGE":      {"unit": "V",   "label": "SCB2 DC Voltage"},
            "SCB2_INTERNAL_TEMP":   {"unit": "C",   "label": "SCB2 Internal Temp"},
            "SCB2_TOTAL_CURRENT":   {"unit": "A",   "label": "SCB2 Total Current"},
            "SCB3_DC_POWER":        {"unit": "kW",  "label": "SCB3 DC Power"},
            "SCB3_DC_VOLTAGE":      {"unit": "V",   "label": "SCB3 DC Voltage"},
            "SCB3_TOTAL_CURRENT":   {"unit": "A",   "label": "SCB3 Total Current"},
            "SCB4_DC_POWER":        {"unit": "kW",  "label": "SCB4 DC Power"},
            "SCB4_DC_VOLTAGE":      {"unit": "V",   "label": "SCB4 DC Voltage"},
            "SCB4_TOTAL_CURRENT":   {"unit": "A",   "label": "SCB4 Total Current"},
            "SCB5_DC_POWER":        {"unit": "kW",  "label": "SCB5 DC Power"},
            "SCB5_DC_VOLTAGE":      {"unit": "V",   "label": "SCB5 DC Voltage"},
            "SCB5_TOTAL_CURRENT":   {"unit": "A",   "label": "SCB5 Total Current"},
        }
    },

    # ── Weather Monitoring Station ────────────────────────────────────────────
    "WMS": {
        "tables":   ["WMS"],
        "time_col": "TimeCol",
        "tags": {
            "AVG_GHI_IRRADIATION":          {"unit": "W/m2",  "label": "GHI Irradiation"},
            "AVG_GTI_IRRADIATION":          {"unit": "W/m2",  "label": "GTI Irradiation"},
            "AVG_ALBEDO_UP_IRRADIATION":    {"unit": "W/m2",  "label": "Albedo Up Irradiation"},
            "AVG_ALBEDO_DOWN_IRRADIATION":  {"unit": "W/m2",  "label": "Albedo Down Irradiation"},
            "AVG_GHI_CUMM_IRRADIATION":     {"unit": "Wh/m2", "label": "GHI Cumulative"},
            "AVG_GTI_CUMM_IRRADIATION":     {"unit": "Wh/m2", "label": "GTI Cumulative"},
            "TOTAL_IRRADIANCE":             {"unit": "W/m2",  "label": "Total Irradiance"},
            "AVG_AIR_TEMP":                 {"unit": "C",     "label": "Air Temperature"},
            "AVG_AIR_PRESSURE":             {"unit": "hPa",   "label": "Air Pressure"},
            "AVG_RELATIVE_HUMIDITY":        {"unit": "%",     "label": "Relative Humidity"},
            "AVG_WIND_SPEED":               {"unit": "m/s",   "label": "Wind Speed"},
            "AVG_WIND_DIRECTION":           {"unit": "deg",   "label": "Wind Direction"},
            "ALL_WMS_AVG_MODULE_TEMP":      {"unit": "C",     "label": "Avg Module Temp"},
            "AVG_WMS1_MODULE_TEMP":         {"unit": "C",     "label": "WMS1 Module Temp"},
            "AVG_WMS2_MODULE_TEMP":         {"unit": "C",     "label": "WMS2 Module Temp"},
            "AVG_WMS3_MODULE_TEMP":         {"unit": "C",     "label": "WMS3 Module Temp"},
            "AVG_WMS4_MODULE_TEMP":         {"unit": "C",     "label": "WMS4 Module Temp"},
            "AVG_IR_BACKPLANE_TEMP":        {"unit": "C",     "label": "IR Backplane Temp"},
            "AVG_IR_SOILING_RATIO1":        {"unit": "%",     "label": "Soiling Ratio 1"},
            "AVG_IR_SOILING_RATIO2":        {"unit": "%",     "label": "Soiling Ratio 2"},
            "AVG_IR_TRANSMISSION_LOSS1":    {"unit": "%",     "label": "Transmission Loss 1"},
            "AVG_IR_TILT_X_DIRECTION":      {"unit": "deg",   "label": "Tilt X Direction"},
            "AVG_IR_TILT_Y_DIRECTION":      {"unit": "deg",   "label": "Tilt Y Direction"},
            "AVG_PRECIPITATION_INTENSITY":  {"unit": "mm/h",  "label": "Precipitation Intensity"},
            "AVG_PRECIPITATION_TYPE":       {"unit": "",      "label": "Precipitation Type"},
            "WMS1_GHI_IRRADIATION":         {"unit": "W/m2",  "label": "WMS1 GHI"},
            "WMS1_GTI_IRRADIATION":         {"unit": "W/m2",  "label": "WMS1 GTI"},
            "WMS1_MODULE_TEMP1":            {"unit": "C",     "label": "WMS1 Module Temp 1"},
            "WMS1_AIR_TEMP":                {"unit": "C",     "label": "WMS1 Air Temp"},
            "WMS1_WIND_SPEED":              {"unit": "m/s",   "label": "WMS1 Wind Speed"},
            "WMS2_GHI_IRRADIATION":         {"unit": "W/m2",  "label": "WMS2 GHI"},
            "WMS2_GTI_IRRADIATION":         {"unit": "W/m2",  "label": "WMS2 GTI"},
            "WMS2_AIR_TEMP":                {"unit": "C",     "label": "WMS2 Air Temp"},
            "WMS3_GHI_IRRADIATION":         {"unit": "W/m2",  "label": "WMS3 GHI"},
            "WMS4_GHI_IRRADIATION":         {"unit": "W/m2",  "label": "WMS4 GHI"},
        }
    },

    # ── PPC (Plant Power Controller) ──────────────────────────────────────────
    "PPC": {
        "tables":   ["PPC"],
        "time_col": "TimeCol",
        "tags": {
            "GRID_ACTIVE_POWER_MEASURED":    {"unit": "kW",   "label": "Grid Active Power"},
            "GRID_REACTIVE_POWER_MEASURED":  {"unit": "kVAR", "label": "Grid Reactive Power"},
            "GRID_VOLTAGE_L_L_MEASURED":     {"unit": "V",    "label": "Grid Voltage L-L"},
            "GRID_FREQUENCY_MEASURED":       {"unit": "Hz",   "label": "Grid Frequency"},
            "GRID_PF_MEASURED":              {"unit": "",     "label": "Grid Power Factor"},
            "GRID_CURRENT_Ia":               {"unit": "A",    "label": "Grid Current Ia"},
            "GRID_CURRENT_Ib":               {"unit": "A",    "label": "Grid Current Ib"},
            "GRID_CURRENT_Ic":               {"unit": "A",    "label": "Grid Current Ic"},
            "VOLTAGE_U_A":                   {"unit": "V",    "label": "Voltage U-A"},
            "VOLTAGE_U_B":                   {"unit": "V",    "label": "Voltage U-B"},
            "VOLTAGE_U_C":                   {"unit": "V",    "label": "Voltage U-C"},
            "INVERTER_RUNNING":              {"unit": "",     "label": "Inverters Running"},
            "INVERTER_TOTAL_ACTIVE_POWER":   {"unit": "kW",   "label": "Total Active Power"},
            "INVERTER_TOTAL_REACTIVE_POWER": {"unit": "kVAR", "label": "Total Reactive Power"},
            "ACTIVE_POWER_SET_POINT":        {"unit": "kW",   "label": "Active Power Setpoint"},
            "POWER_FACTOR_SET_POINT":        {"unit": "",     "label": "PF Setpoint"},
            "VAR_SET_POINT":                 {"unit": "kVAR", "label": "VAR Setpoint"},
            "VOLTAGE_SET_POINT":             {"unit": "V",    "label": "Voltage Setpoint"},
            "PLANT_DAILY_PRODUCTION":        {"unit": "kWh",  "label": "Plant Daily Production"},
            "PLANT_MONTHLY_PRODUCTION":      {"unit": "kWh",  "label": "Plant Monthly Production"},
            "PLANT_YEARLY_PRODUCTION":       {"unit": "kWh",  "label": "Plant Yearly Production"},
            "PLANT_LIFETIME_PRODUCTION":     {"unit": "kWh",  "label": "Plant Lifetime Production"},
            "DAILY_OPERATING_TIME":          {"unit": "min",  "label": "Daily Operating Time"},
            "MONTHLY_OPERATING_TIME":        {"unit": "hr",   "label": "Monthly Operating Time"},
        }
    },

    # ── PPC Trend ─────────────────────────────────────────────────────────────
    "PPC Trend": {
        "tables":   ["PPC_TREND"],
        "time_col": "TimeCol",
        "tags": {
            "GRID_ACTIVE_POWER_MEASURED":    {"unit": "kW",   "label": "Grid Active Power"},
            "GRID_REACTIVE_POWER_MEASURED":  {"unit": "kVAR", "label": "Grid Reactive Power"},
            "GRID_VOLTAGE_L_L_MEASURED":     {"unit": "V",    "label": "Grid Voltage L-L"},
            "GRID_FREQUENCY_MEASURED":       {"unit": "Hz",   "label": "Grid Frequency"},
            "GRID_PF_MEASURED":              {"unit": "",     "label": "Grid Power Factor"},
            "INVERTER_RUNNING":              {"unit": "",     "label": "Inverters Running"},
            "INVERTER_TOTAL_ACTIVE_POWER":   {"unit": "kW",   "label": "Total Active Power"},
            "INVERTER_TOTAL_REACTIVE_POWER": {"unit": "kVAR", "label": "Total Reactive Power"},
            "ACTIVE_POWER_SET_POINT":        {"unit": "kW",   "label": "Active Power Setpoint"},
            "VOLTAGE_SET_POINT":             {"unit": "V",    "label": "Voltage Setpoint"},
            "VAR_SET_POINT":                 {"unit": "kVAR", "label": "VAR Setpoint"},
            "POWER_FACTOR_SET_POINT":        {"unit": "",     "label": "PF Setpoint"},
        }
    },

    # ── Power Graph ───────────────────────────────────────────────────────────
    "Power Graph": {
        "tables":   ["POWER_GRAPH"],
        "time_col": "TimeCol",
        "tags": {
            f"INVERTER_{str(i).zfill(2)}_ACTIVE_POWER": {
                "unit": "kW",
                "label": f"INV-{str(i).zfill(2)} Active Power"
            } for i in range(1, 25)
        }
    },

    # ── Power vs Irradiance ───────────────────────────────────────────────────
    "Power vs Irradiance": {
        "tables":   ["POWER_VS_IRRADIANCE"],
        "time_col": "TimeCol",
        "tags": {
            "POWER_GENERATION":              {"unit": "kW",    "label": "Power Generation"},
            "AVG_ALBEDO_UP_CUMM_IRRADIATION":{"unit": "Wh/m2", "label": "Albedo Up Cumulative"},
            "AVG_GHI_IRRADIATION":           {"unit": "W/m2",  "label": "GHI Irradiation"},
        }
    },

    # ── Daily Generation ──────────────────────────────────────────────────────
    "Daily Generation": {
        "tables":   ["INVERTER_DAILY_GEN"],
        "time_col": "TimeCol",
        "tags": {
            f"INVERTER_{str(i).zfill(2)}_GEN": {
                "unit": "kWh",
                "label": f"INV-{str(i).zfill(2)} Daily Generation"
            } for i in range(1, 26)
        }
    },

    # ── Monthly Generation ────────────────────────────────────────────────────
    "Monthly Generation": {
        "tables":   ["INVERTER_MONTHLY_GEN"],
        "time_col": "TimeCol",
        "tags": {
            f"INVERTER_{str(i).zfill(2)}_GEN": {
                "unit": "kWh",
                "label": f"INV-{str(i).zfill(2)} Monthly Generation"
            } for i in range(1, 26)
        }
    },

    # ── Inverter Temperature ──────────────────────────────────────────────────
    "Inverter Temperature": {
        "tables":   ["INVERTER_TEMP"],
        "time_col": "TimeCol",
        "tags": {
            "AC_BREAKER_TEMP_18":       {"unit": "C", "label": "AC Breaker Temp INV18"},
            "AC_BREAKER_TEMP_23":       {"unit": "C", "label": "AC Breaker Temp INV23"},
            "AMBIENT_BOTTOM_TEMP_18":   {"unit": "C", "label": "Ambient Bottom INV18"},
            "AMBIENT_BOTTOM_TEMP_23":   {"unit": "C", "label": "Ambient Bottom INV23"},
            "BECHKOFF_TEMP_18":         {"unit": "C", "label": "Beckhoff Temp INV18"},
            "BECHKOFF_TEMP_23":         {"unit": "C", "label": "Beckhoff Temp INV23"},
            "CAPACITOR_BANK_PSU1_18":   {"unit": "C", "label": "Cap Bank PSU1 INV18"},
            "CAPACITOR_BANK_PSU1_23":   {"unit": "C", "label": "Cap Bank PSU1 INV23"},
            "CTRL_BOTTOM_18":           {"unit": "C", "label": "Control Bottom INV18"},
            "CTRL_BOTTOM_23":           {"unit": "C", "label": "Control Bottom INV23"},
            "DC_INCOMER_18":            {"unit": "C", "label": "DC Incomer INV18"},
            "DC_INCOMER_23":            {"unit": "C", "label": "DC Incomer INV23"},
            "GDU_PSU1_L2_18":           {"unit": "C", "label": "GDU PSU1 L2 INV18"},
            "GDU_PSU1_L2_23":           {"unit": "C", "label": "GDU PSU1 L2 INV23"},
            "INLET_HEX_PSU1_18":        {"unit": "C", "label": "Inlet HEX PSU1 INV18"},
            "INLET_HEX_PSU1_23":        {"unit": "C", "label": "Inlet HEX PSU1 INV23"},
            "OUT_HEAT_SINK_PSU1_18":    {"unit": "C", "label": "Out Heatsink PSU1 INV18"},
            "OUT_HEAT_SINK_PSU1_23":    {"unit": "C", "label": "Out Heatsink PSU1 INV23"},
            "PEC_18":                   {"unit": "C", "label": "PEC INV18"},
            "PEC_23":                   {"unit": "C", "label": "PEC INV23"},
        }
    },

    # ── Temperature Report ────────────────────────────────────────────────────
    "Temperature Report": {
        "tables":   ["TEMPERATURE_REPORT"],
        "time_col": "TimeCol",
        "tags": {
            "AC_BREAKER_TEMP_18":     {"unit": "C", "label": "AC Breaker Temp 18"},
            "AC_BREAKER_TEMP_23":     {"unit": "C", "label": "AC Breaker Temp 23"},
            "AMBIENT_BOTTOM_TEMP_18": {"unit": "C", "label": "Ambient Bottom 18"},
            "AMBIENT_BOTTOM_TEMP_23": {"unit": "C", "label": "Ambient Bottom 23"},
            "BECHKOFF_TEMP_18":       {"unit": "C", "label": "Beckhoff Temp 18"},
            "BECHKOFF_TEMP_23":       {"unit": "C", "label": "Beckhoff Temp 23"},
            "CTRL_BOTTOM_18":         {"unit": "C", "label": "Control Bottom 18"},
            "CTRL_BOTTOM_23":         {"unit": "C", "label": "Control Bottom 23"},
            "DC_INCOMER_18":          {"unit": "C", "label": "DC Incomer 18"},
            "DC_INCOMER_23":          {"unit": "C", "label": "DC Incomer 23"},
            "OUT_HEAT_SINK_PSU1_18":  {"unit": "C", "label": "Out Heatsink PSU1 18"},
            "OUT_HEAT_SINK_PSU1_23":  {"unit": "C", "label": "Out Heatsink PSU1 23"},
            "PEC_18":                 {"unit": "C", "label": "PEC 18"},
            "PEC_23":                 {"unit": "C", "label": "PEC 23"},
        }
    },

    # ── Tracker MBOX Status ───────────────────────────────────────────────────
    "Tracker": {
        "tables":   ["TRACKER_MBOX_STATUS"],
        "time_col": "TimeCol",
        "tags": {
            "BLOCK_01_MBOX_ALARM":            {"unit": "",    "label": "Block 01 Alarm"},
            "BLOCK_01_MBOX_BATTERY_LEVEL":    {"unit": "%",   "label": "Block 01 Battery"},
            "BLOCK_01_MBOX_WIND_SPEED_60S":   {"unit": "m/s", "label": "Block 01 Wind Speed 60s"},
            "BLOCK_01_MBOX_WIND_SPEED_3S":    {"unit": "m/s", "label": "Block 01 Wind Speed 3s"},
            "BLOCK_03_MBOX_ALARM":            {"unit": "",    "label": "Block 03 Alarm"},
            "BLOCK_03_MBOX_WIND_SPEED_60S":   {"unit": "m/s", "label": "Block 03 Wind Speed 60s"},
            "BLOCK_04_MBOX_ALARM":            {"unit": "",    "label": "Block 04 Alarm"},
            "BLOCK_04_MBOX_WIND_SPEED_60S":   {"unit": "m/s", "label": "Block 04 Wind Speed 60s"},
            "BLOCK_08_MBOX_ALARM":            {"unit": "",    "label": "Block 08 Alarm"},
            "BLOCK_12_MBOX_ALARM":            {"unit": "",    "label": "Block 12 Alarm"},
            "BLOCK_13_MBOX_ALARM":            {"unit": "",    "label": "Block 13 Alarm"},
            "BLOCK_18_MBOX_ALARM":            {"unit": "",    "label": "Block 18 Alarm"},
            "BLOCK_22_MBOX_ALARM":            {"unit": "",    "label": "Block 22 Alarm"},
            "BLOCK_23_MBOX_ALARM":            {"unit": "",    "label": "Block 23 Alarm"},
            "TBOX1_GLOBALSTATUS_WIND_SPEED":  {"unit": "m/s", "label": "TBOX1 Wind Speed"},
            "TBOX1_GLOBALSTATUS_WIND_ALARM":  {"unit": "",    "label": "TBOX1 Wind Alarm"},
            "TBOX1_GLOBALSTATUS_SUN_ANGLE":   {"unit": "deg", "label": "TBOX1 Sun Angle"},
            "TBOX2_GLOBALSTATUS_WIND_SPEED":  {"unit": "m/s", "label": "TBOX2 Wind Speed"},
            "TBOX2_GLOBALSTATUS_SUN_ANGLE":   {"unit": "deg", "label": "TBOX2 Sun Angle"},
        }
    },

    # ── Alarms ────────────────────────────────────────────────────────────────
    "Alarms": {
        "tables":   ["Alarms"],
        "time_col": "TimeCol",
        "tags": {
            "EventCol":  {"unit": "", "label": "Event"},
            "EvDescCol": {"unit": "", "label": "Event Description"},
            "DescCol":   {"unit": "", "label": "Description"},
            "CommCol":   {"unit": "", "label": "Comment"},
            "DurCol":    {"unit": "s","label": "Duration (s)"},
            "UniID":     {"unit": "", "label": "Unit ID"},
            "TraID":     {"unit": "", "label": "Track ID"},
        }
    },

    # ── T1 Isolation Sections ─────────────────────────────────────────────────
    "T1 Isolation": {
        "tables": [f"T1_IS{i}" for i in range(1, 13)],
        "time_col": "TimeCol",
        "tags": {}  # Will be auto-discovered from DB
    },

    # ── T2 Isolation Sections ─────────────────────────────────────────────────
    "T2 Isolation": {
        "tables": [f"T2_IS{i}" for i in range(13, 25)],
        "time_col": "TimeCol",
        "tags": {}  # Will be auto-discovered from DB
    },
}


# ── Validation helpers ────────────────────────────────────────────────────────

def _safe_name(name: str) -> bool:
    """Allow only alphanumeric and underscore — prevents SQL injection."""
    return bool(re.match(r'^[A-Za-z0-9_]+$', name))


def _build_interval_expr(interval: str) -> str:
    mapping = {
        "1min":    "DATEADD(MINUTE, DATEDIFF(MINUTE,  0, TimeCol),     0)",
        "5min":    "DATEADD(MINUTE, DATEDIFF(MINUTE,  0, TimeCol)/5*5,   0)",
        "15min":   "DATEADD(MINUTE, DATEDIFF(MINUTE,  0, TimeCol)/15*15, 0)",
        "30min":   "DATEADD(MINUTE, DATEDIFF(MINUTE,  0, TimeCol)/30*30, 0)",
        "hourly":  "DATEADD(HOUR,   DATEDIFF(HOUR,    0, TimeCol),     0)",
        "daily":   "DATEADD(DAY,    DATEDIFF(DAY,     0, TimeCol),     0)",
        "monthly": "DATEADD(MONTH,  DATEDIFF(MONTH,   0, TimeCol),     0)",
    }
    return mapping.get(interval, "TimeCol")


def _build_agg_expr(col: str, fn: str) -> str:
    fn_map = {
        "avg": f"AVG(CAST([{col}] AS FLOAT))",
        "min": f"MIN(CAST([{col}] AS FLOAT))",
        "max": f"MAX(CAST([{col}] AS FLOAT))",
        "sum": f"SUM(CAST([{col}] AS FLOAT))",
    }
    return fn_map.get(fn, f"AVG(CAST([{col}] AS FLOAT))")


# ── Repository class ──────────────────────────────────────────────────────────

class ReportsRepository:

    @staticmethod
    def get_equipment_types(db: Session) -> List[Dict]:
        """Return all equipment types with record counts."""
        results = []
        for eq_type, config in EQUIPMENT_REGISTRY.items():
            table = config["tables"][0]
            try:
                count = db.execute(
                    text(f"SELECT COUNT(*) FROM [{table}]")
                ).scalar() or 0
            except Exception:
                count = 0
            results.append({
                "equipment_type": eq_type,
                "table_name":     table,
                "count":          count,
            })
        return results

    @staticmethod
    def get_equipment_list(db: Session, equipment_type: str) -> List[Dict]:
        """Return all table instances for an equipment type."""
        config = EQUIPMENT_REGISTRY.get(equipment_type)
        if not config:
            raise HTTPException(400, detail=f"Unknown type: {equipment_type}")

        results = []
        for table in config["tables"]:
            if not _safe_name(table):
                continue
            try:
                count = db.execute(
                    text(f"SELECT COUNT(*) FROM [{table}]")
                ).scalar() or 0

                # Get latest timestamp
                latest_sql = text(f"SELECT MAX(TimeCol) FROM [{table}]")
                latest     = db.execute(latest_sql).scalar()

                results.append({
                    "equipment_id":   table,
                    "display_name":   table.replace("_", " "),
                    "table_name":     table,
                    "record_count":   count,
                    "latest_record":  latest.isoformat() if latest and hasattr(latest, 'isoformat') else None,
                })
            except Exception as e:
                logger.warning(f"Skipping {table}: {e}")

        return results

    @staticmethod
    def get_tags(
        db: Session,
        equipment_type: str,
        equipment_id: Optional[str] = None
    ) -> List[Dict]:
        """Return tags — from registry first, auto-discover if registry empty."""
        config = EQUIPMENT_REGISTRY.get(equipment_type)
        if not config:
            raise HTTPException(400, detail=f"Unknown type: {equipment_type}")

        table     = equipment_id or config["tables"][0]
        reg_tags  = config.get("tags", {})

        # Get actual columns from the database
        cols_sql  = text("""
            SELECT COLUMN_NAME, DATA_TYPE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME   = :tbl
              AND TABLE_SCHEMA = 'dbo'
              AND COLUMN_NAME NOT IN ('TimeCol','MSecCol','LocalCol','UserCol','ReasonCol')
            ORDER BY ORDINAL_POSITION
        """)
        db_cols = {
            row[0]: row[1]
            for row in db.execute(cols_sql, {"tbl": table}).fetchall()
        }

        tags = []

        if reg_tags:
            # Use registry tags — only include columns that exist in the table
            for col, meta in reg_tags.items():
                if col in db_cols:
                    tags.append({
                        "tag":         meta["label"],
                        "unit":        meta["unit"],
                        "column_name": col,
                        "data_type":   db_cols[col],
                    })
        else:
            # Auto-discover all numeric columns
            for col, dtype in db_cols.items():
                if _safe_name(col):
                    tags.append({
                        "tag":         col.replace("_", " ").title(),
                        "unit":        "",
                        "column_name": col,
                        "data_type":   dtype,
                    })

        return tags

    @staticmethod
    def get_report_data(
        db:             Session,
        equipment_type: str,
        equipment_id:   str,
        tags:           List[str],
        from_datetime:  str,
        to_datetime:    str,
        interval:       str,
        agg_function:   str,
        page:           int,
        page_size:      int,
    ) -> Dict:
        """Execute report query against SQL Server and return paginated results."""

        # Validate all inputs
        if not _safe_name(equipment_id.replace(".", "_")):
            raise HTTPException(400, detail="Invalid equipment_id")

        for tag in tags:
            if not _safe_name(tag):
                raise HTTPException(400, detail=f"Invalid tag: {tag}")

        table = equipment_id

        # Confirm table exists
        exists = db.execute(text("""
            SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES
            WHERE TABLE_NAME = :tbl AND TABLE_SCHEMA = 'dbo'
        """), {"tbl": table}).scalar()

        if not exists:
            raise HTTPException(404, detail=f"Table '{table}' not found")

        # Confirm columns exist
        valid_cols = {
            row[0] for row in db.execute(text("""
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = :tbl AND TABLE_SCHEMA = 'dbo'
            """), {"tbl": table}).fetchall()
        }

        invalid = [t for t in tags if t not in valid_cols]
        if invalid:
            raise HTTPException(400, detail=f"Columns not found: {invalid}")

        params = {
            "from_dt": from_datetime,
            "to_dt":   to_datetime,
            "offset":  (page - 1) * page_size,
            "limit":   page_size,
        }

        if interval == "raw":
            col_select = ", ".join([f"[{t}]" for t in tags])
            count_sql  = text(f"""
                SELECT COUNT(*) FROM [{table}]
                WHERE TimeCol BETWEEN :from_dt AND :to_dt
            """)
            data_sql = text(f"""
                SELECT TimeCol, {col_select}
                FROM [{table}]
                WHERE TimeCol BETWEEN :from_dt AND :to_dt
                ORDER BY TimeCol
                OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
            """)
        else:
            grp      = _build_interval_expr(interval)
            agg_cols = ", ".join([
                f"{_build_agg_expr(t, agg_function)} AS [{t}]"
                for t in tags
            ])
            count_sql = text(f"""
                SELECT COUNT(*) FROM (
                    SELECT {grp} AS ts
                    FROM [{table}]
                    WHERE TimeCol BETWEEN :from_dt AND :to_dt
                    GROUP BY {grp}
                ) x
            """)
            data_sql = text(f"""
                SELECT {grp} AS TimeCol, {agg_cols}
                FROM [{table}]
                WHERE TimeCol BETWEEN :from_dt AND :to_dt
                GROUP BY {grp}
                ORDER BY {grp}
                OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
            """)

        total = db.execute(
            count_sql, {"from_dt": from_datetime, "to_dt": to_datetime}
        ).scalar() or 0

        rows = db.execute(data_sql, params).fetchall()

        result_rows = []
        for row in rows:
            d = {
                "timestamp": (
                    row[0].isoformat()
                    if row[0] and hasattr(row[0], "isoformat")
                    else str(row[0] or "")
                )
            }
            for i, tag in enumerate(tags):
                val = row[i + 1]
                if val is None:
                    d[tag] = None
                elif isinstance(val, float):
                    d[tag] = round(val, 4)
                elif isinstance(val, int):
                    d[tag] = val
                else:
                    d[tag] = str(val)
            result_rows.append(d)

        return {
            "equipment_type": equipment_type,
            "equipment_id":   equipment_id,
            "table_name":     table,
            "from_datetime":  from_datetime,
            "to_datetime":    to_datetime,
            "interval":       interval,
            "agg_function":   agg_function,
            "total_records":  total,
            "page":           page,
            "page_size":      page_size,
            "columns":        ["timestamp"] + tags,
            "rows":           result_rows,
        }