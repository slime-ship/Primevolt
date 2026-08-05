import random
from django.db import migrations, models


def generate_transaction_codes(apps, schema_editor):
    """Generate unique transaction codes for existing withdrawals."""
    Withdrawal = apps.get_model('withdrawals', 'Withdrawal')
    existing_codes = set()
    for withdrawal in Withdrawal.objects.all():
        while True:
            code = f"PV-WD-{random.randint(100000, 999999)}"
            if code not in existing_codes:
                existing_codes.add(code)
                break
        withdrawal.transaction_code = code
        withdrawal.save(update_fields=['transaction_code'])


class Migration(migrations.Migration):

    dependencies = [
        ('withdrawals', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='withdrawal',
            name='account_name',
            field=models.CharField(blank=True, max_length=150),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='account_number',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='bank_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='country',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='crypto_address',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='crypto_coin',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='crypto_network',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='paypal_email',
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='swift_code',
            field=models.CharField(blank=True, max_length=50),
        ),
        # Add transaction_code WITHOUT unique constraint first (to allow blank for existing rows)
        migrations.AddField(
            model_name='withdrawal',
            name='transaction_code',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='withdrawal',
            name='withdrawal_method',
            field=models.CharField(choices=[('BANK_TRANSFER', 'Bank Transfer'), ('CRYPTOCURRENCY', 'Cryptocurrency'), ('PAYPAL', 'PayPal')], default='CRYPTOCURRENCY', max_length=30),
        ),
        migrations.AlterField(
            model_name='withdrawal',
            name='address',
            field=models.CharField(blank=True, max_length=255),
        ),
        # Populate existing rows with unique codes
        migrations.RunPython(generate_transaction_codes, migrations.RunPython.noop),
        # Now apply the unique constraint
        migrations.AlterField(
            model_name='withdrawal',
            name='transaction_code',
            field=models.CharField(blank=True, max_length=50, unique=True),
        ),
    ]
