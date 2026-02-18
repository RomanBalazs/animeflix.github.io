# AnimeFlix (GitHub Pages-ready)

Netflix-szerű anime katalogizáló + lejátszás demo.

## Funkciók
- Free: banner reklám + epizód indítás előtt 10 mp interstitial (skip)
- Premium: reklámmentes (eltűnnek a hirdetések)
- Profilválasztás
- Keresés + szűrők
- Saját lista
- Progress mentés (demo)

## Lokális futtatás
Node 18+ ajánlott.

```bash
npm install
npm run dev
```

## Deploy GitHub Pages-re
1) Pushold `main` ágra
2) GitHub → Settings → Pages → Source: GitHub Actions
3) Workflow automatikusan build + deploy

Oldal:
https://<felhasznalo>.github.io/<repo>/
