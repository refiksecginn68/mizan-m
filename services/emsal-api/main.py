"""
Mizanım Emsal API — Railway üzerinde çalışan hafif FastAPI servisi.
Bedesten (adalet.gov.tr) API'sini sarmalar, Mizanım backend'ine REST sunar.
"""

import os
import hashlib
import asyncio
from datetime import datetime
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Mizanım Emsal API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

BEDESTEN_SEARCH = "https://bedesten.adalet.gov.tr/emsal-karar/searchDocuments"
BEDESTEN_DOC    = "https://bedesten.adalet.gov.tr/emsal-karar/getDocumentByDocumentId"

HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; Mizanim-Legal-Bot/1.0)",
}

# Mahkeme tipi eşlemesi
COURT_TYPE_MAP = {
    "yargitay":   "YARGITAYKARARI",
    "danistay":   "DANISTAYKARAR",
    "anayasa":    "ANAYASAMAHKEMESI",
    "bam_hukuk":  "BAM_HUKUK",
    "bam_ceza":   "BAM_CEZA",
    "all":        None,   # boş bırak → tümü
}

DEFAULT_COURTS = [
    "YARGITAYKARARI",
    "DANISTAYKARAR",
    "ANAYASAMAHKEMESI",
    "BAM_HUKUK",
    "BAM_CEZA",
]


class SearchResult(BaseModel):
    documentId: str
    court: str
    case_number: str
    decision_number: Optional[str] = None
    decision_date: Optional[str] = None
    subject: str
    summary: str
    source_url: str


class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    page: int
    query: str


class DocumentResponse(BaseModel):
    documentId: str
    content: str
    source_url: str


def to_iso(date_str: Optional[str], end: bool = False) -> Optional[str]:
    if not date_str:
        return None
    time = "T23:59:59.000Z" if end else "T00:00:00.000Z"
    return f"{date_str}{time}"


def map_court_types(court: Optional[str]) -> list[str]:
    if not court or court == "all":
        return DEFAULT_COURTS
    mapped = COURT_TYPE_MAP.get(court.lower())
    return [mapped] if mapped else DEFAULT_COURTS


def parse_result(item: dict) -> SearchResult:
    doc_id    = item.get("documentId", "")
    court     = item.get("mahkemeAdi") or item.get("birimAdi") or "Mahkeme"
    esas      = item.get("esasNo") or item.get("dosyaNo") or ""
    karar_no  = item.get("kararNo") or item.get("kararNumarasi")
    tarih     = item.get("kararTarihi") or item.get("tarih")
    konu      = item.get("konu") or item.get("konuAdi") or item.get("icerik") or ""
    ozet      = item.get("kararOzeti") or item.get("ozet") or item.get("icerik") or konu

    # Tarih normalleştirme
    date_str: Optional[str] = None
    if tarih:
        try:
            # Farklı formatlar gelebilir: "2024-01-15", "15.01.2024", timestamp
            if isinstance(tarih, (int, float)):
                date_str = datetime.fromtimestamp(tarih / 1000).strftime("%Y-%m-%d")
            elif "T" in str(tarih):
                date_str = str(tarih)[:10]
            elif "." in str(tarih):
                parts = str(tarih).split(".")
                if len(parts) == 3:
                    date_str = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
            else:
                date_str = str(tarih)[:10]
        except Exception:
            date_str = None

    return SearchResult(
        documentId=doc_id,
        court=court,
        case_number=esas,
        decision_number=karar_no,
        decision_date=date_str,
        subject=konu[:200] if konu else "Karar",
        summary=ozet[:500] if ozet else "",
        source_url=f"https://mevzuat.adalet.gov.tr/ictihat/{doc_id}",
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mizanim-emsal-api", "version": "1.0.0"}


@app.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=2, description="Arama sorgusu"),
    court: Optional[str] = Query(None, description="yargitay|danistay|anayasa|bam_hukuk|bam_ceza|all"),
    page: int = Query(1, ge=1, le=50),
    date_start: Optional[str] = Query(None, description="YYYY-MM-DD"),
    date_end: Optional[str] = Query(None, description="YYYY-MM-DD"),
):
    court_types = map_court_types(court)

    payload = {
        "data": {
            "pageSize": 10,
            "pageNumber": page,
            "itemTypeList": court_types,
            "phrase": q,
            "birimAdi": None,
            "kararTarihiStart": to_iso(date_start),
            "kararTarihiEnd": to_iso(date_end, end=True),
        }
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(BEDESTEN_SEARCH, json=payload, headers=HEADERS)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Bedesten API yanıt vermedi (timeout)")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Bedesten API hatası: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Bedesten bağlantı hatası: {str(e)}")

    raw_list = (data.get("data") or {}).get("emsalKararList") or []
    total    = (data.get("data") or {}).get("total") or len(raw_list)

    results = []
    for item in raw_list:
        try:
            results.append(parse_result(item))
        except Exception:
            continue

    return SearchResponse(results=results, total=total, page=page, query=q)


@app.get("/document/{document_id}", response_model=DocumentResponse)
async def get_document(document_id: str):
    payload = {"data": {"documentId": document_id}}

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(BEDESTEN_DOC, json=payload, headers=HEADERS)
            resp.raise_for_status()
            data = resp.json()
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Bedesten API timeout")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Bedesten hatası: {e.response.status_code}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    content = (data.get("data") or {}).get("icerik") or (data.get("data") or {}).get("content") or ""

    if not content:
        raise HTTPException(status_code=404, detail="Belge bulunamadı veya içerik boş")

    return DocumentResponse(
        documentId=document_id,
        content=content,
        source_url=f"https://mevzuat.adalet.gov.tr/ictihat/{document_id}",
    )
