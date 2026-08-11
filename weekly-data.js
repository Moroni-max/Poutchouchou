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

// Ce que la future maman peut généralement ressentir, semaine par semaine —
// repères généraux et non systématiques, chaque grossesse est différente.
// Ne remplacent pas l'avis de votre sage-femme ou médecin en cas de doute.
const WEEKLY_SYMPTOMS = {
  4:  "Peu ou pas de symptômes pour beaucoup à ce stade. Un léger tiraillement bas-ventre est parfois ressenti au moment de la nidation, les seins peuvent commencer à devenir sensibles.",
  5:  "La fatigue peut déjà s'installer, les seins sont souvent tendus et sensibles. Quelques nausées légères ou envies alimentaires inhabituelles peuvent démarrer.",
  6:  "Les nausées (dites \"matinales\" bien qu'elles puissent survenir à toute heure) apparaissent ou s'intensifient chez beaucoup de femmes, avec un odorat souvent plus sensible.",
  7:  "Nausées et fatigue restent fréquentes. Ballonnements et besoin d'uriner plus souvent qu'avant sont également classiques à ce stade.",
  8:  "Les nausées sont parfois à leur maximum pour certaines. Salivation excessive, sautes d'humeur et grande fatigue restent courantes.",
  9:  "Nausées et fatigue toujours fréquentes. Un léger gonflement du ventre peut se faire sentir, plus souvent lié aux ballonnements qu'à l'utérus lui-même, encore petit à ce stade.",
  10: "L'utérus commence tout juste à sortir du bassin. Des tiraillements bas-ventre occasionnels, parfois proches d'une douleur de règles, sont habituels — généralement bénins en l'absence de douleur intense ou de saignement.",
  11: "Les nausées commencent parfois à s'atténuer chez certaines, persistent chez d'autres. Des maux de tête liés aux changements hormonaux peuvent apparaître.",
  12: "L'utérus atteint à peu près le bord supérieur du pubis. C'est souvent autour de cette période que les nausées commencent à s'estomper pour beaucoup de femmes.",
  13: "Fin du premier trimestre pour la plupart des suivis : fatigue et nausées ont tendance à s'améliorer, sans que ce soit systématique pour toutes.",
  14: "Le regain d'énergie souvent associé au deuxième trimestre démarre ici pour beaucoup. Les tiraillements des ligaments ronds, qui soutiennent l'utérus en pleine croissance, peuvent se faire sentir davantage.",
  15: "Pas de ventre bien visible pour beaucoup à ce stade, et c'est normal — le fond utérin se situe généralement entre le pubis et le nombril. De petits tiraillements bas-ventre, sans douleur ni saignement, restent habituels.",
  16: "Le ventre commence parfois tout juste à s'arrondir, mais ça reste très variable d'une femme à l'autre — souvent plus progressif pour un premier enfant. Le nez peut être plus fréquemment bouché (rhinite de grossesse).",
  17: "Les tout premiers mouvements du bébé peuvent commencer à être perçus par certaines, souvent décrits comme de petites bulles ou des papillons dans le ventre.",
  18: "Le fond utérin se rapproche du niveau du nombril. Les tiraillements ligamentaires restent possibles, en particulier lors de mouvements brusques ou en changeant de position.",
  19: "Le ventre devient généralement plus visible pour la majorité des femmes à ce stade. De légers maux de dos peuvent apparaître avec le changement de posture.",
  20: "À mi-parcours, le fond utérin est en général proche du niveau du nombril. Les mouvements du bébé deviennent souvent plus reconnaissables et réguliers.",
  21: "L'appétit peut augmenter nettement. Des crampes dans les jambes, surtout nocturnes, sont fréquentes à partir de cette période.",
  22: "La peau du ventre peut commencer à tirailler ou démanger légèrement en s'étirant — une hydratation régulière de la peau peut aider au confort.",
  23: "Un léger gonflement des jambes ou l'apparition de petites varices sont possibles chez certaines, liés à l'augmentation du volume sanguin.",
  24: "Le dépistage du diabète gestationnel est généralement proposé autour de cette période. Des maux de dos peuvent commencer à s'installer avec le poids croissant du ventre.",
  25: "Le nombril peut commencer à s'aplatir ou ressortir légèrement. Les maux de dos, s'ils sont présents, peuvent s'accentuer.",
  26: "Bébé réagit désormais aux sons extérieurs ; certaines femmes le sentent \"sursauter\" à un bruit soudain.",
  27: "Fin du deuxième trimestre pour la plupart des suivis : un léger essoufflement à l'effort ou une sensation de lourdeur peuvent commencer à se faire sentir.",
  28: "Entrée dans le troisième trimestre. Les contractions de Braxton Hicks (contractions d'entraînement, sans dilatation) peuvent commencer à se faire sentir — généralement indolores et irrégulières.",
  29: "Le souffle peut se faire plus court, l'utérus prenant de la place sous les côtes. Le sommeil peut devenir plus difficile à trouver confortablement.",
  30: "Des remontées acides ou des brûlures d'estomac sont fréquentes à ce stade, l'estomac étant comprimé par l'utérus.",
  31: "Le besoin d'uriner redevient plus fréquent avec la pression sur la vessie. Une fatigue différente de celle du premier trimestre peut revenir.",
  32: "Le bas du dos et le bassin peuvent tirer davantage à l'approche du terme. Les mouvements du bébé restent importants à surveiller, même s'ils deviennent parfois un peu plus amples et moins fréquents faute de place.",
  33: "Trouver une position confortable pour dormir devient parfois plus difficile ; un coussin de grossesse peut aider au confort.",
  34: "Le col peut commencer à se préparer en douceur, sans que ce soit systématiquement perceptible. Les contractions de Braxton Hicks sont parfois plus fréquentes.",
  35: "Une sensation de pression pelvienne peut s'accentuer si bébé commence à descendre dans le bassin.",
  36: "Fatigue et impatience sont fréquentes à l'approche du terme, pendant que le corps continue de se préparer pour l'accouchement.",
  37: "Bébé est considéré comme \"à terme précoce\" — la naissance peut survenir à tout moment à partir d'ici, sans que ce soit automatique ni attendu si vite.",
  38: "L'instinct du \"nid\" peut se manifester chez certaines, avec une envie soudaine de tout préparer et ranger.",
  39: "La perte du bouchon muqueux est possible à ce stade, sans indiquer forcément un accouchement imminent.",
  40: "Terme atteint — le travail peut démarrer à tout moment, ou même un peu après : c'est encore tout à fait normal jusque vers 41-42 semaines selon le suivi proposé."
};

function getSymptomsForWeek(week) {
  const w = Math.max(4, Math.min(40, week));
  return WEEKLY_SYMPTOMS[w] || WEEKLY_SYMPTOMS[4];
}
