# Carte mentale collaborative — installation sur votre site

Contenu : `index.html` (application), `config.js` (vos clés), `claude-shim.js` (connexion à Supabase),
`schema.sql` (base de données), `supabase/functions/` (envoi d'e-mail et génération d'images).

## 1. Supabase (gratuit pour démarrer)
1. Créez un projet sur https://supabase.com.
2. SQL Editor : collez et exécutez `schema.sql`.
3. Authentication > Providers : activez **Anonymous sign-ins** (les participants n'ont pas de compte à créer).
4. Project Settings > API : copiez l'URL et la clé `anon` dans `config.js`.

## 2. Hébergement
Déposez `index.html`, `config.js` et `claude-shim.js` sur votre site (HTTPS). Les liens de partage ont la forme
`https://votre-site/index.html#CODE`.

## 3. Envoi du PDF par e-mail (depuis merah.fares99@gmail.com)
1. Activez la validation en deux étapes sur ce compte Google, puis créez un « mot de passe d'application ».
2. Avec la CLI Supabase (`npm i -g supabase`, `supabase login`, `supabase link --project-ref VOTRE-REF`) :
   ```
   supabase secrets set GMAIL_USER=merah.fares99@gmail.com GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
   supabase functions deploy send-mail
   ```
3. Dans `config.js` : `mailService:"https://VOTRE-REF.supabase.co/functions/v1/send-mail"`.
Si le SMTP Gmail est refusé depuis Supabase, utilisez un fournisseur (Resend, Brevo…) avec un domaine à vous :
un service tiers ne peut pas envoyer au nom d'une adresse @gmail.com.

## 4. Génération d'images par IA (optionnel)
```
supabase secrets set OPENAI_API_KEY=sk-...
supabase functions deploy generate-image
```
puis renseignez `imageService` dans `config.js`. Sans cela, l'onglet IA indique « non configurée ».

## Sécurité (à durcir avant un usage public)
- La clé `anon` est publique par conception ; c'est le RLS qui protège les données. Les règles fournies sont
  permissives : tout visiteur peut lire/écrire. Les droits animateur/participant sont appliqués côté interface seulement.
  Pour un usage sensible, restreignez les policies (ex. suppression réservée au créateur : `data->>'uid' = auth.uid()::text`).
- Les fonctions d'envoi d'e-mail et d'images peuvent être détournées : ajoutez une limite de débit ou restreignez l'origine.
