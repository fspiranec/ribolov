import type { Text } from "./rules/types";
import de from "../locales/de.json";
import it from "../locales/it.json";
import pl from "../locales/pl.json";
import cs from "../locales/cs.json";
import sl from "../locales/sl.json";

export type Lang = "hr" | "en" | "de" | "it" | "pl" | "cs" | "sl";

export const LANGS: { code: Lang; label: string }[] = [
  { code: "hr", label: "Hrvatski" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "it", label: "Italiano" },
  { code: "pl", label: "Polski" },
  { code: "cs", label: "Čeština" },
  { code: "sl", label: "Slovenščina" },
];

/** BCP-47 tag for number/date formatting. */
export const LOCALE_TAG: Record<Lang, string> = { hr: "hr-HR", en: "en-GB", de: "de-DE", it: "it-IT", pl: "pl-PL", cs: "cs-CZ", sl: "sl-SI" };

/** Compass points N, NE, E, SE, S, SW, W, NW in each language. */
/** Full names, used where a single letter is ambiguous (HR/CS/SL "S" = north). */
export const COMPASS_LONG: Record<Lang, string[]> = {
  hr: ["sjever", "sjeveroistok", "istok", "jugoistok", "jug", "jugozapad", "zapad", "sjeverozapad"],
  en: ["north", "north-east", "east", "south-east", "south", "south-west", "west", "north-west"],
  de: ["Nord", "Nordost", "Ost", "Südost", "Süd", "Südwest", "West", "Nordwest"],
  it: ["nord", "nord-est", "est", "sud-est", "sud", "sud-ovest", "ovest", "nord-ovest"],
  pl: ["północ", "północny wschód", "wschód", "południowy wschód", "południe", "południowy zachód", "zachód", "północny zachód"],
  cs: ["sever", "severovýchod", "východ", "jihovýchod", "jih", "jihozápad", "západ", "severozápad"],
  sl: ["sever", "severovzhod", "vzhod", "jugovzhod", "jug", "jugozahod", "zahod", "severozahod"],
};

export const COMPASS: Record<Lang, string[]> = {
  hr: ["S", "SI", "I", "JI", "J", "JZ", "Z", "SZ"],
  en: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  de: ["N", "NO", "O", "SO", "S", "SW", "W", "NW"],
  it: ["N", "NE", "E", "SE", "S", "SO", "O", "NO"],
  pl: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  cs: ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"],
  sl: ["S", "SV", "V", "JV", "J", "JZ", "Z", "SZ"],
};

const ORDER: Lang[] = ["hr", "en", "de", "it", "pl", "cs", "sl"];

