from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User

ROLES = ["atendente","calculista","gerente","financeiro","supervisor","admin"]

class Command(BaseCommand):
    help = "Cria grupos (papéis) e usuários demo (senha: 123456)."

    def handle(self, *args, **options):
        for role in ROLES:
            Group.objects.get_or_create(name=role)

        demos = {
            "at1": "atendente",
            "cal1": "calculista",
            "ger1": "gerente",
            "fin1": "financeiro",
            "sup1": "supervisor",
            "adm1": "admin",
        }
        for username, group in demos.items():
            user, created = User.objects.get_or_create(username=username)
            if created:
                user.set_password("123456")
                user.email = f"{username}@demo.local"
                user.save()
                self.stdout.write(f"Usuário criado: {username}/123456")
            user.groups.clear()
            user.groups.add(Group.objects.get(name=group))
        self.stdout.write(self.style.SUCCESS("Papéis e usuários demo prontos."))
