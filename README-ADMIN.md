# 221 SEN BARBER — Comptes clients & Page admin

## Accès
- **Espace client** : `compte.html` (inscription / connexion avec téléphone + PIN 6 chiffres, réservation, suivi).
- **Espaces personnel** : `admin.html` — chacun choisit son espace et entre son mot de passe.

### Comptes du personnel (mots de passe par défaut — À CHANGER)
| Espace | Accès | Mot de passe |
|---|---|---|
| **Gérant** | voit TOUT le salon, assigne/supprime | `gerant221` |
| **Bocar** | voit uniquement SES rendez-vous | `bocar221` |
| **Do** | voit uniquement SES rendez-vous | `do221` |
| **Vito** | voit uniquement SES rendez-vous | `vito221` |

- Un **coiffeur** ne voit que les réservations qui lui sont assignées + ses clients, et peut changer leur statut.
- Le **gérant** voit toutes les réservations, peut **réassigner** un rendez-vous à un autre coiffeur, changer les statuts et supprimer.

Pour changer un mot de passe : dans `store.js`, remplacer le `passHash` du compte par le hash SHA-256 du nouveau mot de passe (ex. sur https://emn178.github.io/online-tools/sha256.html).

---

## ✅ Mode actuel : EN LIGNE (Supabase — partagé partout)
Les comptes et réservations sont stockés sur **Supabase**. Une réservation faite
sur le téléphone d'un client apparaît **immédiatement** dans l'espace du coiffeur
concerné et dans celui du gérant, sur **n'importe quel appareil**.

- Projet Supabase : `dewnediinhuqyhjttzfk`
- Le site utilise uniquement la **clé anon (publique)**. Les PIN et mots de passe
  sont hachés côté serveur (bcrypt via `pgcrypto`) et ne sont jamais lisibles.
- L'accès direct aux tables est bloqué (RLS) : tout passe par des fonctions
  sécurisées (`register_client`, `login_client`, `create_booking`,
  `staff_login`, `staff_bookings`, etc.).

### 🔐 Sécurité — à faire
1. **Régénérer** la clé `service_role` et le *access token* Supabase (ils ont été
   partagés pendant la mise en place). La clé anon peut rester.
2. **Changer les mots de passe** du personnel avant l'ouverture au public
   (voir ci-dessous).

### Changer un mot de passe du personnel
Dans le **SQL Editor** de Supabase, exécuter (exemple pour Bocar) :
```sql
update staff set pass_hash = crypt('NOUVEAU_MOT_DE_PASSE', gen_salt('bf'))
where name = 'Bocar';
```
