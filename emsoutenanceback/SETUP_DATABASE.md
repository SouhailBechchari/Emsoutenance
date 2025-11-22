# Configuration de la Base de Données

## Étape 1 : Créer le fichier .env

Créez un fichier `.env` dans le dossier `emsoutenanceback` avec le contenu suivant :

```env
APP_NAME="EMS Soutenance App"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_TIMEZONE=UTC
APP_URL=http://localhost:8000
APP_LOCALE=en
APP_FALLBACK_LOCALE=en
APP_FAKER_LOCALE=en_US
APP_MAINTENANCE_DRIVER=file
APP_MAINTENANCE_STORE=database

BCRYPT_ROUNDS=12

LOG_CHANNEL=stack
LOG_STACK=single
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=emsoutenance_db
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=database

CACHE_STORE=database
CACHE_PREFIX=

MEMCACHED_HOST=127.0.0.1

REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

VITE_APP_NAME="${APP_NAME}"

SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:3000,127.0.0.1:5173,127.0.0.1:3000
SESSION_DOMAIN=localhost
```

## Étape 2 : Créer la Base de Données MySQL

### Option A : Via phpMyAdmin (XAMPP)

1. Démarrez XAMPP et assurez-vous que MySQL est démarré
2. Ouvrez votre navigateur et allez sur `http://localhost/phpmyadmin`
3. Cliquez sur l'onglet **"Bases de données"**
4. Dans le champ "Nom de la base de données", entrez : `emsoutenance_db`
5. Choisissez l'interclassement : `utf8mb4_unicode_ci`
6. Cliquez sur **"Créer"**

### Option B : Via la ligne de commande MySQL

Ouvrez une invite de commande et exécutez :

```bash
mysql -u root -p
```

Puis dans MySQL :

```sql
CREATE DATABASE emsoutenance_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

## Étape 3 : Générer la clé d'application

Dans le terminal, allez dans le dossier `emsoutenanceback` et exécutez :

```bash
php artisan key:generate
```

Cela va générer et ajouter la clé `APP_KEY` dans votre fichier `.env`.

## Étape 4 : Installer les dépendances (si pas déjà fait)

```bash
composer install
```

## Étape 5 : Exécuter les migrations

```bash
php artisan migrate
```

Cette commande va créer toutes les tables dans votre base de données :
- users
- students
- professors
- reports
- remarks
- defenses
- jury_defense
- cache
- jobs
- sessions

## Étape 6 : Publier Sanctum (si nécessaire)

```bash
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

## Vérification

Pour vérifier que tout fonctionne, vous pouvez :

1. Vérifier dans phpMyAdmin que toutes les tables ont été créées
2. Démarrer le serveur Laravel : `php artisan serve`
3. Tester l'API sur `http://localhost:8000/api`

## Note sur les mots de passe MySQL

Si vous avez un mot de passe pour MySQL, modifiez dans le fichier `.env` :
```env
DB_PASSWORD=votre_mot_de_passe
```

## Alternative : Utiliser SQLite (Plus simple pour le développement)

Si vous préférez utiliser SQLite au lieu de MySQL, modifiez dans le fichier `.env` :

```env
DB_CONNECTION=sqlite
# Commentez ou supprimez les lignes DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD
```

Le fichier SQLite est déjà créé : `database/database.sqlite`








