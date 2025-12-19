"""
Utilitários para cálculo de dias e horas úteis.
Exclui sábados e domingos do cálculo.
"""
from datetime import datetime, timedelta


def add_business_hours(start_dt: datetime, hours: int) -> datetime:
    """
    Adiciona horas úteis a uma data, pulando fins de semana (sábado e domingo).

    Assume que todas as horas do dia são úteis (24h/dia).
    Sábado = 5, Domingo = 6 (weekday())

    Args:
        start_dt: Data/hora inicial
        hours: Número de horas úteis a adicionar (ex: 48 para 48h úteis)

    Returns:
        datetime: Data/hora final após adicionar as horas úteis

    Exemplos:
        >>> # Sexta 14:00 + 48h úteis = Terça 14:00 (pula sáb/dom)
        >>> start = datetime(2025, 1, 10, 14, 0)  # Sexta
        >>> result = add_business_hours(start, 48)
        >>> # result = datetime(2025, 1, 14, 14, 0)  # Terça
    """
    current = start_dt
    remaining_hours = hours

    while remaining_hours > 0:
        # Se cair em fim de semana, pular para próxima segunda-feira às 00:00
        while current.weekday() >= 5:  # 5=Sábado, 6=Domingo
            days_to_add = (7 - current.weekday()) if current.weekday() == 6 else 2
            current += timedelta(days=days_to_add)
            current = current.replace(hour=0, minute=0, second=0, microsecond=0)

        # Calcular horas até fim do dia útil (24h)
        hours_until_end_of_day = 24 - (current.hour + current.minute / 60.0 + current.second / 3600.0)

        if remaining_hours <= hours_until_end_of_day:
            # Adicionar as horas restantes ao dia atual
            current += timedelta(hours=remaining_hours)
            remaining_hours = 0
        else:
            # Consumir o resto do dia e passar para o próximo
            current += timedelta(hours=hours_until_end_of_day)
            remaining_hours -= hours_until_end_of_day

            # Avançar para o próximo dia às 00:00
            current = current.replace(hour=0, minute=0, second=0, microsecond=0)
            current += timedelta(days=1)

            # Se o próximo dia for fim de semana, o loop while vai pular

    return current


def is_business_day(dt: datetime) -> bool:
    """
    Verifica se uma data é dia útil (segunda a sexta).

    Args:
        dt: Data a verificar

    Returns:
        bool: True se for dia útil, False se for fim de semana
    """
    return dt.weekday() < 5


def count_business_days_between(start_dt: datetime, end_dt: datetime) -> int:
    """
    Conta quantos dias úteis existem entre duas datas (inclusive).

    Args:
        start_dt: Data inicial
        end_dt: Data final

    Returns:
        int: Número de dias úteis entre as datas
    """
    if start_dt > end_dt:
        return 0

    current = start_dt.date()
    end = end_dt.date()
    business_days = 0

    while current <= end:
        if current.weekday() < 5:  # Segunda a sexta
            business_days += 1
        current += timedelta(days=1)

    return business_days
