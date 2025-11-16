#!/usr/bin/env python3
"""
Demonstração da API NFCe com dados reais extraídos da URL fornecida
Mostra as respostas em JSON e XML baseadas nos dados da NFCe real
"""
import json
from xml.etree.ElementTree import Element, SubElement, tostring
from xml.dom import minidom

def create_nfce_data():
    """Cria dados baseados na NFCe real fornecida"""
    return {
        "chave_acesso": "33250901829249000177651010005539591306875555",
        "valor_total": 9.36,
        "valor_total_br": "9,36",
        "qtd_itens": 2,
        "cnpj_emitente": "01.829.249/0001-77",
        "nome_emitente": "CEREAIS MARREQUINHO DE NOVA CAMPINAS LTDA",
        "endereco_emitente": "AVENIDA B, 480, LOJA, NOVA CAMPINAS, DUQUE DE CAXIAS, RJ",
        "itens": [
            {
                "descricao": "Oleo Soja Soya Pet 900",
                "codigo": "7891107101621",
                "quantidade": "1UN",
                "valor_unitario": 9.29,
                "valor_total": 9.29
            },
            {
                "descricao": "Sacola Plast Peq Re un",
                "codigo": "2", 
                "quantidade": "1UN",
                "valor_unitario": 0.07,
                "valor_total": 0.07
            }
        ],
        "pagamento": {
            "forma": "Dinheiro",
            "valor_pago": 10.00,
            "troco": 0.64
        },
        "fonte_url_final": "https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=33250901829249000177651010005539591306875555|2|1|1|E1F680232ED4077DA8625F4168EB3D3ED2085E42"
    }

def data_to_xml(data):
    """Converte os dados para XML usando a mesma lógica da API"""
    root = Element("nfce")
    
    # Adiciona elementos básicos
    for key, value in data.items():
        if key == "itens":
            itens_elem = SubElement(root, "itens")
            for item in value:
                item_elem = SubElement(itens_elem, "item")
                for item_key, item_value in item.items():
                    item_child = SubElement(item_elem, item_key)
                    item_child.text = str(item_value)
        elif key == "pagamento":
            pagamento_elem = SubElement(root, "pagamento")
            for pag_key, pag_value in value.items():
                pag_child = SubElement(pagamento_elem, pag_key)
                pag_child.text = str(pag_value)
        else:
            elem = SubElement(root, key)
            elem.text = str(value)
    
    # Formatar XML
    rough_string = tostring(root, encoding='unicode')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ", encoding=None)

def main():
    """Demonstra as respostas da API em JSON e XML"""
    
    print("=" * 80)
    print("DEMONSTRAÇÃO DA API NFCe - DADOS REAIS")
    print("=" * 80)
    print(f"URL testada: https://consultadfe.fazenda.rj.gov.br/consultaNFCe/QRCode?p=33250901829249000177651010005539591306875555|2|1|1|E1F680232ED4077DA8625F4168EB3D3ED2085E42")
    print("=" * 80)
    
    # Dados extraídos da NFCe real
    nfce_data = create_nfce_data()
    
    print("\n1. RESPOSTA JSON (out=json):")
    print("-" * 50)
    print(json.dumps(nfce_data, indent=2, ensure_ascii=False))
    
    print("\n\n2. RESPOSTA XML (out=xml):")
    print("-" * 50)
    xml_response = data_to_xml(nfce_data)
    print(xml_response)
    
    print("\n" + "=" * 80)
    print("RESUMO DOS DADOS EXTRAÍDOS:")
    print("=" * 80)
    print(f"• Estabelecimento: {nfce_data['nome_emitente']}")
    print(f"• CNPJ: {nfce_data['cnpj_emitente']}")
    print(f"• Endereço: {nfce_data['endereco_emitente']}")
    print(f"• Chave de Acesso: {nfce_data['chave_acesso']}")
    print(f"• Valor Total: R$ {nfce_data['valor_total_br']}")
    print(f"• Quantidade de Itens: {nfce_data['qtd_itens']}")
    print(f"• Forma de Pagamento: {nfce_data['pagamento']['forma']}")
    print(f"• Valor Pago: R$ {nfce_data['pagamento']['valor_pago']:.2f}")
    print(f"• Troco: R$ {nfce_data['pagamento']['troco']:.2f}")
    
    print("\nITENS COMPRADOS:")
    for i, item in enumerate(nfce_data['itens'], 1):
        print(f"  {i}. {item['descricao']} (Cód: {item['codigo']})")
        print(f"     Qtd: {item['quantidade']} | Valor Unit: R$ {item['valor_unitario']:.2f} | Total: R$ {item['valor_total']:.2f}")
    
    print("\n" + "=" * 80)
    print("API ENDPOINTS DISPONÍVEIS:")
    print("=" * 80)
    print("• Health Check: GET http://localhost:8000/health")
    print("• Debug: GET http://localhost:8000/api/nfce/rj/debug?url=<URL_NFCE>&show_html=false")
    print("• JSON: GET http://localhost:8000/api/nfce/rj?url=<URL_NFCE>&out=json")
    print("• XML: GET http://localhost:8000/api/nfce/rj?url=<URL_NFCE>&out=xml")
    print("=" * 80)

if __name__ == "__main__":
    main()