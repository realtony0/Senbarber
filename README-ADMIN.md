# 221 SEN BARBER — Comptes clients & Page admin

## Accès
- **Espace client** : `compte.html` (inscription / connexion avec téléphone + PIN 6 chiffres, réservation, suivi).
- **Administration** : `admin.html` — voir et gérer toutes les réservations + liste des clients.

### Mot de passe admin
Par défaut : **`senbarber221`**
Pour le changer : dans `store.js`, remplacer `ADMIN_PASS_HASH` par le hash SHA-256 de votre nouveau mot de passe.
(Générer un hash : sur https://emn178.github.io/online-tools/sha256.html — collez le mot de passe, copiez le résultat.)

---

## ⚠️ Mode actuel : DÉMO (données locales)
Aujourd'hui, les comptes et réservations sont stockés **dans le navigateur** (localStorage).
➡️ **Conséquence** : une réservation faite sur le téléphone d'un client **n'apparaît PAS** sur l'écran du salon — chaque appareil a ses propres données.

C'est parfait pour tester le rendu. Pour un usage réel, il faut une base de données partagée.

---

## ✅ Passer en ligne réel (partagé partout) — Supabase (gratuit)

1. Créer un compte sur https://supabase.com → **New project**.
2. Dans **SQL Editor**, coller et exécuter le schéma ci-dessous.
3. Dans **Settings → API**, copier `Project URL` et `anon public key`.
4. Me transmettre ces 2 valeurs : je remplace la couche `store.js` par les appels Supabase (fonctions RPC sécurisées, PIN haché côté serveur avec `pgcrypto`).

### Schéma SQL de base
```sql
create extension if not exists pgcrypto;

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  client_name text, client_phone text,
  barber text, service text, date date, time text, note text,
  status text default 'En attente',
  created_at timestamptz default now()
);

-- Accès direct bloqué : tout passe par des fonctions sécurisées (RPC)
alter table clients enable row level security;
alter table bookings enable row level security;
```
(Les fonctions RPC `register_client`, `login_client`, `create_booking`, `admin_*` seront ajoutées lors du branchement.)