// UI strings: [hr, en, de, it, pl, cs, sl]. Rule texts from the API exist in hr and en;
// other languages fall back to English (see `c`).
const dict = {
  title: ["Pomoćnik za ribolov na moru", "Sea Fishing Helper", "Meeresangel-Helfer", "Assistente pesca in mare", "Pomocnik wędkarza morskiego", "Pomocník pro mořský rybolov", "Pomočnik za morski ribolov"],
  tapMap: ["Klikni na more za informacije o lokaciji.", "Tap the sea to get information about the location.", "Tippe auf das Meer, um Infos zum Ort zu erhalten.", "Tocca il mare per informazioni sul luogo.", "Dotknij morza, aby zobaczyć informacje o miejscu.", "Klepněte na moře pro informace o místě.", "Tapni na morje za informacije o lokaciji."],
  permit: ["Dozvola", "Licence", "Lizenz", "Licenza", "Licencja", "Povolenka", "Dovolilnica"],
  rekreacijska: ["Rekreacijska", "Recreational", "Freizeit", "Ricreativa", "Rekreacyjna", "Rekreační", "Rekreacijska"],
  sportska: ["Sportska", "Sport", "Sport", "Sportiva", "Sportowa", "Sportovní", "Športna"],
  special: ["Posebne dozvole", "Special permits", "Sondergenehmigungen", "Permessi speciali", "Zezwolenia specjalne", "Zvláštní povolení", "Posebna dovoljenja"],
  parangal: ["Parangal", "Longline", "Langleine", "Palangaro", "Sznur haczykowy", "Dlouhá šňůra", "Parangal"],
  vrse: ["Vrše", "Traps", "Reusen", "Nasse", "Więcierze", "Vrše", "Vrše"],
  osti: ["Osti", "Spear", "Fischspeer", "Fiocina", "Oścień", "Harpuna", "Osti"],
  rasvjeta: ["Rasvjeta", "Lights", "Licht", "Luci", "Światło", "Světlo", "Luč"],
  velika_riba: ["Velika riba", "Big game", "Großfisch", "Big game", "Duże ryby", "Velké ryby", "Velike ribe"],
  mode: ["Način", "Mode", "Art", "Modalità", "Sposób", "Způsob", "Način"],
  obala: ["S obale", "Shore", "Vom Ufer", "Da riva", "Z brzegu", "Z břehu", "Z obale"],
  brod: ["S broda", "Boat", "Vom Boot", "Da barca", "Z łodzi", "Z lodi", "S čolna"],
  podvodni: ["Podvodni", "Spearfishing", "Unterwasser", "Subacquea", "Podwodny", "Podvodní", "Podvodni"],
  date: ["Datum", "Date", "Datum", "Data", "Data", "Datum", "Datum"],
  time: ["Vrijeme", "Time", "Uhrzeit", "Ora", "Godzina", "Čas", "Ura"],
  loading: ["Učitavam…", "Loading…", "Lädt…", "Caricamento…", "Ładowanie…", "Načítám…", "Nalagam…"],
  zeleno: ["Nema poznatih zabrana", "No known restrictions", "Keine bekannten Verbote", "Nessun divieto noto", "Brak znanych zakazów", "Žádné známé zákazy", "Ni znanih prepovedi"],
  zuto: ["Oprez / posebna dozvola / provjeri", "Caution / special permit / check", "Vorsicht / Sondergenehmigung / prüfen", "Attenzione / permesso speciale / verifica", "Uwaga / zezwolenie specjalne / sprawdź", "Pozor / zvláštní povolení / ověřte", "Previdno / posebno dovoljenje / preveri"],
  crveno: ["Zabranjeno", "Prohibited", "Verboten", "Vietato", "Zabronione", "Zakázáno", "Prepovedano"],
  where: ["Lokacija", "Location", "Ort", "Luogo", "Miejsce", "Místo", "Lokacija"],
  zone: ["Ribolovna zona", "Fishing zone", "Fischereizone", "Zona di pesca", "Strefa połowowa", "Rybářská zóna", "Ribolovna cona"],
  subzone: ["Podzona", "Sub-zone", "Unterzone", "Sottozona", "Podstrefa", "Podzóna", "Podcona"],
  areas: ["Područja", "Areas", "Gebiete", "Aree", "Obszary", "Oblasti", "Območja"],
  natura: ["Natura 2000", "Natura 2000", "Natura 2000", "Natura 2000", "Natura 2000", "Natura 2000", "Natura 2000"],
  port: ["Najbliža luka", "Nearest port", "Nächster Hafen", "Porto più vicino", "Najbliższy port", "Nejbližší přístav", "Najbližje pristanišče"],
  beach: ["Najbliža plaža", "Nearest beach", "Nächster Strand", "Spiaggia più vicina", "Najbliższa plaża", "Nejbližší pláž", "Najbližja plaža"],
  farm: ["Najbliže uzgajalište", "Nearest fish farm", "Nächste Fischzucht", "Allevamento più vicino", "Najbliższa hodowla", "Nejbližší farma", "Najbližje ribogojnica"],
  unknown: ["nepoznato", "unknown", "unbekannt", "sconosciuto", "nieznane", "neznámé", "neznano"],
  none: ["nema", "none", "keine", "nessuna", "brak", "žádné", "ni"],
  tools: ["Pribor – što smiješ koristiti", "Gear – what you may use", "Erlaubtes Gerät", "Attrezzi consentiti", "Dozwolony sprzęt", "Povolené vybavení", "Dovoljena oprema"],
  notAllowed: ["Nije dopušteno", "Not allowed", "Nicht erlaubt", "Non consentito", "Niedozwolone", "Nepovoleno", "Ni dovoljeno"],
  today: ["Danas", "Today", "Heute", "Oggi", "Dziś", "Dnes", "Danes"],
  closed: ["U lovostaju", "Closed season", "Schonzeit", "Fermo pesca", "Okres ochronny", "Doba hájení", "Varstvena doba"],
  noClosed: ["Nijedna vrsta nije u lovostaju.", "No species in closed season.", "Keine Art hat Schonzeit.", "Nessuna specie in fermo.", "Żaden gatunek nie jest chroniony.", "Žádný druh není hájen.", "Nobena vrsta ni v varstveni dobi."],
  prohibited: ["Trajno zabranjene vrste", "Permanently prohibited species", "Dauerhaft verbotene Arten", "Specie sempre vietate", "Gatunki zawsze zakazane", "Trvale zakázané druhy", "Trajno prepovedane vrste"],
  strict: ["Strogo zaštićene vrste", "Strictly protected species", "Streng geschützte Arten", "Specie rigorosamente protette", "Gatunki ściśle chronione", "Přísně chráněné druhy", "Strogo zavarovane vrste"],
  minSizes: ["Minimalne veličine", "Minimum sizes", "Mindestmaße", "Taglie minime", "Wymiary minimalne", "Minimální velikosti", "Najmanjše velikosti"],
  limits: ["Dnevna ograničenja", "Daily limits", "Tageslimits", "Limiti giornalieri", "Limity dzienne", "Denní limity", "Dnevne omejitve"],
  forbidden: ["Zabranjeno", "Forbidden", "Verboten", "Vietato", "Zabronione", "Zakázáno", "Prepovedano"],
  marking: ["Označavanje ulova", "Catch marking", "Fangmarkierung", "Marcatura del pescato", "Znakowanie połowu", "Označení úlovku", "Označevanje ulova"],
  reporting: ["Evidencija (mRecFish)", "Reporting (mRecFish)", "Fangmeldung (mRecFish)", "Registrazione (mRecFish)", "Zgłaszanie (mRecFish)", "Hlášení (mRecFish)", "Evidenca (mRecFish)"],
  depth: ["Dubina", "Depth", "Tiefe", "Profondità", "Głębokość", "Hloubka", "Globina"],
  land: ["kopno", "land", "Land", "terra", "ląd", "pevnina", "kopno"],
  weather: ["Vrijeme i more", "Weather and sea", "Wetter und Meer", "Meteo e mare", "Pogoda i morze", "Počasí a moře", "Vreme in morje"],
  wind: ["Vjetar", "Wind", "Wind", "Vento", "Wiatr", "Vítr", "Veter"],
  gusts: ["udari", "gusts", "Böen", "raffiche", "porywy", "nárazy", "sunki"],
  waves: ["Valovi", "Waves", "Wellen", "Onde", "Fale", "Vlny", "Valovi"],
  seaTemp: ["Temperatura mora", "Sea temperature", "Wassertemperatur", "Temperatura del mare", "Temperatura morza", "Teplota moře", "Temperatura morja"],
  airTemp: ["Temperatura zraka", "Air temperature", "Lufttemperatur", "Temperatura dell'aria", "Temperatura powietrza", "Teplota vzduchu", "Temperatura zraka"],
  current: ["Struja", "Current", "Strömung", "Corrente", "Prąd", "Proud", "Tok"],
  sunrise: ["Izlazak sunca", "Sunrise", "Sonnenaufgang", "Alba", "Wschód słońca", "Východ slunce", "Sončni vzhod"],
  sunset: ["Zalazak sunca", "Sunset", "Sonnenuntergang", "Tramonto", "Zachód słońca", "Západ slunce", "Sončni zahod"],
  moon: ["Mjesec", "Moon", "Mond", "Luna", "Księżyc", "Měsíc", "Luna"],
  noWeather: ["Prognoza nije dostupna.", "Forecast unavailable.", "Vorhersage nicht verfügbar.", "Previsioni non disponibili.", "Prognoza niedostępna.", "Předpověď není k dispozici.", "Napoved ni na voljo."],
  warnings: ["Upozorenja", "Warnings", "Warnungen", "Avvisi", "Ostrzeżenia", "Varování", "Opozorila"],
  notices: ["Obavijesti", "Notices", "Hinweise", "Note", "Informacje", "Upozornění", "Obvestila"],
  source: ["Izvor", "Source", "Quelle", "Fonte", "Źródło", "Zdroj", "Vir"],
  article: ["čl.", "art.", "Art.", "art.", "art.", "čl.", "čl."],
  checked: ["provjereno", "checked", "geprüft", "verificato", "sprawdzono", "ověřeno", "preverjeno"],
  legalCheck: ["čeka pravnu provjeru", "awaits legal review", "rechtliche Prüfung ausstehend", "in attesa di verifica legale", "czeka na weryfikację prawną", "čeká na právní ověření", "čaka na pravno preverjanje"],
  more: ["Više", "More", "Mehr", "Altro", "Więcej", "Více", "Več"],
  activity: ["Aktivnost riba", "Fish activity", "Fischaktivität", "Attività dei pesci", "Aktywność ryb", "Aktivita ryb", "Aktivnost rib"],
  bestTimes: ["Najbolji termini", "Best times", "Beste Zeiten", "Orari migliori", "Najlepsze pory", "Nejlepší časy", "Najboljši termini"],
  major: ["Glavni periodi (mjesec gore/dolje)", "Major periods (moon overhead/underfoot)", "Hauptzeiten (Mond oben/unten)", "Periodi principali (luna alta/bassa)", "Okresy główne (księżyc w górze/dole)", "Hlavní období (měsíc nahoře/dole)", "Glavna obdobja (luna zgoraj/spodaj)"],
  minor: ["Sporedni (izlazak/zalazak mjeseca)", "Minor (moonrise/moonset)", "Nebenzeiten (Mondauf-/untergang)", "Secondari (sorgere/tramonto luna)", "Poboczne (wschód/zachód księżyca)", "Vedlejší (východ/západ měsíce)", "Stranska (vzhod/zahod lune)"],
  buyLicence: ["Kupi dozvolu online", "Buy a licence online", "Angellizenz online kaufen", "Acquista la licenza online", "Kup licencję online", "Koupit povolenku online", "Kupi dovolilnico na spletu"],
  from: ["od", "from", "ab", "da", "od", "od", "od"],
  prices: ["Cijene dozvola", "Licence prices", "Lizenzpreise", "Prezzi delle licenze", "Ceny licencji", "Ceny povolenek", "Cene dovolilnic"],
  sellers: ["Najbliži prodavači dozvola", "Nearest licence sellers", "Nächste Verkaufsstellen", "Rivenditori più vicini", "Najbliżsi sprzedawcy licencji", "Nejbližší prodejci povolenek", "Najbližji prodajalci dovolilnic"],
  shops: ["Ribolovni pribor u blizini", "Tackle shops nearby", "Angelläden in der Nähe", "Negozi di pesca vicini", "Sklepy wędkarskie w pobliżu", "Rybářské potřeby poblíž", "Ribiške trgovine v bližini"],
  partner: ["partner", "partner", "Partner", "partner", "partner", "partner", "partner"],
  onMap: ["na karti", "on map", "auf der Karte", "sulla mappa", "na mapie", "na mapě", "na zemljevidu"],
  guide: ["Vodič kroz ribe", "Fish guide", "Fischführer", "Guida ai pesci", "Przewodnik po rybach", "Průvodce rybami", "Vodnik po ribah"],
  backToMap: ["Natrag na lokaciju", "Back to location", "Zurück zum Ort", "Torna al luogo", "Wróć do miejsca", "Zpět na místo", "Nazaj na lokacijo"],
  hook: ["Udica", "Hook", "Haken", "Amo", "Haczyk", "Háček", "Trnek"],
  bait: ["Mamci", "Bait", "Köder", "Esche", "Przynęty", "Návnady", "Vabe"],
  technique: ["Tehnika", "Technique", "Technik", "Tecnica", "Technika", "Technika", "Tehnika"],
  when: ["Kada", "When", "Wann", "Quando", "Kiedy", "Kdy", "Kdaj"],
  whereFish: ["Gdje", "Where", "Wo", "Dove", "Gdzie", "Kde", "Kje"],
  localNames: ["Lokalni nazivi", "Local names", "Lokale Namen", "Nomi locali", "Nazwy lokalne", "Místní názvy", "Lokalna imena"],
  minSize: ["Najmanja veličina", "Minimum size", "Mindestmaß", "Taglia minima", "Wymiar minimalny", "Minimální velikost", "Najmanjša velikost"],
  closedToday: ["Danas u lovostaju – vrati u more!", "Closed season today – release it!", "Heute Schonzeit – zurücksetzen!", "Oggi in fermo – rilascialo!", "Dziś okres ochronny – wypuść!", "Dnes hájená – pusťte ji!", "Danes varstvena doba – izpusti!"],
  search: ["Traži ribu…", "Search fish…", "Fisch suchen…", "Cerca pesce…", "Szukaj ryby…", "Hledat rybu…", "Išči ribo…"],
} as const satisfies Record<string, readonly [string, string, string, string, string, string, string]>;

