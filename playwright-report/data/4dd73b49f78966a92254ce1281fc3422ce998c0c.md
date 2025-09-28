# Page snapshot

```yaml
- generic [active]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - heading "Lifecalling" [level=3]
      - paragraph: Entre com suas credenciais para acessar o sistema
    - generic [ref=e4]:
      - generic:
        - generic:
          - generic [ref=e5]: Email
          - textbox "Email" [disabled] [ref=e6]: admin@demo.local
        - generic:
          - generic [ref=e7]: Senha
          - textbox "Senha" [disabled] [ref=e8]: "123456"
        - button "Entrando..." [disabled]
      - button "Ver Credenciais Demo" [ref=e9] [cursor=pointer]:
        - img
        - text: Ver Credenciais Demo
  - region "Notifications alt+T"
  - generic [ref=e14] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e15] [cursor=pointer]:
      - img [ref=e16] [cursor=pointer]
    - generic [ref=e21] [cursor=pointer]:
      - button "Open issues overlay" [ref=e22] [cursor=pointer]:
        - generic [ref=e23] [cursor=pointer]:
          - generic [ref=e24] [cursor=pointer]: "0"
          - generic [ref=e25] [cursor=pointer]: "1"
        - generic [ref=e26] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e27] [cursor=pointer]:
        - img [ref=e28] [cursor=pointer]
  - alert [ref=e30]
```