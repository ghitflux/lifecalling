import os
import re
import asyncio
import sys
from typing import Literal, Optional

from fastapi import FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
from xml.etree.ElementTree import Element, SubElement, tostring  # stdlib
from playwright.sync_api import sync_playwright
from playwright.async_api import TimeoutError as PWTimeout

# Windows-specific fix for asyncio event loop - must be set before any async operations
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


APP_TITLE = "NFCe RJ Scraper API"
HEADLESS = os.getenv("HEADLESS", "1") != "0"
NAV_TIMEOUT_MS = int(os.getenv("NAV_TIMEOUT_MS", "25000"))   # 25s
WAIT_AFTER_LOAD_MS = int(os.getenv("WAIT_AFTER_LOAD_MS", "800"))  # ms
USER_AGENT = os.getenv(
    "USER_AGENT",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
)

app = FastAPI(title=APP_TITLE, version="1.0.0")

# CORS liberado para facilitar testes locais
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)


def _br_money_to_float(s: str) -> Optional[float]:
    if not s:
        return None
    s = s.strip()
    # remove separador de milhar "." e troca "," por "."
    s = s.replace(".", "").replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def _to_xml(payload: dict) -> bytes:
    root = Element("nfce_rj")
    for k, v in payload.items():
        node = SubElement(root, k)
        node.text = "" if v is None else str(v)
    # tostring retorna bytes (utf-8 por padrão)
    return tostring(root, encoding="utf-8", xml_declaration=True)


def _parse_nfce_html(html: str) -> dict:
    """
    Extrai:
      - valor_total_br (string "9,36")
      - valor_total (float 9.36)
      - chave_acesso (44 dígitos, sem espaços)
      - qtd_itens (opcional)
    """
    soup = BeautifulSoup(html, "lxml")
    full_text = soup.get_text(" ", strip=True)

    # Valor a pagar R$: - múltiplos padrões
    valor_br = None
    valor_patterns = [
        r"Valor a pagar R\$[:\s]*([0-9\.,]+)",
        r"Valor\s*a\s*pagar\s*R\$[:\s]*([0-9\.,]+)",
        r"Total\s*R\$[:\s]*([0-9\.,]+)",
        r"TOTAL[:\s]*R\$[:\s]*([0-9\.,]+)"
    ]
    for pattern in valor_patterns:
        m_valor = re.search(pattern, full_text, flags=re.I)
        if m_valor:
            valor_br = m_valor.group(1)
            break
    
    valor = _br_money_to_float(valor_br) if valor_br else None

    # Chave de acesso: - múltiplos padrões
    chave = None
    chave_patterns = [
        r"Chave de acesso[:\s]*([\d\s]{44,})",
        r"Chave[:\s]*([\d\s]{44,})",
        r"([0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4}\s+[0-9]{4})"
    ]
    for pattern in chave_patterns:
        m_chave = re.search(pattern, full_text, flags=re.I)
        if m_chave:
            chave = re.sub(r"\D", "", m_chave.group(1))
            if len(chave) >= 44:
                chave = chave[:44]
                break
    
    # Qtd total de itens - múltiplos padrões
    qtd_itens = None
    itens_patterns = [
        r"Qtd\.?\s*total\s*de\s*itens[:\s]*([0-9]+)",
        r"Qtd\s*total\s*de\s*itens[:\s]*([0-9]+)",
        r"Total\s*de\s*itens[:\s]*([0-9]+)",
        r"Quantidade\s*de\s*itens[:\s]*([0-9]+)"
    ]
    for pattern in itens_patterns:
        m_itens = re.search(pattern, full_text, flags=re.I)
        if m_itens:
            qtd_itens = int(m_itens.group(1))
            break

    return {
        "valor_total_br": valor_br,
        "valor_total": valor,
        "chave_acesso": chave,
        "qtd_itens": qtd_itens,
    }


