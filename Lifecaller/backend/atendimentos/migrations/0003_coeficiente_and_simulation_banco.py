from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("atendimentos", "0002_alter_atendimento_options_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="Coeficiente",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("banco", models.CharField(db_index=True, max_length=128)),
                ("parcelas", models.PositiveIntegerField(db_index=True)),
                ("coeficiente", models.DecimalField(decimal_places=7, max_digits=12)),
            ],
            options={
                "ordering": ["banco", "parcelas"],
                "unique_together": {("banco", "parcelas")},
            },
        ),
        migrations.AddField(
            model_name="atendimentosimulacao",
            name="banco",
            field=models.CharField(blank=True, default="", max_length=128),
        ),
    ]
