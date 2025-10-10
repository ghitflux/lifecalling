#!/usr/bin/env python
"""
Script para criar dados de teste para o sistema Lifecaller
"""
import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lifecaller_backend.settings')
django.setup()

from django.contrib.auth.models import User, Group
from atendimentos.models import Atendimento, AtendimentoEvent, AtendimentoSimulacao
from django.utils import timezone
import random
from decimal import Decimal

def create_groups():
    """Criar grupos de usuários"""
    groups = [
        'atendente',
        'calculista',
        'supervisor',
        'gerente',
        'admin',
        'superadmin'
    ]

    created_groups = {}
    for group_name in groups:
        group, created = Group.objects.get_or_create(name=group_name)
        created_groups[group_name] = group
        print(f"[OK] Grupo '{group_name}' {'criado' if created else 'ja existe'}")

    return created_groups

def create_test_users(groups):
    """Criar usuários de teste"""
    users_data = [
        {
            'username': 'admin',
            'email': 'admin@lifecaller.com',
            'password': 'admin123',
            'first_name': 'Super',
            'last_name': 'Admin',
            'groups': ['superadmin', 'admin'],
            'is_superuser': True,
            'is_staff': True
        },
        {
            'username': 'gerente1',
            'email': 'gerente@lifecaller.com',
            'password': 'gerente123',
            'first_name': 'Maria',
            'last_name': 'Silva',
            'groups': ['gerente']
        },
        {
            'username': 'supervisor1',
            'email': 'supervisor@lifecaller.com',
            'password': 'supervisor123',
            'first_name': 'Joao',
            'last_name': 'Santos',
            'groups': ['supervisor']
        },
        {
            'username': 'atendente1',
            'email': 'atendente1@lifecaller.com',
            'password': 'atendente123',
            'first_name': 'Ana',
            'last_name': 'Costa',
            'groups': ['atendente']
        },
        {
            'username': 'atendente2',
            'email': 'atendente2@lifecaller.com',
            'password': 'atendente123',
            'first_name': 'Pedro',
            'last_name': 'Oliveira',
            'groups': ['atendente']
        },
        {
            'username': 'calculista1',
            'email': 'calculista@lifecaller.com',
            'password': 'calculista123',
            'first_name': 'Roberto',
            'last_name': 'Almeida',
            'groups': ['calculista']
        }
    ]

    created_users = {}
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            username=user_data['username'],
            defaults={
                'email': user_data['email'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'is_superuser': user_data.get('is_superuser', False),
                'is_staff': user_data.get('is_staff', False)
            }
        )

        if created:
            user.set_password(user_data['password'])
            user.save()
            print(f"[OK] Usuario '{user_data['username']}' criado")
        else:
            print(f"[INFO] Usuario '{user_data['username']}' ja existe")

        # Adicionar aos grupos
        for group_name in user_data['groups']:
            if group_name in groups:
                user.groups.add(groups[group_name])

        created_users[user_data['username']] = user

    return created_users

def create_test_atendimentos(users):
    """Criar atendimentos de teste"""
    bancos = ['banco_do_brasil', 'caixa', 'itau', 'bradesco', 'santander']
    stages = ['esteira_global', 'atendente', 'calculista', 'atendente_pos_sim', 'gerente_fechamento']

    # Dados de exemplo realistas
    cpfs = [
        '123.456.789-01', '987.654.321-02', '111.222.333-44',
        '555.666.777-88', '999.888.777-66', '444.333.222-11',
        '777.888.999-00', '222.333.444-55', '666.777.888-99',
        '333.444.555-66', '888.999.000-11', '111.000.999-88'
    ]

    matriculas = [
        'MAT001234', 'MAT005678', 'MAT009999', 'MAT001111',
        'MAT002222', 'MAT003333', 'MAT004444', 'MAT005555',
        'MAT006666', 'MAT007777', 'MAT008888', 'MAT009999'
    ]

    for i in range(20):
        cpf = cpfs[i % len(cpfs)]
        matricula = matriculas[i % len(matriculas)]
        banco = random.choice(bancos)
        stage = random.choice(stages)

        # Atribuir owner se o stage for 'atendente'
        owner = None
        if stage == 'atendente':
            owner = users.get('atendente1') if i % 2 == 0 else users.get('atendente2')

        atendimento, created = Atendimento.objects.get_or_create(
            cpf=cpf,
            matricula=matricula,
            defaults={
                'banco': banco,
                'stage': stage,
                'owner_atendente': owner,
            }
        )

        if created:
            # Criar evento inicial
            AtendimentoEvent.objects.create(
                atendimento=atendimento,
                from_stage='',
                to_stage=stage,
                actor=users['admin'],
                note=f'Atendimento criado automaticamente - {banco}'
            )

            # Criar simulação para alguns atendimentos
            if stage in ['calculista', 'atendente_pos_sim', 'gerente_fechamento']:
                valor_liberado = Decimal(str(round(random.uniform(5000, 50000), 2)))
                parcela = Decimal(str(round(random.uniform(500, 2000), 2)))

                AtendimentoSimulacao.objects.create(
                    atendimento=atendimento,
                    parcela=parcela,
                    coeficiente=Decimal('0.0456789'),
                    saldo_devedor=valor_liberado,
                    seguro_banco=Decimal('100.00'),
                    percentual_co=Decimal('0.1200'),
                    prazo_meses=random.randint(12, 84),
                    pv_total_financiado=valor_liberado,
                    valor_liberado=valor_liberado,
                    valor_liquido=valor_liberado * Decimal('0.95'),
                    custo_consultoria=valor_liberado * Decimal('0.05'),
                    liberado_cliente=valor_liberado * Decimal('0.90')
                )

            print(f"[OK] Atendimento {atendimento.id} criado - {cpf} ({stage})")

    print(f"[INFO] Total de atendimentos: {Atendimento.objects.count()}")

def print_credentials():
    """Imprimir credenciais para teste"""
    print("\n" + "="*60)
    print("CREDENCIAIS PARA TESTE")
    print("="*60)

    credentials = [
        ("Super Admin", "admin", "admin123", "Acesso total ao sistema"),
        ("Gerente", "gerente1", "gerente123", "Dashboard de fechamento"),
        ("Supervisor", "supervisor1", "supervisor123", "Dashboard de supervisao"),
        ("Atendente 1", "atendente1", "atendente123", "Esteira de atendimento"),
        ("Atendente 2", "atendente2", "atendente123", "Esteira de atendimento"),
        ("Calculista", "calculista1", "calculista123", "Dashboard de calculos")
    ]

    for perfil, username, password, descricao in credentials:
        print(f"[USER] {perfil}")
        print(f"   Usuario: {username}")
        print(f"   Senha: {password}")
        print(f"   Acesso: {descricao}")
        print()

def main():
    print("Criando dados de teste para Lifecaller...")
    print()

    # Criar grupos
    groups = create_groups()
    print()

    # Criar usuários
    users = create_test_users(groups)
    print()

    # Criar atendimentos
    create_test_atendimentos(users)
    print()

    # Imprimir credenciais
    print_credentials()

    print("[OK] Dados de teste criados com sucesso!")
    print("\nAcesse: http://localhost:5173")
    print("API Docs: http://127.0.0.1:8000/api/docs/")

if __name__ == '__main__':
    main()