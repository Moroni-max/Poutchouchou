// Repères hebdomadaires de développement — à titre indicatif et général,
// ne remplacent pas le suivi médical personnalisé.
//
// shape : forme d'icône à dessiner (voir produceIcon() dans app.js)
// color : variable de couleur du thème (ink, ochre, sage, rust)
// scale : taille relative de 1 (minuscule) à 10 (très grand)

const WEEKLY_DATA = {
  4:  { name: "une graine de pavot",   shape: "seed",       color: "rust",  scale: 1,  text: "L'œuf vient de s'implanter. Le tube neural, à l'origine du futur cerveau et de la moelle épinière, commence tout juste à se former." },
  5:  { name: "une graine de sésame",  shape: "seed",       color: "ochre", scale: 1,  text: "Le cœur ébauche ses tout premiers battements, encore irréguliers." },
  6:  { name: "une myrtille",         shape: "berry",      color: "ink",   scale: 2,  text: "Les bourgeons des bras et des jambes apparaissent. Les traits du visage commencent à se dessiner." },
  7:  { name: "une framboise",        shape: "berry",      color: "rust",  scale: 2,  text: "Mains et pieds ressemblent à de petites palmes. Le cerveau se développe très rapidement." },
  8:  { name: "un grain de raisin",   shape: "round-small",color: "sage",  scale: 2,  text: "Tous les organes essentiels ont commencé à se mettre en place. Doigts et orteils deviennent distincts." },
  9:  { name: "une olive",            shape: "oval",       color: "sage",  scale: 2,  text: "Les paupières se forment. Les premiers mouvements réflexes apparaissent, encore imperceptibles." },
  10: { name: "une fraise",           shape: "round-small",color: "rust",  scale: 3,  text: "Les ongles commencent à apparaître. Les articulations (coudes, genoux) peuvent déjà se plier." },
  11: { name: "une figue",            shape: "oval",       color: "rust",  scale: 3,  text: "La croissance s'accélère nettement. Le système digestif s'entraîne à fonctionner." },
  12: { name: "un citron vert",       shape: "round-small",color: "sage",  scale: 3,  text: "Le réflexe de succion apparaît. Tous les organes présents continuent désormais de mûrir." },
  13: { name: "une prune",            shape: "round-small",color: "ink",   scale: 3,  text: "Les empreintes digitales se forment. Les cordes vocales commencent à se développer." },
  14: { name: "un citron",            shape: "round-small",color: "ochre", scale: 4,  text: "Bébé peut froncer les sourcils et faire des grimaces. Les reins commencent à produire de l'urine." },
  15: { name: "une pomme",            shape: "round-medium",color: "rust", scale: 4,  text: "Le squelette continue de se solidifier. La peau devient sensible à la lumière." },
  16: { name: "un avocat",            shape: "oval",       color: "sage",  scale: 4,  text: "Bébé commence à percevoir certains sons. Les jambes sont désormais plus développées que les bras." },
  17: { name: "une grenade",          shape: "round-medium",color: "rust", scale: 4,  text: "Un dépôt de graisse commence à se former sous la peau. Le cordon ombilical s'épaissit." },
  18: { name: "un poivron",           shape: "oval",       color: "sage",  scale: 5,  text: "Bébé peut bâiller et avoir le hoquet. Les oreilles atteignent leur position définitive." },
  19: { name: "une grosse tomate",    shape: "round-medium",color: "rust", scale: 5,  text: "Une couche protectrice, le vernix caseosa, recouvre progressivement la peau." },
  20: { name: "une banane",           shape: "elongated",  color: "ochre", scale: 5,  text: "À mi-parcours : bébé alterne désormais des phases de sommeil et d'éveil plus régulières." },
  21: { name: "une carotte",          shape: "elongated",  color: "ochre", scale: 5,  text: "Les mouvements deviennent plus coordonnés. Bébé peut sucer son pouce." },
  22: { name: "une courgette",        shape: "elongated",  color: "sage",  scale: 5,  text: "Le sens du toucher s'affine. Sourcils et paupières sont maintenant bien formés." },
  23: { name: "une grosse mangue",    shape: "oval",       color: "ochre", scale: 6,  text: "Bébé commence à emmagasiner du fer. La peau reste encore fine et légèrement translucide." },
  24: { name: "un épi de maïs",       shape: "elongated",  color: "ochre", scale: 6,  text: "Les poumons développent leurs ramifications. L'ouïe devient de plus en plus sensible aux sons extérieurs." },
  25: { name: "un chou-fleur",        shape: "leafy",      color: "sage",  scale: 6,  text: "Bébé prend du poids plus régulièrement. Les premiers cheveux commencent à pousser." },
  26: { name: "une pomme de laitue",  shape: "leafy",      color: "sage",  scale: 6,  text: "Les yeux commencent à s'ouvrir. Bébé réagit déjà aux sons familiers de la voix des parents." },
  27: { name: "un brocoli",           shape: "leafy",      color: "sage",  scale: 6,  text: "Le cerveau est très actif. Des cycles de sommeil plus définis se mettent en place." },
  28: { name: "une aubergine",        shape: "oval",       color: "ink",   scale: 7,  text: "Début du troisième trimestre. Bébé peut désormais cligner des yeux." },
  29: { name: "une petite courge",    shape: "oval",       color: "ochre", scale: 7,  text: "Muscles et poumons continuent de mûrir. Les mouvements se font plus forts et plus nets." },
  30: { name: "un chou frisé",        shape: "leafy",      color: "sage",  scale: 7,  text: "Les yeux peuvent distinguer un peu de lumière. Bébé prend du volume rapidement." },
  31: { name: "une noix de coco",     shape: "round-medium",color: "ink",  scale: 7,  text: "Les cinq sens sont désormais tous fonctionnels." },
  32: { name: "un ananas",            shape: "oval",       color: "ochre", scale: 8,  text: "Les ongles atteignent le bout des doigts. Bébé s'entraîne à respirer." },
  33: { name: "un petit melon",       shape: "large-round",color: "sage",  scale: 8,  text: "Les os du crâne restent souples, pour faciliter le passage à la naissance. Le système immunitaire se renforce." },
  34: { name: "un melon cantaloup",   shape: "large-round",color: "ochre", scale: 8,  text: "La couche de graisse s'épaissit. Bébé a de moins en moins de place pour bouger." },
  35: { name: "un melon miel",        shape: "large-round",color: "ochre", scale: 8,  text: "Les reins sont bien développés. Le foie commence à traiter certains déchets." },
  36: { name: "une papaye",           shape: "oval",       color: "ochre", scale: 8,  text: "Bébé se positionne généralement tête en bas. Il continue de prendre du poids chaque semaine." },
  37: { name: "une petite pastèque",  shape: "large-oval", color: "rust",  scale: 9,  text: "Considéré comme à terme précoce. Le réflexe de préhension est maintenant bien développé." },
  38: { name: "un petit potiron",     shape: "large-round",color: "ochre", scale: 9,  text: "La couche de graisse continue de s'affiner. Les poumons sont presque prêts." },
  39: { name: "une pastèque moyenne", shape: "large-oval", color: "rust",  scale: 9,  text: "Bébé est quasiment prêt. Il continue simplement de prendre du poids." },
  40: { name: "une grosse pastèque",  shape: "large-oval", color: "rust",  scale: 10, text: "Terme atteint : bébé est prêt pour la naissance !" }
};
