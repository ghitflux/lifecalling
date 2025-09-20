# Ensure Django discovers all models defined across modules within this app.
from . import models  # noqa: F401
from . import models_coef  # noqa: F401
