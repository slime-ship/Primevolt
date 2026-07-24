from .base import *

DEBUG = True

import sys

if 'test' in sys.argv:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': 'postgres',
            'USER': 'postgres.shwqffzzmekqjlvfnnpm',
            'PASSWORD': '0neBGMIcpYp4mzQu',
            'HOST': 'aws-0-eu-west-1.pooler.supabase.com',
            'PORT': '6543',
        }
    }


import os
EMAIL_BACKEND = os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend')

