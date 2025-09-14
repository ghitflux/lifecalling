from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group

User = get_user_model()

USERS = [
    # email, username, password, role, flags
    ("atendente@callinger.com",   "atendente",   "zLtf78iI&e0K",   "atendente",  dict(is_staff=False, is_superuser=False)),
    ("calculista@callinger.com",  "calculista",  "BSD1626VTL!8",   "calculista", dict(is_staff=False, is_superuser=False)),
    ("supervisor@callinger.com",  "supervisor",  "F#QwZr0oBDFJ",   "supervisor", dict(is_staff=True,  is_superuser=False)),
    ("gerente@callinger.com",     "gerente",     "Bn5ElJoDo0!@",   "gerente",    dict(is_staff=True,  is_superuser=False)),
    ("admin@callinger.com",       "admin",       "mMVgn@taV00U",   "admin",      dict(is_staff=True,  is_superuser=False)),
    ("superadmin@callinger.com",  "superadmin",  "2TCs4yN7a#@n",   "superadmin", dict(is_staff=True,  is_superuser=True)),
]

class Command(BaseCommand):
    help = "Cria usuários de demonstração por nível de acesso"

    def handle(self, *args, **options):
        # garante grupos
        role_names = ["atendente","calculista","supervisor","gerente","admin","superadmin"]
        groups = {name: Group.objects.get_or_create(name=name)[0] for name in role_names}

        for email, username, pwd, role, flags in USERS:
            user, created = User.objects.get_or_create(username=username, defaults={
                "email": email, **flags
            })
            if created:
                user.set_password(pwd)
                user.save()
                self.stdout.write(self.style.SUCCESS(f"User created: {username}"))
            else:
                self.stdout.write(f"User exists: {username}")
            # vincula ao grupo
            if role in groups:
                user.groups.add(groups[role])
        self.stdout.write(self.style.SUCCESS("Seed concluído."))