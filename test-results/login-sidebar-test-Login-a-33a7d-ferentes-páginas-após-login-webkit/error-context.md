# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "Lifecalling" [level=3] [ref=e5]
      - paragraph [ref=e6]: Entre com suas credenciais para acessar o sistema
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [disabled] [ref=e11]: admin@demo.local
        - generic [ref=e12]:
          - generic [ref=e13]: Senha
          - textbox "Senha" [disabled] [ref=e14]: "123456"
        - button "Entrando..." [disabled]
      - button "Ver Credenciais Demo" [ref=e16] [cursor=pointer]:
        - img
        - text: Ver Credenciais Demo
  - region "Notifications alt+T"
  - generic [ref=e21] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
      - img [ref=e23] [cursor=pointer]
    - generic [ref=e28] [cursor=pointer]:
      - button "Open issues overlay" [ref=e29] [cursor=pointer]:
        - generic [ref=e30] [cursor=pointer]:
          - generic [ref=e31] [cursor=pointer]: "0"
          - generic [ref=e32] [cursor=pointer]: "1"
        - generic [ref=e33] [cursor=pointer]: Issue
      - button "Collapse issues badge" [ref=e34] [cursor=pointer]:
        - img [ref=e35] [cursor=pointer]
  - alert [ref=e37]
```