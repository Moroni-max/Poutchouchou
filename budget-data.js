// Budget arrivée bébé — postes par défaut, organisés par catégorie.
// "prevu" est une estimation de départ, modifiable dans l'appli.

const BUDGET_DATA = {
  transport: {
    label: "Poussette & transport",
    items: [
      { id: "bt-poussette",   name: "Poussette",                    prevu: 350 },
      { id: "bt-siege-auto",  name: "Siège auto (groupe 0+)",       prevu: 150 },
      { id: "bt-portebebe",   name: "Porte-bébé ou écharpe",        prevu: 60 },
      { id: "bt-sac-langer",  name: "Sac à langer",                 prevu: 40 }
    ]
  },
  chambre: {
    label: "Chambre & couchage",
    items: [
      { id: "bc-lit",        name: "Lit bébé",                      prevu: 150 },
      { id: "bc-matelas",    name: "Matelas",                       prevu: 80 },
      { id: "bc-gigoteuse",  name: "Gigoteuses / turbulettes",      prevu: 50 },
      { id: "bc-commode",    name: "Commode / table à langer",      prevu: 180 },
      { id: "bc-linge",      name: "Linge de lit (draps, alèses)",  prevu: 50 },
      { id: "bc-babyphone",  name: "Babyphone",                     prevu: 60 }
    ]
  },
  quotidien: {
    label: "Puériculture au quotidien",
    items: [
      { id: "bq-biberons",  name: "Biberons + stérilisateur",       prevu: 60 },
      { id: "bq-chauffe",   name: "Chauffe-biberon",                prevu: 25 },
      { id: "bq-transat",   name: "Transat ou relax",               prevu: 60 },
      { id: "bq-baignoire", name: "Baignoire bébé",                 prevu: 35 },
      { id: "bq-tapis",     name: "Tapis à langer",                 prevu: 20 }
    ]
  },
  vetements: {
    label: "Vêtements & toilette",
    items: [
      { id: "bv-layette",    name: "Layette premiers mois",         prevu: 150 },
      { id: "bv-toilette",   name: "Produits de toilette",          prevu: 35 },
      { id: "bv-serviettes", name: "Serviettes / capes de bain",    prevu: 25 },
      { id: "bv-couches",    name: "Couches (premier stock)",       prevu: 50 }
    ]
  },
  divers: {
    label: "Sécurité & imprévus",
    items: [
      { id: "bd-barrieres",    name: "Barrières / cache-prises",    prevu: 40 },
      { id: "bd-thermometre",  name: "Thermomètre",                 prevu: 20 },
      { id: "bd-imprevus",     name: "Divers et imprévus",          prevu: 150 }
    ]
  }
};
