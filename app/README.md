# Pilotage Baromètre : application

Plateforme de gestion de projets internes (tableau de bord, jalons, tâches, équipes).

- **Interface** : Next.js 16, React 19, TypeScript, Tailwind CSS 4 (`frontend/`).
- **Serveur** : Django 5.2 LTS, Django REST Framework, PostgreSQL (`backend/`).
- **API** : `/api/v1/`, documentée en OpenAPI (`/api/docs/`, `/api/schema/`).

État : première tranche livrée, le **tableau de bord** (voir `docs/architecture/01_architecture.md`).

## Lancer en local (démonstration)

Prérequis : Python 3.12+, Node 22+.

```bash
# 1. Serveur Django
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
export DJANGO_DEBUG=1 APP_DEMO_TODAY=2026-10-14 DEMO_PASSWORD='choisir-un-mot-de-passe'
python manage.py migrate
python manage.py seed_demo          # données fictives (comptes : admin, mireille, sena, koffi, …)
python manage.py runserver 127.0.0.1:8000

# 2. Interface Next.js (autre terminal)
cd frontend
npm install
npm run dev                          # http://localhost:3000
```

Comptes de démonstration (mot de passe = `DEMO_PASSWORD`) :

| Compte | Rôle | Voit |
|---|---|---|
| `admin` | Administrateur | tous les projets |
| `mireille`, `sena`, `romuald`, `aicha` | Responsable | les projets dont il ou elle est responsable |
| `koffi`, `fatou`, `ibrahim`, `adjoa` | Membre | les projets où une tâche lui est assignée |

`APP_DEMO_TODAY` fixe la date de référence de la démonstration. **Ne pas la définir en production.**

## Tests et contrôles

```bash
cd backend && pytest && ruff check .
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

## Déployer sur Render

Voir `docs/deploiement-render.md` (démonstration gratuite : `render.yaml` ; production : `render.production.yaml`).

## Déployer sur un VPS

1. `cp .env.example .env` puis remplir **chaque** valeur (clé secrète, mot de passe de base, nom de domaine).
2. `docker compose up -d --build`
3. Créer le premier administrateur : `docker compose exec backend python manage.py createsuperuser` (ce compte est automatiquement administrateur de l’application).
4. Placer un reverse proxy (Nginx, Caddy) devant le port 3000 avec TLS.

Ne jamais lancer `seed_demo` en production.

## Sécurité (état actuel)

- Sessions par cookie `HttpOnly`, `SameSite=Lax`, protection CSRF, cookies `Secure` et HSTS hors mode debug.
- Droits par rôle appliqués **côté serveur** (administrateur, responsable, membre) et couverts par des tests.
- Limitation des tentatives de connexion (10 par minute), mots de passe de 10 caractères minimum.
- Aucun secret dans le code : tout vient de variables d'environnement ; `.env` est ignoré par Git.
- Base de données non exposée hors du réseau Docker ; interface liée à `127.0.0.1`.

À faire avant une mise en production : sauvegardes PostgreSQL planifiées, journalisation et supervision, revue de sécurité (OWASP ASVS), test de charge.

## Prochaines étapes

Écrans Projets, Tâches (kanban), Calendrier, Équipes, Administration ; création de projet ; import de Gantt ; assistant IA conversationnel ; notifications ; export PDF/Excel.

## Crédits

- Icônes : [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons) (Microsoft, licence MIT) et [Solar](https://www.figma.com/community/file/1166831539721848736) (480 Design, licence CC BY 4.0), via [Iconify](https://iconify.design). Liste des icônes utilisées : `frontend/scripts/generate-icons.mjs`.
