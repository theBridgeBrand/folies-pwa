# Configuration PayGreen pour Folies Food

Ce document explique comment configurer l'intégration PayGreen pour accepter les tickets restaurant.

## Variables d'environnement

Les variables suivantes doivent être configurées dans votre projet Supabase :

### Dans les Edge Functions Secrets

1. Connectez-vous à votre dashboard Supabase
2. Allez dans **Edge Functions** > **Settings**
3. Ajoutez les secrets suivants :

```bash
PAYGREEN_API_KEY=votre_cle_api_paygreen
PAYGREEN_SHOP_ID=votre_shop_id_paygreen
```

## Obtenir vos identifiants PayGreen

1. Connectez-vous à votre compte PayGreen : https://dashboard.paygreen.fr
2. Allez dans **Configuration** > **API**
3. Copiez votre **Clé API** et votre **Shop ID**

## Fonctionnalités implémentées

### 1. Enregistrement de carte restaurant

Les utilisateurs peuvent enregistrer leur carte restaurant PayGreen (Swile, Conecs, etc.) depuis leur profil.

**Flow :**
- L'utilisateur clique sur "Ajouter une carte restaurant PayGreen"
- Il est redirigé vers le formulaire sécurisé PayGreen
- Après validation, la carte est enregistrée dans le profil
- Les informations stockées : `paygreen_card_id`, `paygreen_card_last4`, `paygreen_card_type`

### 2. Paiement Scan&Pay

Les utilisateurs peuvent choisir entre deux modes de paiement :
- **NFC** : Paiement sans contact avec le téléphone (Apple Pay, Google Pay)
- **PayGreen** : Paiement avec la carte restaurant enregistrée

**Flow :**
- L'utilisateur ouvre le Scan&Pay
- Il sélectionne son moyen de paiement préféré
- Le paiement est traité via l'API PayGreen
- Le frigo se déverrouille avec un code unique

## Edge Functions déployées

### 1. `paygreen-register-card`
Initie le processus d'enregistrement de carte.

**Endpoint :** `{SUPABASE_URL}/functions/v1/paygreen-register-card`

**Requête :**
```json
{
  "user_id": "uuid"
}
```

**Réponse :**
```json
{
  "success": true,
  "redirect_url": "https://paygreen.fr/..."
}
```

### 2. `paygreen-unlock`
Déverrouille le frigo et effectue le paiement.

**Endpoint :** `{SUPABASE_URL}/functions/v1/paygreen-unlock`

**Requête :**
```json
{
  "user_id": "uuid",
  "fridge_id": "uuid",
  "card_id": "instrument_id_paygreen"
}
```

**Réponse :**
```json
{
  "success": true,
  "order_id": "uuid",
  "unlock_code": "123456"
}
```

### 3. `paygreen-card-callback`
Webhook pour recevoir les confirmations PayGreen.

**Endpoint :** `{SUPABASE_URL}/functions/v1/paygreen-card-callback`

Cette fonction est appelée automatiquement par PayGreen après chaque transaction.

## Base de données

### Colonnes ajoutées à la table `users`

```sql
paygreen_card_id text           -- Token de la carte PayGreen
paygreen_card_last4 text         -- 4 derniers chiffres pour affichage
paygreen_card_type text          -- Type de carte (swile, conecs, etc.)
default_payment_method text      -- 'nfc' ou 'paygreen'
```

### Méthode de paiement ajoutée à `orders`

La valeur `'paygreen'` a été ajoutée aux méthodes de paiement acceptées.

## Environnement de test

Pour tester l'intégration :

1. Utilisez les identifiants de test PayGreen (disponibles sur leur dashboard)
2. Créez un compte utilisateur dans l'app
3. Allez dans le profil et ajoutez une carte restaurant
4. Testez le Scan&Pay avec PayGreen

## Support des tickets restaurant

PayGreen accepte les principales cartes restaurant :
- Swile (anciennement Lunchr)
- Conecs
- Edenred
- Sodexo
- Up Déjeuner
- Et autres cartes compatibles

## Sécurité

- Les clés API ne sont jamais exposées côté client
- Les tokens de carte sont stockés de manière sécurisée
- Les paiements sont traités côté serveur via Edge Functions
- L'authentification JWT est requise pour toutes les opérations

## Documentation PayGreen

Pour plus d'informations sur l'API PayGreen :
- Documentation : https://paygreen.fr/documentation
- Support : support@paygreen.fr
