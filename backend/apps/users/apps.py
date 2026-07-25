from django.apps import AppConfig

# Fix Python 3.14 compatibility for Django template Context.__copy__
try:
    from django.template.context import BaseContext, Context
    def _base_context_copy(self):
        obj = self.__class__.__new__(self.__class__)
        obj.__dict__.update(self.__dict__)
        if hasattr(self, 'dicts'):
            obj.dicts = [d.copy() for d in self.dicts]
        return obj
    BaseContext.__copy__ = _base_context_copy
    Context.__copy__ = _base_context_copy
except Exception:
    pass

class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'