def _scrape_nfce_rj_sync(url: str) -> dict:
    """
    Synchronous version of the scraper to avoid Windows async issues.
    """
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=HEADLESS)
        context = browser.new_context(
            user_agent=USER_AGENT,
            viewport={"width": 1366, "height": 800},
            locale="pt-BR",
        )
        page = context.new_page()
        target_html = None
        final_url = None

        try:
            # 1) ir para a URL do QRCode
            page.goto(url, wait_until="load", timeout=NAV_TIMEOUT_MS)

            # 2) aguardar redirect para a página de resultado (se acontecer)
            #    Em muitos casos o recaptcha é invisível e redireciona sozinho.
            try:
                page.wait_for_url("**/resultadoQRCode2.faces**", timeout=NAV_TIMEOUT_MS)
            except Exception:
                # pode ser que já esteja na página final ou que o redirect tenha demorado.
                pass

            # 3) aguardar rede estabilizar e um ping após load
            page.wait_for_load_state("domcontentloaded", timeout=NAV_TIMEOUT_MS)
            page.wait_for_timeout(WAIT_AFTER_LOAD_MS)

            # conteúdo coletado
            target_html = page.content()
            final_url = page.url

        finally:
            context.close()
            browser.close()

    if not target_html:
        raise HTTPException(status_code=502, detail="Falha ao carregar o HTML da NFC-e.")

    data = _parse_nfce_html(target_html)
    data["fonte_url_final"] = final_url
    data["fonte_url_inicial"] = url
    return data


async def _scrape_nfce_rj(url: str) -> dict:
    """
    Async wrapper that runs the sync scraper in a thread pool.
    """
    return await asyncio.to_thread(_scrape_nfce_rj_sync, url)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/nfce/rj/debug")
async def nfce_rj_debug(
    url: str = Query(..., description="URL completa do QRCode NFC-e do RJ (param p=)"),
    show_html: bool = Query(False, description="Mostrar HTML bruto para debug")
):
    """
    Endpoint de debug que retorna todos os dados extraídos, mesmo se não encontrar o valor.
    """
    if "QRCode?p=" not in url:
        raise HTTPException(status_code=400, detail="Forneça a URL do QRCode (contendo 'QRCode?p=').")

    # Capturar HTML bruto se solicitado
    if show_html:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=HEADLESS)
            context = browser.new_context(
                user_agent=USER_AGENT,
                viewport={"width": 1366, "height": 800},
                locale="pt-BR",
            )
            page = context.new_page()
            try:
                page.goto(url, wait_until="load", timeout=NAV_TIMEOUT_MS)
                try:
                    page.wait_for_url("**/resultadoQRCode2.faces**", timeout=NAV_TIMEOUT_MS)
                except Exception:
                    pass
                page.wait_for_load_state("domcontentloaded", timeout=NAV_TIMEOUT_MS)
                page.wait_for_timeout(WAIT_AFTER_LOAD_MS)
                html_content = page.content()
                return {"html": html_content[:5000]}  # Primeiros 5000 caracteres
            finally:
                context.close()
                browser.close()
    
    data = await _scrape_nfce_rj(url)
    return data

@app.get("/api/nfce/rj")
async def nfce_rj(
    url: str = Query(..., description="URL completa do QRCode NFC-e do RJ (param p=)"),
    out: Literal["json", "xml"] = Query("json", description="Formato de saída")
):
    """
    Ex: /api/nfce/rj?url= `https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=...&out=json`
    """
    # Recomendação: sempre use a URL ORIGINAL do QRCode (com ?p=...) para permitir o redirect.
    if "QRCode?p=" not in url:
        raise HTTPException(status_code=400, detail="Forneça a URL do QRCode (contendo 'QRCode?p=').")

    data = await _scrape_nfce_rj(url)

    # precisa pelo menos o valor_total
    if data.get("valor_total") is None and data.get("valor_total_br") is None:
        raise HTTPException(status_code=422, detail="Não foi possível extrair o valor da NFC-e.")

    if out == "xml":
        xml_bytes = _to_xml(data)
        return Response(content=xml_bytes, media_type="application/xml")
    return data