// Newer UI strings: [hr, en]; other languages are looked up by the English text in locales/*.json.
const dict2 = {
  whereFishing: ["Gdje loviš?", "Where are you fishing?"],
  whereFishingSub: ["Uzet ćemo tvoju lokaciju i reći ti smiješ li tu loviti, što grize i kakvo je more.", "We'll use your location to tell you if you may fish here, what's biting and how the sea is."],
  useMyLocation: ["Koristi moju lokaciju", "Use my location"],
  pickOnMap: ["Odaberi na karti", "Pick on the map"],
  locating: ["Tražim tvoju lokaciju…", "Finding your location…"],
  gpsDenied: ["Lokacija nije dostupna. Odaberi mjesto na karti.", "Location unavailable. Pick a spot on the map."],
  gps: ["GPS", "GPS"],
  pickedOnMap: ["odabrano na karti", "picked on the map"],
  openMap: ["Otvori kartu", "Open map"],
  chooseThis: ["Odaberi ovu točku", "Use this spot"],
  tapToPick: ["Dodirni more ili obalu gdje loviš", "Tap the sea or shore where you fish"],
  close: ["Zatvori", "Close"],
  settings: ["Postavke ribolova", "Fishing settings"],
  done: ["Gotovo", "Done"],
  forecast: ["Prognoza", "Forecast"],
  fishToday: ["Ribe danas", "Fish today"],
  allFish: ["Sve ribe", "All fish"],
  rules: ["Pravila za ovo mjesto", "Rules for this spot"],
  now: ["sada", "now"],
  score: ["ocjena", "score"],
  seaTempShort: ["More", "Sea"],
  airShort: ["Zrak", "Air"],
  sun: ["Sunce", "Sun"],
  licenceNeeded: ["Trebaš dozvolu", "You need a licence"],
  licenceSub: ["Kupuje se online za 2 minute, stiže e-poštom.", "Buy online in 2 minutes, it arrives by email."],
  onLand: ["s obale", "from shore"],
  whyThis: ["Zašto?", "Why?"],
  details: ["Detalji", "Details"],
  limitsAndSizes: ["Lovostaji, veličine i ograničenja", "Closed seasons, sizes and limits"],
  info: ["Napomene", "Notes"],
  myCatch: ["Moj ulov danas", "My catch today"],
  myCatchSub: ["Upiši ribu i odmah ćeš znati smiješ li je zadržati.", "Enter a fish and see right away whether you may keep it."],
  myCatchEmpty: ["Upiši ribu – reći ćemo smiješ li je zadržati", "Add a fish – we'll tell you if you may keep it"],
  kept: ["zadržano", "kept"],
  addFish: ["Dodaj", "Add"],
  chooseFish: ["Odaberi ribu…", "Choose a fish…"],
  lengthCm: ["Duljina (cm)", "Length (cm)"],
  weightKg: ["Masa (kg)", "Weight (kg)"],
  checkFish: ["Provjeri i dodaj", "Check and add"],
  weightHint: ["Duljina od vrha glave do kraja repa. Masa je potrebna za dnevni limit od 5 kg (i za hobotnicu).", "Length from the tip of the head to the end of the tail. Weight is needed for the 5 kg daily limit (and for octopus)."],
  dailyLimit: ["Dnevni limit", "Daily limit"],
  noWeightCount: ["{n} zadržanih bez upisane mase – nisu uračunate u limit.", "{n} kept without a weight – not counted in the limit."],
  catchPrivacy: ["Ulov se sprema samo na tvom uređaju.", "Your catch is stored only on your device."],
  instructions: ["Upute", "Instructions"],
  maxGusts: ["najjači udari / valovi", "strongest gusts / waves"],
  dataFrom: ["Podaci o zonama", "Area data"],
  rulesChecked: ["pravila provjerena", "rules checked"],
  themeToggle: ["Svijetla / tamna tema", "Light / dark theme"],
  gearAllowed: ["S tvojom dozvolom smiješ koristiti", "With your licence you may use"],
  gearNeedsPermit: ["Za ovo treba posebna dozvola", "These need a special permit"],
  gearNotHere: ["Ne smiješ koristiti", "Not allowed"],
  maxAtOnce: ["najviše {n} istovremeno", "max {n} at once"],
  permitPrice: ["Cijena posebne dozvole: {eur} €", "Special permit price: €{eur}"],
  tomorrow: ["Sutra", "Tomorrow"],
  nextDays: ["Idući dani", "Next days"],
  nextDaysNote: ["Označen je najbolji dan bez jakog vjetra i valova (crveno = udari > 50 km/h ili valovi > 2 m).", "The best day without strong wind and waves is highlighted (red = gusts > 50 km/h or waves > 2 m)."],
  savePlace: ["Spremi mjesto", "Save spot"],
  savedPlaces: ["Spremljena mjesta", "Saved spots"],
  atSea: ["na moru", "at sea"],
  onShore: ["na obali", "on the shore"],
  fromCentre: ["od centra mjesta", "from the town centre"],
  retry: ["Pokušaj ponovno", "Try again"],
  errorTitle: ["Nešto nije u redu", "Something went wrong"],
  errorText: ["Ne mogu dohvatiti podatke. Provjeri internetsku vezu.", "Couldn't load data. Check your internet connection."],
  offline: ["Bez interneta – prikazujem zadnje spremljene podatke", "Offline – showing last saved data"],
  biteNow: ["sad grize", "biting now"],
  inSeason: ["sezona", "in season"],
  howToRecognize: ["Kako je prepoznati", "How to recognise it"],
  keepOrRelease: ["Smiješ li je zadržati?", "Can you keep it?"],
  keepIfSize: ["Da, ako je veća od", "Yes, if it is larger than"],
  keepYes: ["Da (nema propisane najmanje veličine – uzmi samo koliko trebaš)", "Yes (no legal minimum size – take only what you need)"],
  releaseClosed: ["Ne – danas je u lovostaju. Vrati je u more.", "No – closed season today. Release it."],
  firstTime: ["Prvi put loviš u Hrvatskoj?", "First time fishing in Croatia?"],
  firstTimeSub: ["5 stvari koje moraš znati", "5 things you need to know"],
  tip1: ["Kupi dozvolu online prije ribolova (od 10 € za dan). Djeca do 14 godina ne trebaju dozvolu ako love jednim najlonom bez štapa.", "Buy a licence online before fishing (from €10 a day). Children under 14 with one handline need none."],
  tip2: ["Provjeri mjesto: u lukama, na plažama ljeti i u zaštićenim područjima ribolov je zabranjen ili ograničen.", "Check the spot: fishing is banned or limited in ports, on beaches in summer and in protected areas."],
  tip3: ["Izmjeri ribu: premale vrati u more. Neke vrste su danas u lovostaju.", "Measure your fish: release undersized ones. Some species are in closed season today."],
  tip4: ["Najviše 5 kg ulova po osobi dnevno (+ jedna veća riba). Ulov se ne smije prodavati.", "Max 5 kg of catch per person per day (+ one bigger fish). Selling your catch is not allowed."],
  view: ["Prikaz", "View"],
  viewBasic: ["Osnovno", "Basic"],
  viewDetailed: ["Detaljno", "Detailed"],
  viewHint: ["Osnovno prikazuje najvažnije. Upozorenja i zabrane vide se uvijek.", "Basic shows the essentials. Warnings and bans are always shown."],
  bestToday: ["Najbolje vrijeme danas: {t}", "Best time today: {t}"],
  bestOnDay: ["Najbolje vrijeme: {t}", "Best time: {t}"],
  bestPassed: ["Najbolje vrijeme danas je prošlo ({t})", "Today's best time has passed ({t})"],
  showDetailed: ["Prikaži detaljno", "Show details"],
  depthHere: ["Dubina na odabranoj točki, ne uz samu obalu. Uz obalu je more obično pliće.", "Depth at the chosen point, not right at the shore. Near the shore the sea is usually shallower."],
  depthOnLand: ["Točka je na kopnu, pa dubinu ne znamo. Za dubinu odaberi na karti more ispred sebe.", "The point is on land, so we don't know the depth. To see it, pick the sea in front of you on the map."],
  specialTitle: ["Zaštićene, invazivne i opasne vrste", "Protected, invasive and dangerous species"],
  tabProtected: ["Zaštićene", "Protected"],
  tabInvasive: ["Invazivne", "Invasive"],
  tabDangerous: ["Opasne", "Dangerous"],
  catZasticena: ["Zaštićena – ne diraj, vrati u more", "Protected – don't touch, return it"],
  catInvazivna: ["Invazivna – fotografiraj i prijavi", "Invasive – take a photo and report it"],
  catOpasna: ["Opasna – pazi kod skidanja s udice", "Dangerous – careful when unhooking"],
  whatToDo: ["Što učiniti", "What to do"],
  firstAid: ["Prva pomoć kod uboda", "First aid for stings"],
  reportFind: ["Prijavi nalaz", "Report a sighting"],
  reportHint: ["Fotografiraj vrstu i zapiši mjesto – nalazi pomažu znanstvenicima (IRB, projekt ALIENA).", "Take a photo and note the place – sightings help scientists (IRB, ALIENA project)."],
  kidsTitle: ["Ribolov s djecom i pravila ponašanja", "Fishing with children and good conduct"],
  kidsSub: ["Sigurnost, mamac, puštanje ribe i čista obala", "Safety, bait, releasing fish and a clean shore"],
  kid1: ["Djeca do 14 godina s jednim najlonom bez štapa ne trebaju dozvolu.", "Children under 14 fishing with one handline and no rod need no licence."],
  kid2: ["Budi uz dijete na rivi i stijenama. Na skliskom kamenju nosite obuću, a za malu djecu ponesite prsluk za spašavanje.", "Stay next to your child on the quay and rocks. Wear shoes on slippery stones and bring a life jacket for small children."],
  kid3: ["Za početak su dovoljni tanki najlon, mala udica i komadić kruha – tako se uz obalu love sitne ribe.", "To start, a thin line, a small hook and a piece of bread are enough to catch small fish near the shore."],
  kid4: ["Ribu koju puštaš drži mokrim rukama, što kraće izvan vode, i nježno je spusti u more – ne bacaj je.", "Hold a fish you release with wet hands, keep it out of the water as briefly as possible and lower it gently into the sea – don't throw it."],
  kid5: ["Ne ostavljaj najlon, udice ni otpad na stijenama: ozljeđuju ljude, ptice i kornjače.", "Never leave line, hooks or rubbish on the rocks: they injure people, birds and turtles."],
  kid6: ["Ne lovi među kupačima i ne zabacuj blizu plivača.", "Don't fish among bathers or cast near swimmers."],
  tipsDisclaimer: ["Okvirni savjeti, nisu službeni. Mjerodavni su važeći propisi.", "General tips, not official. Current regulations always apply."],
  album: ["Moj album riba", "My fish album"],
  albumSub: ["{n} od {m} vrsta – upiši ulov u „Moj ulov danas” i skupljaj vrste.", "{n} of {m} species – add your catch in “My catch today” to collect species."],
  firstCaught: ["prvi put", "first caught"],
  call: ["Nazovi", "Call"],
  threeDays: ["3 dana", "3 days"],
  privacy: ["Pravila privatnosti", "Privacy policy"],
  validFrom: ["Vrijedi od", "Valid from"],
  controller: ["Voditelj obrade i kontakt", "Data controller and contact"],
  recipes: ["Iz mora u tavu – recepti", "From sea to pan – recipes"],
  recipesSub: ["Kako očistiti ribu i jednostavni recepti za apartman", "How to clean a fish and simple recipes for your apartment"],
  howToPrepare: ["Kako je pripremiti", "How to prepare it"],
  ingredients: ["Sastojci", "Ingredients"],
  cleaningFish: ["Kako je očistiti", "How to clean it"],
  steps: ["Priprema", "Method"],
  recipeBy: ["Recept", "Recipe by"],
  goodForSea: ["Dobro za more", "Good for the sea"],
  pufferNoEat: ["Napuhača: NE JESTI – otrovna!", "Pufferfish: DO NOT EAT – poisonous!"],
  pufferNoEatSub: ["Otrov se kuhanjem ne razgrađuje. Ne pripremaj je ni na koji način – fotografiraj je i prijavi nalaz.", "Cooking does not destroy the poison. Do not prepare it in any way – take a photo and report it."],
  recipesDisclaimer: ["Recepti su prijedlog, nisu službeni. Jedi samo svježu ribu koju smiješ zadržati.", "Recipes are suggestions, not official. Eat only fresh fish that you may keep."],
  qrSize: ["Veličina", "Size"],
  qrSticker: ["Naljepnica", "Sticker"],
  mapOffline: ["Karta nije dostupna bez interneta", "Map unavailable offline"],
  kid7: ["Ljeti ponesite vodu, šešir i kremu za sunčanje i izbjegavajte ribolov na suncu oko podneva.", "In summer bring water, a hat and sunscreen, and avoid fishing in the midday sun."],
  kid8: ["Udicu skidaj kliještima. Ako riba koju puštaš duboko proguta udicu, prereži najlon što bliže ustima.", "Remove hooks with pliers. If a fish you release has swallowed the hook deeply, cut the line as close to its mouth as possible."],
  kid9: ["Ribu koju zadržiš drži u hladu, najbolje u hladnjaku s ledom, i očisti je isti dan.", "Keep the fish you keep in the shade, ideally in a cool box with ice, and clean it the same day."],
  emergency: ["Hitni broj", "Emergency"],
  seaRescue: ["spašavanje na moru", "rescue at sea"],
  markedSpecies: ["Vrste koje se označavaju", "Species to mark"],
  otherSizedFish: ["Ostale ribe s propisanom mjerom", "Other fish with a legal minimum size"],
  releasedNext: ["Pustio sam je – dalje", "Released – next"],
  bestNow: ["Sad najbolje", "Best right now"],
  noMinSize: ["bez mjere", "no minimum size"],
  invalidCatch: ["Provjeri upisanu duljinu (1–400 cm) ili masu (do 700 kg).", "Check the length (1–400 cm) or weight (up to 700 kg)."],
  keptList: ["Zadržano", "Kept"],
  releasedList: ["Vraćeno u more i ostalo", "Released and other"],
  navigate: ["Navigacija", "Directions"],
  noPhone: ["nema telefona", "no phone"],
  sportShop: ["sportska trgovina s ribolovnom opremom", "sports shop with fishing gear"],
  acrossSeaIsland: ["na otoku {x} – treba trajekt ili brod", "on the island of {x} – ferry or boat needed"],
  acrossSeaMainland: ["na kopnu – treba trajekt ili brod", "on the mainland – ferry or boat needed"],
  qrTitle: ["QR kod za ovo mjesto", "QR code for this spot"],
  qrSub: [
    "Za iznajmljivače: isprintaj i stavi u apartman. Gosti skeniranjem odmah vide pravila, ribe i prognozu za ovo mjesto.",
    "For hosts: print it and put it in your apartment. Guests scan it to see the rules, fish and forecast for this spot.",
  ],
  qrName: ["Naziv na kartici (npr. Apartmani Marija)", "Name on the card (e.g. Apartments Maria)"],
  qrScan: ["Idete na ribolov? Skenirajte za pravila, ribe i prognozu.", "Going fishing? Scan for rules, fish and forecast."],
  qrNoLoc: ["Prvo odaberi mjesto u aplikaciji, pa otvori QR kod.", "First choose a spot in the app, then open the QR code."],
  print: ["Isprintaj", "Print"],
  delete: ["Obriši", "Delete"],
  update: ["Osvježi", "Update"],
  medicalDisclaimer: [
    "Ovo je opća informacija, a ne liječnički savjet i ne zamjenjuje liječnika. Ako nisi siguran, ako bol ne prolazi ili se pojave otok, mučnina ili teškoće s disanjem, odmah potraži liječničku pomoć ili zovi 112.",
    "This is general information, not medical advice, and it does not replace a doctor. If you are unsure, the pain does not ease, or there is swelling, nausea or difficulty breathing, get medical help at once or call 112.",
  ],
  speciesDisclaimer: [
    "Informativno: popis vrsta i savjeti su okvirni, nisu službeni i mogu biti nepotpuni ili zastarjeli. Mjerodavni su važeći propisi i upute nadležnih službi i stručnjaka.",
    "For information only: the species list and advice are general, unofficial and may be incomplete or out of date. Current regulations and guidance from the authorities and experts always take precedence.",
  ],
  tip5: ["Podvodni ribolov puškom samo uz sportsku dozvolu, danju, na dah i s plutačom.", "Spearfishing only with a sport licence, in daylight, breath-hold and with a buoy."],
} as const satisfies Record<string, readonly [string, string]>;

