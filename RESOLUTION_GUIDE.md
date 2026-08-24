# 🚨 GUIDE DE RÉSOLUTION - Problèmes Whiteboard

**Date**: 2026-08-23 19:35 UTC
**Problèmes signalés**:
1. ❌ Outil Text ne fonctionne pas
2. ❌ Zone de dessin limitée (petit carré en haut à gauche)

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. Outil Text - CORRIGÉ ✅
**Changements dans `src/pages/BoardEditorPage.tsx`**:
- Ligne 874-886: Ajout de placeholder "Type here..." pour les textes vides
- Ligne 1247-1290: Amélioration du textarea d'édition avec mise à jour en temps réel
- Border plus visible (2px) et min-width augmenté (100px)

### 2. Fichier .env - CRÉÉ ✅
**Nouveau fichier `.env`**:
```env
VITE_API_URL=http://localhost:4000/api/v1
VITE_YJS_WS_URL=ws://localhost:4001/yjs
```

### 3. Service API - CORRIGÉ ✅
**`src/services/base.ts`**:
- Maintenant utilise `import.meta.env.VITE_API_URL`
- Connexion au backend Docker correcte

---

## 🔍 DIAGNOSTIC: Problème de Zone de Dessin

Le problème du "petit carré" peut venir de:

### Cause Possible #1: Le conteneur ne prend pas toute la hauteur
**Solution**: Vérifier que le layout occupe 100% de la hauteur

### Cause Possible #2: Docker frontend pas redémarré avec .env
**Solution**: Reconstruire l'image Docker frontend

### Cause Possible #3: Cache navigateur
**Solution**: Vider le cache (Ctrl+Shift+Delete)

---

## 🚀 INSTRUCTIONS DE REDÉMARRAGE

### Étape 1: Arrêter Docker Compose
```bash
docker compose -f docker/docker-compose.yml down
```

### Étape 2: Reconstruire TOUT
```bash
docker compose -f docker/docker-compose.yml build --no-cache
```

### Étape 3: Redémarrer
```bash
docker compose -f docker/docker-compose.yml up
```

### Étape 4: Attendre que tous les services soient prêts
Cherchez dans les logs:
```
✓ whiteboard-backend   | [INFO] HTTP server running on port 4000
✓ whiteboard-backend   | [INFO] Yjs WebSocket server started
✓ whiteboard-frontend  | VITE ready in XXXms
```

### Étape 5: Accéder à l'application
**URL**: Vérifiez dans les logs du frontend (peut être 5173 ou 5174)

---

## 🧪 TESTS À EFFECTUER

### Test 1: Outil Text
1. Ouvrez un board
2. Cliquez sur l'outil Text (T)
3. Cliquez sur le canvas
4. ✅ Vous devez voir un textarea avec placeholder "Type text..."
5. Tapez du texte
6. ✅ Le texte doit apparaître en temps réel
7. Appuyez sur Escape
8. ✅ Le texte reste visible sur le canvas

### Test 2: Zone de Dessin
1. Ouvrez un board
2. Essayez de dessiner un rectangle
3. ✅ Le canvas doit occuper TOUTE la zone centrale (pas juste un petit carré)
4. Essayez de zoomer (molette souris)
5. ✅ Le zoom doit fonctionner sur toute la zone

### Test 3: Collaboration
1. Ouvrez deux navigateurs
2. Connectez-vous avec alice@example.com et bob@example.com
3. Ouvrez le même board dans les deux
4. Dessinez dans l'un
5. ✅ Ça doit apparaître dans l'autre en < 1 seconde

---

## ⚠️ SI LE PROBLÈME PERSISTE

### Option 1: Utiliser npm run dev (sans Docker frontend)
```bash
# Gardez Docker backend running
docker compose -f docker/docker-compose.yml up postgres redis minio backend

# Dans un autre terminal, lancez frontend localement
npm run dev
```

Puis accédez à `http://localhost:5173` (ou le port indiqué)

### Option 2: Vérifier les logs navigateur
1. Ouvrez l'application
2. Appuyez sur F12 (Console développeur)
3. Onglet "Console" - Cherchez des erreurs rouges
4. Onglet "Network" - Vérifiez que les requêtes à `/api/v1` fonctionnent

### Option 3: Vérifier la connexion WebSocket
Dans la console navigateur, tapez:
```javascript
console.log('WebSocket URL:', import.meta.env.VITE_YJS_WS_URL);
```

Ça doit afficher: `ws://localhost:4001/yjs`

---

## 📸 CE QUE VOUS DEVRIEZ VOIR

### Interface Normale:
```
┌─────────────────────────────────────────────────┐
│ Header (Board Title, Share, Export...)         │
├────┬──────────────────────────────────────┬─────┤
│ T  │                                      │Props│
│ O  │                                      │Panel│
│ O  │     CANVAS (TOUTE LA ZONE)          │     │
│ L  │                                      │Color│
│ S  │                                      │Size │
│    │                                      │     │
│    │     [Zoom: 100%] [Saved]            │     │
└────┴──────────────────────────────────────┴─────┘
```

### Interface avec Problème (À CORRIGER):
```
┌─────────────────────────────────────────────────┐
│ Header                                          │
├────┬──────────────────────────────────────┬─────┤
│ T  │▪️ (petit carré)                      │Props│
│ O  │                                      │     │
│ O  │                                      │     │
│ L  │                                      │     │
└────┴──────────────────────────────────────┴─────┘
```

---

## 🆘 BESOIN D'AIDE IMMÉDIATE?

Envoyez-moi:
1. **Capture d'écran** de l'interface (montrez le problème)
2. **Logs de la console navigateur** (F12 → Console → screenshot)
3. **Sortie de** `docker ps` pour voir quels services tournent
4. **URL exacte** que vous utilisez (localhost:XXXX)

Je pourrai alors diagnostiquer le problème exact.

---

## ✅ STATUT DES CORRECTIONS

| Problème | Statut | Détails |
|----------|--------|---------|
| Outil Text ne fonctionne pas | ✅ CORRIGÉ | Placeholder + édition temps réel |
| .env manquant | ✅ CRÉÉ | Variables d'environnement configurées |
| API ne se connecte pas | ✅ CORRIGÉ | URL backend correcte |
| Zone de dessin limitée | ⚠️ À TESTER | Redémarrage Docker nécessaire |

---

**Prochaine étape**: Redémarrez Docker avec les commandes ci-dessus et testez !
