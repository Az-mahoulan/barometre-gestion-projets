FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv/backend

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
# Fichiers statiques de l'administration (servis par WhiteNoise)
RUN DJANGO_DEBUG=1 python manage.py collectstatic --noinput

RUN useradd --system --no-create-home app && chown -R app /srv/backend
USER app

EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--access-logfile", "-"]
