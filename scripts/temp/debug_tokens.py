line = "  1    000550-9  JOANA MARIA DOS SANTOS IBIAPIN 3-AGENTE SUPERIOR DE SERVICO   6490      001     088   096   025         458,04      001    47082976372"
remaining = line[:-11].rstrip()
tokens = remaining.split()

print(f"Total tokens: {len(tokens)}")
print("\nUltimos 10 tokens:")
for i in range(1, 11):
    print(f"  tokens[{-i}] = {tokens[-i]}")

print("\nMapeamento correto:")
print(f"  FIN = tokens[-7] = {tokens[-7]}")
print(f"  ORGAO = tokens[-6] = {tokens[-6]}")
print(f"  LANC = tokens[-5] = {tokens[-5]}")
print(f"  TOTAL = tokens[-4] = {tokens[-4]}")
print(f"  PAGO = tokens[-3] = {tokens[-3]}")
print(f"  VALOR = tokens[-2] = {tokens[-2]}")
print(f"  ORGAO_PGTO = tokens[-1] = {tokens[-1]}")