# Scripts cURL - Lifecalling API

## Autenticação

### Login
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.local","password":"123456"}' \
  -c cookies.txt \
  http://localhost:8000/auth/login
```

### Logout
```bash
curl -X POST -b cookies.txt http://localhost:8000/auth/logout
```

## Cases

### Listar casos
```bash
curl -b cookies.txt "http://localhost:8000/cases?limit=10"
```

### Detalhes de um caso
```bash
curl -b cookies.txt http://localhost:8000/cases/46
```

### Atribuir caso
```bash
curl -X POST -b cookies.txt http://localhost:8000/cases/45/assign
```

### Atualizar caso (PATCH)
```bash
curl -X PATCH -H "Content-Type: application/json" \
  -d '{"telefone_preferencial":"11987654321","observacoes":"Teste de observação"}' \
  -b cookies.txt \
  http://localhost:8000/cases/45
```

## Anexos

### Upload de anexo
```bash
curl -X POST -F "file=@test_attachment.txt" \
  -b cookies.txt \
  http://localhost:8000/cases/45/attachments
```

## Importação

### Importar arquivo TXT
```bash
curl -X POST -F "file=@dados.txt" \
  -b cookies.txt \
  http://localhost:8000/imports
```

### Detalhes do batch de importação
```bash
curl -b cookies.txt http://localhost:8000/imports/2
```

## WebSocket

### Teste de conexão WebSocket (via HTML)
Abrir `test_websocket.html` no navegador para testar conexão em `ws://localhost:8000/ws`

## Documentação

### OpenAPI Docs (Swagger UI)
```
http://localhost:8000/docs
```

### OpenAPI JSON
```
http://localhost:8000/openapi.json
```