export type Key = keyof typeof dict | keyof typeof dict2;

// ---------------------------------------------------------------- content translations

type Locale = Record<string, string>;
export const LOCALES: Partial<Record<Lang, Locale>> = { de, it, pl, cs, sl } as Partial<Record<Lang, Locale>>;

/** Keys with {0}, {1}… are templates for texts built on the server (numbers, names). */
const templates: Partial<Record<Lang, { re: RegExp; idx: number[]; out: string }[]>> = {};
function templatesFor(lang: Lang) {
  if (templates[lang]) return templates[lang]!;
  const loc = LOCALES[lang] ?? {};
  const list = Object.keys(loc)
    .filter((k) => /\{\d\}/.test(k))
    .map((k) => {
      const idx: number[] = [];
      const src = k
        .split(/(\{\d\})/)
        .map((part) => {
          const m = /^\{(\d)\}$/.exec(part);
          if (m) {
            idx.push(Number(m[1]));
            return "([\\s\\S]*?)";
          }
          return part.replace(/[.*+?^$()|[\]\\{}]/g, "\\$&");
        })
        .join("");
      return { re: new RegExp("^" + src + "$"), idx, out: loc[k] };
    });
  templates[lang] = list;
  return list;
}

/** A value inside a template (species name, permit name…): translate if known, keep capitalisation. */
function lookupPart(loc: Locale, v: string): string {
  if (loc[v] != null) return loc[v];
  const lower = v.charAt(0).toLowerCase() + v.slice(1);
  if (loc[lower] != null) return loc[lower].charAt(0).toUpperCase() + loc[lower].slice(1);
  return v;
}

