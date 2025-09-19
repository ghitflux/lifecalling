import re

INET_HEADER_RE = re.compile(r"Entidade:\s*(.+?)\s{2,}Refer", re.IGNORECASE)
INET_REF_RE = re.compile(r"Refer[eê]ncia:\s*(\d{2}/\d{4})", re.IGNORECASE)

def parse_inetconsig_text(text: str):
    """
    Retorna itens mínimos com banco + competência:
    [
      {"cpf": "...", "matricula": "...", "banco": "...", "competencia": "MM/AAAA"}
    ]
    """
    txt = text or ""
    banco = "INDEFINIDO"
    m = INET_HEADER_RE.search(txt)
    if m:
        banco = m.group(1).strip()

    comp = "00/0000"
    m2 = INET_REF_RE.search(txt)
    if m2:
        comp = m2.group(1).strip()

    items = []
    for line in txt.splitlines():
        if not re.match(r"^\s*\d+\s+\S+", line):
            continue
        # CPF = últimos 11 dígitos
        mcpf = re.search(r"(\d{11})\s*$", line)
        if not mcpf:
            continue
        cpf = mcpf.group(1)
        # Matrícula = token após o status
        mm = re.match(r"^\s*\d+\s+(\S+)", line)
        if not mm:
            continue
        matricula = mm.group(1)
        items.append({"cpf": cpf, "matricula": matricula, "banco": banco, "competencia": comp})
    return items
