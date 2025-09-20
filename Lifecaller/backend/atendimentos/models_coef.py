from django.db import models


class Coeficiente(models.Model):
    banco = models.CharField(max_length=128, db_index=True)
    parcelas = models.PositiveIntegerField(db_index=True)
    coeficiente = models.DecimalField(max_digits=12, decimal_places=7)

    class Meta:
        unique_together = ("banco", "parcelas")
        ordering = ["banco", "parcelas"]

    def __str__(self) -> str:  # pragma: no cover - simple display helper
        return f"{self.banco} / {self.parcelas}x → {self.coeficiente}"