/** True if lang has a translation for this English text (exact or template). Used by tests. */
export function hasTr(en: string, lang: Lang): boolean {
  const loc = LOCALES[lang];
  if (!loc) return false;
  return loc[en] != null || templatesFor(lang).some((tp) => tp.re.test(en));
}

/** Translates an English source text into lang (exact match, then templates). Falls back to English. */
export function tr(en: string, lang: Lang): string {
  if (lang === "en" || lang === "hr") return en;
  const loc = LOCALES[lang];
  if (!loc) return en;
  if (loc[en] != null) return loc[en];
  for (const tpl of templatesFor(lang)) {
    const m = tpl.re.exec(en);
    if (!m) continue;
    let out = tpl.out;
    tpl.idx.forEach((n, i) => {
      const v = m[i + 1];
      out = out.replace(`{${n}}`, lookupPart(loc, v));
    });
    return out;
  }
  return en;
}

/** UI string in the chosen language. */
export const t = (k: Key, lang: Lang): string => {
  if (k in dict) {
    const row = dict[k as keyof typeof dict];
    return row[ORDER.indexOf(lang)] || row[1];
  }
  const row = dict2[k as keyof typeof dict2];
  return lang === "hr" ? row[0] : tr(row[1], lang);
};

/** Content text from the API: hr/en directly, other languages from the text itself or locales/*.json. */
export const c = (x: Text, lang: Lang): string => (lang === "hr" ? x.hr : lang === "en" ? x.en : (x[lang as keyof Text] ?? tr(x.en, lang)));
