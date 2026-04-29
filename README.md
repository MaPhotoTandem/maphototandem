# Ma Photo Tandem — Site web

Site de vente de photos de sauts en tandem pour Parachute Montréal.

---

## Ce que le site fait

1. **Client** entre date + numéro d'envolée → voit ses photos
2. **Client** sélectionne les photos qu'il veut acheter
3. **Client** paie par carte via Stripe
4. **Client** télécharge ses photos en haute résolution (liens valides 24h)
5. **Photographe** uploade les photos via `/admin` après la journée de saut

---

## Avant de mettre en ligne — 4 choses à configurer

### 1. Cloudflare R2 (stockage photos)
- Créer un compte sur [cloudflare.com](https://cloudflare.com)
- Aller dans R2 → Créer un bucket nommé `ma-photo-tandem`
- Créer une clé API R2 (Access Key + Secret Key)
- Noter l'Account ID (visible dans le dashboard)

### 2. Stripe (paiements)
- Créer un compte sur [stripe.com](https://stripe.com)
- Récupérer les clés API dans Dashboard → Développeurs → Clés API
- Utiliser les clés **test** (pk_test_, sk_test_) d'abord
- Configurer le webhook : Dashboard → Développeurs → Webhooks → `https://ton-site.com/api/webhook`

### 3. Variables d'environnement
- Copier `.env.example` → `.env.local`
- Remplir toutes les valeurs

### 4. Vercel (hébergement)
- Créer un compte sur [vercel.com](https://vercel.com)
- Importer ce projet depuis GitHub
- Ajouter toutes les variables d'environnement dans Vercel Dashboard → Settings → Environment Variables

---

## Structure des fichiers

```
app/
  page.tsx              → Page d'accueil (formulaire date + envolée)
  galerie/[date]/[envol] → Galerie photos + panier
  success/              → Page après paiement réussi (téléchargements)
  admin/                → Interface upload pour les photographes
  api/
    photos/             → Récupère les photos d'une envolée depuis R2
    checkout/           → Crée une session de paiement Stripe
    webhook/            → Reçoit les confirmations de paiement Stripe
    upload/             → Génère des URLs d'upload sécurisées pour R2

components/
  GalleryClient.tsx     → Galerie interactive avec sélection et panier

lib/
  r2.ts                 → Connexion à Cloudflare R2
  stripe.ts             → Connexion à Stripe
  types.ts              → Définitions TypeScript
```

---

## Modifier le prix par photo

Dans `.env.local` :
```
PHOTO_PRICE_CENTS=1500   # 15.00 $CAD
```

---

## Utilisation quotidienne (photographes)

1. Aller sur `https://ton-site.com/admin`
2. Entrer le mot de passe
3. Sélectionner la date et le numéro d'envolée
4. Glisser les photos ou cliquer pour sélectionner
5. Cliquer "Envoyer" — les photos sont immédiatement disponibles pour les clients

---

## Notes de révision

**Hypothèses faites :**
- Prix par photo : 15 $CAD (variable d'environnement, facile à changer)
- Accès galerie par date + numéro d'envolée (pas d'authentification client)
- Photos disponibles 24h après achat (liens de téléchargement signés)
- Durée de disponibilité des photos : 30 jours mentionnés sur le site (non enforced côté code pour MVP)
- Devise : CAD

**À décider par Mylène :**
- Prix final par photo
- Durée de conservation des photos dans R2 (coût de stockage)
- Domaine personnalisé (ex: photos.maphototandem.com)
- Politique de remboursement à ajouter au site
- Couleurs/logo officiels à intégrer (palette actuelle : ton or neutre)

**Prochaine étape suggérée :**
Configurer les comptes Cloudflare R2 et Stripe, puis faire un déploiement test sur Vercel avec des photos fictives pour valider le flux complet.
