import { FormEvent, useMemo, useState } from "react";

type Camp = "village" | "loups" | "solitaire" | "autre";
type GameType = "roles" | "cartes" | "plateau" | "ambiance" | "autre";

type Character = {
  id: number;
  name: string;
  camp: Camp;
  description: string;
  ability: string;
};

type Game = {
  id: number;
  name: string;
  description: string;
  type: GameType;
  minPlayers: number;
  maxPlayers: number;
  duration: number;
  equipment: string;
  rules: string;
  characters: Character[];
};

type Session = {
  code: string;
  game: Game;
  players: string[];
  assignments?: Record<string, number>;
};

type Page =
  | { name: "home" }
  | { name: "game"; id: number }
  | { name: "add" }
  | { name: "lobby"; session: Session; host: boolean; player?: string };

const campNames: Record<Camp, string> = {
  village: "Village",
  loups: "Loups",
  solitaire: "Solitaire",
  autre: "Autre",
};

const gameTypes: Record<
  GameType,
  { label: string; description: string; mark: string }
> = {
  roles: {
    label: "Rôles secrets",
    description: "Identités cachées, narrateur et pouvoirs",
    mark: "R",
  },
  cartes: {
    label: "Jeu de cartes",
    description: "Main de cartes, pioche et défausse",
    mark: "C",
  },
  plateau: {
    label: "Jeu de plateau",
    description: "Plateau, pions et stratégie",
    mark: "P",
  },
  ambiance: {
    label: "Jeu d’ambiance",
    description: "Parties rapides, défis ou équipes",
    mark: "A",
  },
  autre: {
    label: "Autre jeu",
    description: "Un format libre à décrire",
    mark: "J",
  },
};

function playersLabel(game: Game) {
  return game.minPlayers === game.maxPlayers
    ? `${game.minPlayers} joueurs`
    : `${game.minPlayers}–${game.maxPlayers} joueurs`;
}

const defaultCharacters: Character[] = [
  {
    id: 1,
    name: "Villageois",
    camp: "village",
    description:
      "Un habitant sans pouvoir spécial. Il observe, débat et vote pour démasquer les loups.",
    ability: "Vote en journée.",
  },
  {
    id: 2,
    name: "Loup-garou",
    camp: "loups",
    description:
      "Chaque nuit, les loups choisissent leur victime. Le jour, ils se font passer pour des villageois.",
    ability: "Désigne une victime chaque nuit.",
  },
  {
    id: 3,
    name: "Voyante",
    camp: "village",
    description:
      "Elle découvre en secret la véritable identité d’un joueur de son choix.",
    ability: "Observe la carte d’un joueur chaque nuit.",
  },
  {
    id: 4,
    name: "Sorcière",
    camp: "village",
    description:
      "Elle possède deux potions, chacune utilisable une seule fois dans la partie.",
    ability: "Une potion de guérison et une potion de poison.",
  },
  {
    id: 5,
    name: "Chasseur",
    camp: "village",
    description:
      "Quand il est éliminé, il emporte aussitôt un autre joueur avec lui.",
    ability: "Élimine un joueur au moment de sa propre mort.",
  },
  {
    id: 6,
    name: "Cupidon",
    camp: "village",
    description:
      "La première nuit, il unit deux joueurs. Si l’un meurt, l’autre le suit.",
    ability: "Lie deux joueurs la première nuit.",
  },
  {
    id: 7,
    name: "Petite Fille",
    camp: "village",
    description:
      "Elle peut espionner les loups pendant la nuit, au risque d’être découverte.",
    ability: "Peut entrouvrir les yeux la nuit.",
  },
  {
    id: 8,
    name: "Loup Alpha",
    camp: "loups",
    description:
      "Une fois dans la partie, il peut transformer la victime des loups au lieu de l’éliminer.",
    ability: "Contamine un joueur une seule fois dans la partie.",
  },
];

const initialGames: Game[] = [
  {
    id: 1,
    name: "Loup-garou",
    description:
      "Un jeu de déduction en deux temps. La nuit, les loups-garous rôdent. Le jour, le village débat et vote pour éliminer un suspect.",
    type: "roles",
    minPlayers: 6,
    maxPlayers: 24,
    duration: 30,
    equipment: "Une carte de rôle par joueur",
    rules:
      "Le village doit identifier et éliminer les loups-garous. La nuit, les rôles agissent en secret sous la conduite du narrateur. Le jour, tous les joueurs débattent puis votent.",
    characters: defaultCharacters,
  },
  {
    id: 2,
    name: "Uno",
    description:
      "Débarrassez-vous de toutes vos cartes en associant les couleurs ou les valeurs, tout en utilisant les cartes d’action au bon moment.",
    type: "cartes",
    minPlayers: 2,
    maxPlayers: 10,
    duration: 20,
    equipment: "Un paquet de 108 cartes Uno",
    rules:
      "Distribuez 7 cartes à chaque joueur et retournez la première carte de la pioche. À son tour, chacun pose une carte de même couleur, de même valeur ou de même symbole. Si aucune carte ne convient, il faut piocher. Annoncez « Uno » lorsqu’il ne vous reste qu’une carte. Le premier joueur sans carte remporte la manche.",
    characters: [],
  },
];

function MoonMark({ small = false }: { small?: boolean }) {
  return <span className={small ? "moon moon-small" : "moon"} aria-hidden="true" />;
}

function Header({
  onHome,
  onAdd,
}: {
  onHome: () => void;
  onAdd: () => void;
}) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onHome}>
        <MoonMark small />
        <span>La Table</span>
      </button>
      <button className="header-link" onClick={onAdd}>
        <span className="plus">+</span>
        Ajouter un jeu
      </button>
    </header>
  );
}

function Home({
  games,
  sessions,
  onOpen,
  onJoin,
}: {
  games: Game[];
  sessions: Session[];
  onOpen: (id: number) => void;
  onJoin: (session: Session, player: string) => void;
}) {
  const [code, setCode] = useState("");
  const [player, setPlayer] = useState("");
  const [message, setMessage] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (code.length !== 5) {
      setMessage("Le code doit contenir 5 caractères.");
      return;
    }
    const session = sessions.find((item) => item.code === code);
    if (!session) {
      setMessage("Cette partie n’existe pas encore dans cette démo.");
      return;
    }
    onJoin(session, player.trim());
  }

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Le jeu commence ici</p>
          <h1>Réunissez-vous autour de la table.</h1>
          <p>
            Retrouvez les règles, préparez le matériel et lancez vos jeux
            préférés, des cartes aux rôles secrets.
          </p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="star star-a">✦</span>
          <span className="star star-b">·</span>
          <span className="star star-c">✦</span>
          <MoonMark />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
        </div>
      </section>

      <section className="join-card">
        <div className="section-intro">
          <span className="step-number">01</span>
          <div>
            <h2>Rejoindre une partie</h2>
            <p>Saisissez le code partagé par votre narrateur.</p>
          </div>
        </div>
        <form className="join-form" onSubmit={submit}>
          <label>
            Code de la partie
            <input
              className="code-input"
              maxLength={5}
              placeholder="ABCDE"
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, ""),
                )
              }
            />
          </label>
          <label>
            Votre pseudo
            <input
              maxLength={20}
              placeholder="Comment vous appeler ?"
              value={player}
              onChange={(event) => setPlayer(event.target.value)}
              required
            />
          </label>
          <button className="primary-button" type="submit">
            Rejoindre la table
          </button>
        </form>
        {message && <p className="form-message">{message}</p>}
      </section>

      <section className="catalog">
        <div className="catalog-heading">
          <div className="section-intro">
            <span className="step-number">02</span>
            <div>
              <h2>Choisir un jeu</h2>
              <p>Choisissez une fiche et préparez votre prochaine partie.</p>
            </div>
          </div>
          <span className="game-count">
            {games.length} jeu{games.length > 1 ? "x" : ""}
          </span>
        </div>
        <div className="game-grid">
          {games.map((game, index) => (
            <button
              className="game-card"
              key={game.id}
              onClick={() => onOpen(game.id)}
            >
              <div className={`game-visual visual-${index % 3}`}>
                {game.type === "roles" ? (
                  <MoonMark />
                ) : (
                  <span className="visual-mark">{gameTypes[game.type].mark}</span>
                )}
                <span className="card-number">0{index + 1}</span>
              </div>
              <div className="game-card-content">
                <div>
                  <span className="card-kicker">
                    {gameTypes[game.type].label}
                  </span>
                  <h3>{game.name}</h3>
                </div>
                <p>{game.description}</p>
                <span className="game-meta">
                  {playersLabel(game)} · {game.duration} min
                  <span className="arrow">→</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}

function GameDetail({
  game,
  onBack,
  onStart,
}: {
  game: Game;
  onBack: () => void;
  onStart: () => void;
}) {
  const roleGame = game.type === "roles";

  return (
    <section className="detail-page">
      <button className="back-link" onClick={onBack}>
        ← Tous les jeux
      </button>
      <div className="detail-hero">
        <div>
          <p className="eyebrow">{gameTypes[game.type].label}</p>
          <h1>{game.name}</h1>
          <p className="detail-description">{game.description}</p>
          {roleGame ? (
            <>
              <button className="primary-button start-button" onClick={onStart}>
                Créer un salon
              </button>
              <p className="help">
                Vous serez le narrateur : vous voyez toutes les cartes, mais
                n’en recevez pas.
              </p>
            </>
          ) : (
            <div className="game-facts">
              <span>{playersLabel(game)}</span>
              <span>Environ {game.duration} min</span>
            </div>
          )}
        </div>
        <div className="detail-moon">
          {roleGame ? (
            <MoonMark />
          ) : (
            <span className="game-type-mark">{gameTypes[game.type].mark}</span>
          )}
          <span>{gameTypes[game.type].description}</span>
        </div>
      </div>
      {roleGame ? (
        <>
          <div className="characters-heading">
            <div>
              <p className="eyebrow">Le casting</p>
              <h2>Les personnages</h2>
            </div>
            <span>{game.characters.length} rôles</span>
          </div>
          <div className="characters-grid">
            {game.characters.map((character) => (
              <article
                className={`character-card camp-${character.camp}`}
                key={character.id}
              >
                <div className="character-top">
                  <span className="character-initial">{character.name[0]}</span>
                  <span className="camp-tag">{campNames[character.camp]}</span>
                </div>
                <h3>{character.name}</h3>
                <p>{character.description}</p>
                <small>{character.ability}</small>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="rules-layout">
          <article className="rules-detail-card">
            <p className="eyebrow">Comment jouer</p>
            <h2>Règles essentielles</h2>
            <p>{game.rules}</p>
          </article>
          <aside className="equipment-card">
            <p className="eyebrow">À préparer</p>
            <h3>Matériel</h3>
            <p>{game.equipment || "Aucun matériel particulier indiqué."}</p>
          </aside>
        </div>
      )}
    </section>
  );
}

function AddGame({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (game: Game) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<GameType>("cartes");
  const [minPlayers, setMinPlayers] = useState(2);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [duration, setDuration] = useState(30);
  const [equipment, setEquipment] = useState("");
  const [rules, setRules] = useState("");
  const [characters, setCharacters] = useState<Character[]>([
    { id: 1, name: "", camp: "village", description: "", ability: "" },
  ]);

  function update(id: number, changes: Partial<Character>) {
    setCharacters((items) =>
      items.map((item) => (item.id === id ? { ...item, ...changes } : item)),
    );
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({
      id: Date.now(),
      name,
      description,
      type,
      minPlayers,
      maxPlayers: Math.max(minPlayers, maxPlayers),
      duration,
      equipment,
      rules,
      characters:
        type === "roles"
          ? characters.filter((character) => character.name.trim())
          : [],
    });
  }

  return (
    <section className="form-page">
      <button className="back-link" onClick={onCancel}>← Annuler</button>
      <p className="eyebrow">Votre univers</p>
      <h1>Ajouter un jeu</h1>
      <p className="detail-description">
        Cartes, plateau, ambiance ou rôles secrets : la fiche s’adapte
        automatiquement au jeu que vous choisissez.
      </p>
      <form onSubmit={submit}>
        <div className="form-section">
          <span className="form-section-number">01</span>
          <div className="form-section-content">
            <h2>Informations générales</h2>
            <fieldset className="type-picker">
              <legend>Quel genre de jeu ajoutez-vous ?</legend>
              <div>
                {Object.entries(gameTypes).map(([value, option]) => (
                  <label
                    className={type === value ? "is-selected" : ""}
                    key={value}
                  >
                    <input
                      type="radio"
                      name="game-type"
                      value={value}
                      checked={type === value}
                      onChange={() => setType(value as GameType)}
                    />
                    <span className="type-mark">{option.mark}</span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              Nom du jeu
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Le nom de votre jeu"
                required
              />
            </label>
            <label>
              Description
              <textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Expliquez l’univers et le principe du jeu..."
                required
              />
            </label>
            <div className="three-columns">
              <label>
                Joueurs minimum
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={minPlayers}
                  onChange={(event) => setMinPlayers(Number(event.target.value))}
                  required
                />
              </label>
              <label>
                Joueurs maximum
                <input
                  type="number"
                  min={minPlayers}
                  max={99}
                  value={maxPlayers}
                  onChange={(event) => setMaxPlayers(Number(event.target.value))}
                  required
                />
              </label>
              <label>
                Durée en minutes
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                  required
                />
              </label>
            </div>
          </div>
        </div>
        <div className="form-section">
          <span className="form-section-number">02</span>
          <div className="form-section-content">
            {type === "roles" ? (
              <>
                <h2>Personnages et rôles</h2>
                <p className="section-help">
                  Ajoutez les identités à distribuer. La Table utilisera cette
                  liste pour composer le paquet du salon.
                </p>
                {characters.map((character, index) => (
                  <fieldset className="character-form" key={character.id}>
                    <legend>Personnage {index + 1}</legend>
                    <div className="two-columns">
                      <label>
                        Nom
                        <input
                          value={character.name}
                          onChange={(event) =>
                            update(character.id, { name: event.target.value })
                          }
                          placeholder="Nom du rôle"
                          required={index === 0}
                        />
                      </label>
                      <label>
                        Camp
                        <select
                          value={character.camp}
                          onChange={(event) =>
                            update(character.id, {
                              camp: event.target.value as Camp,
                            })
                          }
                        >
                          {Object.entries(campNames).map(([value, label]) => (
                            <option value={value} key={value}>{label}</option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label>
                      Description
                      <textarea
                        rows={2}
                        value={character.description}
                        onChange={(event) =>
                          update(character.id, { description: event.target.value })
                        }
                      />
                    </label>
                    {characters.length > 1 && (
                      <button
                        className="remove-button"
                        type="button"
                        onClick={() =>
                          setCharacters((items) =>
                            items.filter((item) => item.id !== character.id),
                          )
                        }
                      >
                        Retirer ce personnage
                      </button>
                    )}
                  </fieldset>
                ))}
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    setCharacters((items) => [
                      ...items,
                      {
                        id: Date.now(),
                        name: "",
                        camp: "village",
                        description: "",
                        ability: "",
                      },
                    ])
                  }
                >
                  + Ajouter un personnage
                </button>
              </>
            ) : (
              <>
                <h2>Préparation et règles</h2>
                <p className="section-help">
                  Pas besoin de personnages pour ce format. Indiquez simplement
                  ce qu’il faut poser sur la table et comment lancer une partie.
                </p>
                <label>
                  Matériel nécessaire
                  <input
                    value={equipment}
                    onChange={(event) => setEquipment(event.target.value)}
                    placeholder="Ex. un paquet de cartes, 4 pions et un dé"
                  />
                </label>
                <label>
                  Règles essentielles
                  <textarea
                    rows={7}
                    value={rules}
                    onChange={(event) => setRules(event.target.value)}
                    placeholder="Décrivez la mise en place, le déroulement d’un tour et la condition de victoire..."
                    required
                  />
                </label>
              </>
            )}
          </div>
        </div>
        <button className="primary-button save-button" type="submit">
          Ajouter le jeu
        </button>
      </form>
    </section>
  );
}

function Lobby({
  page,
  onHome,
  onUpdate,
}: {
  page: Extract<Page, { name: "lobby" }>;
  onHome: () => void;
  onUpdate: (session: Session) => void;
}) {
  const { session, host, player } = page;
  const [dealing, setDealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"briefing" | "night" | "day">("briefing");
  const [round, setRound] = useState(1);
  const [eliminated, setEliminated] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [awakeRole, setAwakeRole] = useState<string | null>(null);
  const [lovers, setLovers] = useState<string[]>([]);
  const [cupidSelection, setCupidSelection] = useState<string[]>([]);
  const [seerTarget, setSeerTarget] = useState<string | null>(null);
  const [wolfVictim, setWolfVictim] = useState<string | null>(null);
  const [witchSave, setWitchSave] = useState(false);
  const [witchPoison, setWitchPoison] = useState<string | null>(null);
  const [witchLifeUsed, setWitchLifeUsed] = useState(false);
  const [witchPoisonUsed, setWitchPoisonUsed] = useState(false);
  const [infected, setInfected] = useState<string[]>([]);
  const [alphaTarget, setAlphaTarget] = useState<string | null>(null);
  const [alphaUsed, setAlphaUsed] = useState(false);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const distributed = Boolean(session.assignments);
  const assignedCharacter = useMemo(() => {
    const characterId = session.assignments?.[player || ""];
    return (
      session.game.characters.find((character) => character.id === characterId) ||
      session.game.characters[0]
    );
  }, [player, session]);

  const assignedPlayers = useMemo(
    () =>
      session.players.map((name) => ({
        name,
        character:
          session.game.characters.find(
            (character) => character.id === session.assignments?.[name],
          ) || session.game.characters[0],
      })),
    [session],
  );
  const alivePlayers = assignedPlayers.filter(
    ({ name }) => !eliminated.includes(name),
  );
  const aliveWolves = alivePlayers.filter(
    ({ name, character }) =>
      character.camp === "loups" || infected.includes(name),
  ).length;
  const aliveOpponents = alivePlayers.length - aliveWolves;
  const winner =
    phase !== "day"
      ? null
      : aliveWolves === 0
        ? "village"
        : aliveWolves >= aliveOpponents
          ? "loups"
          : null;

  function addDemoPlayer() {
    const names = ["Camille", "Noa", "Lou", "Sacha", "Charlie"];
    const next = names.find((name) => !session.players.includes(name));
    if (next) onUpdate({ ...session, players: [...session.players, next] });
  }

  function makeAutomaticDeck() {
    const characters = session.game.characters;
    const villagers =
      characters.find((character) => character.name === "Villageois") ||
      characters.find((character) => character.camp === "village") ||
      characters[0];
    const wolves = characters.filter((character) => character.camp === "loups");
    const specials = characters.filter(
      (character) =>
        character.id !== villagers.id && character.camp !== "loups",
    );
    const deck: Character[] = [];

    const wolfCount =
      wolves.length && session.players.length >= 3
        ? Math.max(1, Math.floor(session.players.length / 4))
        : 0;
    for (let index = 0; index < wolfCount; index += 1) {
      deck.push(wolves[index % wolves.length]);
    }

    const specialCount = Math.min(
      specials.length,
      Math.max(0, session.players.length - deck.length - 1),
      3,
    );
    deck.push(...specials.slice(0, specialCount));
    while (deck.length < session.players.length) deck.push(villagers);
    return deck;
  }

  function shuffle<T>(items: T[]) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [shuffled[index], shuffled[target]] = [
        shuffled[target],
        shuffled[index],
      ];
    }
    return shuffled;
  }

  function distributeCards() {
    if (!session.players.length || dealing) return;

    const manualDeck = session.game.characters.flatMap((character) =>
      Array.from({ length: counts[character.id] || 0 }, () => character),
    );
    const deck =
      manualDeck.length === session.players.length
        ? manualDeck
        : makeAutomaticDeck();
    const nextCounts = deck.reduce<Record<number, number>>((result, character) => {
      result[character.id] = (result[character.id] || 0) + 1;
      return result;
    }, {});
    const shuffledDeck = shuffle(deck);
    const assignments = Object.fromEntries(
      session.players.map((name, index) => [name, shuffledDeck[index].id]),
    );

    setCounts(nextCounts);
    setDealing(true);
    window.setTimeout(() => {
      onUpdate({ ...session, assignments });
      setDealing(false);
      setPhase("briefing");
      setRound(1);
      setEliminated([]);
      setCompletedSteps([]);
      setHistory(["Les rôles ont été distribués."]);
      setAwakeRole(null);
      setLovers([]);
      setCupidSelection([]);
      setSeerTarget(null);
      setWolfVictim(null);
      setWitchSave(false);
      setWitchPoison(null);
      setWitchLifeUsed(false);
      setWitchPoisonUsed(false);
      setInfected([]);
      setAlphaTarget(null);
      setAlphaUsed(false);
    }, 1500);
  }

  function resetGame() {
    const { assignments: _assignments, ...waitingSession } = session;
    onUpdate(waitingSession);
    setPhase("briefing");
    setRound(1);
    setEliminated([]);
    setCompletedSteps([]);
    setHistory([]);
    setAwakeRole(null);
    setLovers([]);
    setCupidSelection([]);
    setSeerTarget(null);
    setWolfVictim(null);
    setWitchSave(false);
    setWitchPoison(null);
    setWitchLifeUsed(false);
    setWitchPoisonUsed(false);
    setInfected([]);
    setAlphaTarget(null);
    setAlphaUsed(false);
  }

  function resetNightActions() {
    setAwakeRole(null);
    setSeerTarget(null);
    setWolfVictim(null);
    setWitchSave(false);
    setWitchPoison(null);
    setAlphaTarget(null);
    setCompletedSteps([]);
  }

  function resolveNight() {
    const deaths = new Set<string>();
    if (wolfVictim && !witchSave && !alphaTarget) deaths.add(wolfVictim);
    if (witchPoison) deaths.add(witchPoison);
    if (lovers.length === 2 && lovers.some((name) => deaths.has(name))) {
      lovers.forEach((name) => deaths.add(name));
    }

    const newDeaths = [...deaths].filter((name) => !eliminated.includes(name));
    if (newDeaths.length) {
      setEliminated((items) => [...new Set([...items, ...newDeaths])]);
      setHistory((items) => [
        `${newDeaths.join(" et ")} ${
          newDeaths.length > 1 ? "sont éliminés" : "est éliminé"
        } pendant la nuit ${round}.`,
        ...items,
      ]);
    } else {
      setHistory((items) => [
        `Personne n’est éliminé pendant la nuit ${round}.`,
        ...items,
      ]);
    }

    if (alphaTarget && !infected.includes(alphaTarget)) {
      setInfected((items) => [...items, alphaTarget]);
      setAlphaUsed(true);
      setHistory((items) => [
        `${alphaTarget} a été contaminé par le Loup Alpha.`,
        ...items,
      ]);
    }
    if (witchSave) setWitchLifeUsed(true);
    if (witchPoison) setWitchPoisonUsed(true);

    setPhase("day");
    setHistory((items) => [`Le village se réveille au jour ${round}.`, ...items]);
    resetNightActions();
  }

  function nextPhase() {
    if (phase === "briefing") {
      setPhase("night");
      setHistory((items) => ["La nuit 1 commence.", ...items]);
      setCompletedSteps([]);
      return;
    }
    if (phase === "night") {
      resolveNight();
      return;
    }
    setRound((current) => current + 1);
    setPhase("night");
    setHistory((items) => [`La nuit ${round + 1} commence.`, ...items]);
    resetNightActions();
  }

  function toggleEliminated(name: string, character: Character) {
    if (eliminated.includes(name)) {
      setEliminated((items) => items.filter((item) => item !== name));
      setHistory((items) => [
        `${name} revient dans la partie.`,
        ...items,
      ]);
      return;
    }
    setEliminated((items) => [...items, name]);
    setHistory((items) => [
      `${name}, ${character.name}, est éliminé.`,
      ...items,
    ]);
  }

  function toggleStep(step: string) {
    setCompletedSteps((items) =>
      items.includes(step)
        ? items.filter((item) => item !== step)
        : [...items, step],
    );
  }

  function toggleCupidPlayer(name: string) {
    setCupidSelection((items) =>
      items.includes(name)
        ? items.filter((item) => item !== name)
        : items.length < 2
          ? [...items, name]
          : [items[1], name],
    );
  }

  function confirmLovers() {
    if (cupidSelection.length !== 2) return;
    setLovers(cupidSelection);
    setHistory((items) => [
      `${cupidSelection[0]} et ${cupidSelection[1]} sont liés par Cupidon.`,
      ...items,
    ]);
    setCompletedSteps((items) => [...new Set([...items, "Cupidon"])]);
    setAwakeRole(null);
  }

  const phaseContent = {
    briefing: {
      label: "Préparation",
      title: "Tout le monde découvre son rôle",
      text: "Chaque joueur regarde sa carte en secret, puis pose son téléphone face cachée. Quand tout le monde est prêt, lancez la première nuit.",
      action: "Endormir le village",
    },
    night: {
      label: `Nuit ${round}`,
      title: "Le village s’endort",
      text: "Demandez à tous de fermer les yeux. Appelez les rôles dans l’ordre : Cupidon à la première nuit, Voyante, Loups-garous, puis Sorcière.",
      action: "Réveiller le village et résoudre la nuit",
    },
    day: {
      label: `Jour ${round}`,
      title: "Le village se réveille",
      text: "Annoncez les événements de la nuit sans révéler les rôles. Laissez débattre les joueurs, puis organisez un vote pour éliminer un suspect.",
      action: `Endormir le village — nuit ${round + 1}`,
    },
  }[phase];

  const activeRoleNames = new Set(
    alivePlayers.map(({ character }) => character.name),
  );
  const wakeableRoles = [
    ...(round === 1 && activeRoleNames.has("Cupidon") && lovers.length !== 2
      ? [{ id: "Cupidon", label: "Réveiller Cupidon", detail: "Former le couple" }]
      : []),
    ...(activeRoleNames.has("Voyante")
      ? [{ id: "Voyante", label: "Réveiller la Voyante", detail: "Voir un rôle" }]
      : []),
    ...(aliveWolves > 0
      ? [{ id: "Loups", label: "Réveiller les Loups", detail: "Choisir une victime" }]
      : []),
    ...(activeRoleNames.has("Loup Alpha") && !alphaUsed
      ? [{ id: "Loup Alpha", label: "Réveiller le Loup Alpha", detail: "Contaminer ou passer" }]
      : []),
    ...(activeRoleNames.has("Sorcière")
      ? [{ id: "Sorcière", label: "Réveiller la Sorcière", detail: "Sauver ou empoisonner" }]
      : []),
  ];
  const phaseSteps =
    phase === "briefing"
      ? [
          "Chaque joueur a consulté sa carte",
          "Les téléphones sont posés face cachée",
          "Tout le monde connaît les conditions de victoire",
        ]
      : [
            "Annoncer les événements de la nuit",
            "Laisser le village débattre",
            "Organiser le vote",
            "Marquer le joueur éliminé ci-dessous",
          ];
  const seerCharacter = assignedPlayers.find(
    ({ name }) => name === seerTarget,
  )?.character;

  return (
    <section className="lobby-page">
      <div className="lobby-header">
        <div>
          <p className="eyebrow">{session.game.name}</p>
          <span>Code de la partie</span>
          <h1 className="lobby-code">{session.code}</h1>
        </div>
        <MoonMark />
      </div>
      {host ? (
        <>
          <div className="lobby-section">
            <div className="lobby-title">
              <h2>Joueurs</h2>
              <span>{session.players.length} / 24</span>
            </div>
            {session.players.length ? (
              <ul className="player-list">
                {session.players.map((name, index) => (
                  <li key={name}>
                    <span className="avatar">{name[0]}</span>
                    {name}
                    <small>Joueur {index + 1}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                En attente des joueurs. Partagez le code ci-dessus.
              </p>
            )}
            {!distributed && (
              <button className="text-button" onClick={addDemoPlayer}>
                + Ajouter un joueur de démonstration
              </button>
            )}
          </div>
          {!distributed ? (
            <>
              <div className="lobby-section">
                <div className="lobby-title">
                  <h2>Composition du paquet</h2>
                  <span>{total} / {session.players.length}</span>
                </div>
                <p className="composition-help">
                  Facultatif : ajustez les rôles, ou distribuez directement pour
                  laisser La Table créer une composition équilibrée.
                </p>
                <div className="composition-list">
                  {session.game.characters.map((character) => (
                    <div className="composition-row" key={character.id}>
                      <div>
                        <strong>{character.name}</strong>
                        <span className={`camp-dot dot-${character.camp}`} />
                      </div>
                      <div className="counter">
                        <button
                          aria-label={`Retirer un rôle ${character.name}`}
                          onClick={() =>
                            setCounts({
                              ...counts,
                              [character.id]: Math.max(
                                0,
                                (counts[character.id] || 0) - 1,
                              ),
                            })
                          }
                        >−</button>
                        <span>{counts[character.id] || 0}</span>
                        <button
                          aria-label={`Ajouter un rôle ${character.name}`}
                          onClick={() =>
                            setCounts({
                              ...counts,
                              [character.id]: (counts[character.id] || 0) + 1,
                            })
                          }
                        >+</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="primary-button distribute-button"
                disabled={!session.players.length || dealing}
                onClick={distributeCards}
              >
                {dealing
                  ? "Distribution en cours…"
                  : total === session.players.length
                    ? "Mélanger et distribuer"
                    : "Créer le paquet et distribuer"}
              </button>
            </>
          ) : (
            <div className="game-master-panel">
              <div className="distribution-success" role="status">
                <span className="success-mark">✓</span>
                <div>
                  <strong>Les cartes sont distribuées</strong>
                  <p>
                    En mode démonstration, le narrateur voit toutes les cartes.
                    En ligne, chaque joueur ne verra que la sienne.
                  </p>
                </div>
              </div>
              <div className="game-status">
                <div>
                  <span>En vie</span>
                  <strong>{alivePlayers.length}</strong>
                </div>
                <div>
                  <span>Éliminés</span>
                  <strong>{eliminated.length}</strong>
                </div>
                <div>
                  <span>Tour</span>
                  <strong>{phase === "briefing" ? "—" : round}</strong>
                </div>
              </div>
              <div className="dealt-grid">
                {assignedPlayers.map(({ name, character }, index) => (
                  <article
                    className={`dealt-card camp-${character.camp} ${
                      eliminated.includes(name) ? "is-eliminated" : ""
                    }`}
                    key={name}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <span className="dealt-player">{name}</span>
                    <div className="player-badges">
                      {lovers.includes(name) && <span>Amoureux</span>}
                      {infected.includes(name) && <span>Contaminé</span>}
                    </div>
                    <span className="role-symbol" aria-hidden="true">
                      {character.camp === "loups" ? "L" : character.name[0]}
                    </span>
                    <strong>{character.name}</strong>
                    <small>{character.ability}</small>
                    {phase !== "briefing" && (
                      <button
                        className="player-state-button"
                        onClick={() => toggleEliminated(name, character)}
                      >
                        {eliminated.includes(name)
                          ? "Remettre en jeu"
                          : "Marquer éliminé"}
                      </button>
                    )}
                  </article>
                ))}
              </div>
              {winner && (
                <div className={`victory-banner victory-${winner}`} role="status">
                  <span className="phase-label">Partie terminée</span>
                  <h2>
                    {winner === "village"
                      ? "Le Village remporte la partie"
                      : "Les Loups-garous remportent la partie"}
                  </h2>
                  <p>
                    {winner === "village"
                      ? "Tous les loups-garous ont été éliminés."
                      : "Les loups sont désormais aussi nombreux que leurs adversaires."}
                  </p>
                  <button className="primary-button" onClick={resetGame}>
                    Préparer une nouvelle partie
                  </button>
                </div>
              )}
              <div className={`phase-card phase-${phase}`}>
                <span className="phase-label">{phaseContent.label}</span>
                <h2>{phaseContent.title}</h2>
                <p>{phaseContent.text}</p>
                {phase === "night" ? (
                  <div className="night-console">
                    <div className="wake-list">
                      {wakeableRoles.map((role) => (
                        <button
                          className={`${awakeRole === role.id ? "is-awake" : ""} ${
                            completedSteps.includes(role.id) ? "is-complete" : ""
                          }`}
                          key={role.id}
                          onClick={() =>
                            setAwakeRole((current) =>
                              current === role.id ? null : role.id,
                            )
                          }
                        >
                          <span>{completedSteps.includes(role.id) ? "✓" : "○"}</span>
                          <strong>{role.label}</strong>
                          <small>{role.detail}</small>
                        </button>
                      ))}
                    </div>

                    {awakeRole === "Cupidon" && (
                      <div className="role-action">
                        <span className="phase-label">Action de Cupidon</span>
                        <h3>Choisir deux amoureux</h3>
                        <p>Sélectionnez deux joueurs. Si l’un meurt, l’autre sera également éliminé.</p>
                        <div className="player-picker">
                          {alivePlayers.map(({ name }) => (
                            <button
                              className={cupidSelection.includes(name) ? "is-selected" : ""}
                              key={name}
                              onClick={() => toggleCupidPlayer(name)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                        {cupidSelection.length === 2 && (
                          <div className="couple-preview">
                            <strong>{cupidSelection[0]}</strong>
                            <span>→ liés à →</span>
                            <strong>{cupidSelection[1]}</strong>
                          </div>
                        )}
                        <button
                          className="secondary-button role-confirm"
                          disabled={cupidSelection.length !== 2}
                          onClick={confirmLovers}
                        >
                          Confirmer le couple
                        </button>
                      </div>
                    )}

                    {awakeRole === "Voyante" && (
                      <div className="role-action">
                        <span className="phase-label">Action de la Voyante</span>
                        <h3>Observer un joueur</h3>
                        <div className="player-picker">
                          {alivePlayers.map(({ name }) => (
                            <button
                              className={seerTarget === name ? "is-selected" : ""}
                              key={name}
                              onClick={() => setSeerTarget(name)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                        {seerTarget && seerCharacter && (
                          <div className="role-result">
                            {seerTarget} est <strong>{seerCharacter.name}</strong>
                          </div>
                        )}
                        <button
                          className="secondary-button role-confirm"
                          disabled={!seerTarget}
                          onClick={() => {
                            setCompletedSteps((items) => [...new Set([...items, "Voyante"])]);
                            setAwakeRole(null);
                          }}
                        >
                          Rendormir la Voyante
                        </button>
                      </div>
                    )}

                    {awakeRole === "Loups" && (
                      <div className="role-action">
                        <span className="phase-label">Action des Loups-garous</span>
                        <h3>Choisir une victime</h3>
                        <div className="player-picker">
                          {alivePlayers
                            .filter(
                              ({ name, character }) =>
                                character.camp !== "loups" && !infected.includes(name),
                            )
                            .map(({ name }) => (
                              <button
                                className={wolfVictim === name ? "is-danger" : ""}
                                key={name}
                                onClick={() => setWolfVictim(name)}
                              >
                                {name}
                              </button>
                            ))}
                        </div>
                        <button
                          className="secondary-button role-confirm"
                          disabled={!wolfVictim}
                          onClick={() => {
                            setCompletedSteps((items) => [...new Set([...items, "Loups"])]);
                            setAwakeRole(null);
                          }}
                        >
                          Confirmer la victime
                        </button>
                      </div>
                    )}

                    {awakeRole === "Loup Alpha" && (
                      <div className="role-action">
                        <span className="phase-label">Pouvoir unique</span>
                        <h3>Contaminer la victime des loups ?</h3>
                        <p>
                          {wolfVictim
                            ? `${wolfVictim} rejoindra secrètement le camp des loups au lieu de mourir.`
                            : "Les loups doivent d’abord choisir une victime."}
                        </p>
                        <div className="role-actions-row">
                          <button
                            className="secondary-button"
                            disabled={!wolfVictim}
                            onClick={() => setAlphaTarget(wolfVictim)}
                          >
                            Contaminer {wolfVictim || "la victime"}
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              setAlphaTarget(null);
                              setCompletedSteps((items) => [...new Set([...items, "Loup Alpha"])]);
                              setAwakeRole(null);
                            }}
                          >
                            Ne pas utiliser le pouvoir
                          </button>
                        </div>
                        {alphaTarget && (
                          <button
                            className="primary-button role-confirm"
                            onClick={() => {
                              setCompletedSteps((items) => [...new Set([...items, "Loup Alpha"])]);
                              setAwakeRole(null);
                            }}
                          >
                            Confirmer la contamination
                          </button>
                        )}
                      </div>
                    )}

                    {awakeRole === "Sorcière" && (
                      <div className="role-action">
                        <span className="phase-label">Action de la Sorcière</span>
                        <h3>Potions de la nuit</h3>
                        <p>
                          Victime des loups : <strong>{wolfVictim || "aucune"}</strong>
                        </p>
                        {wolfVictim && !witchLifeUsed && (
                          <button
                            className={`potion-button ${witchSave ? "is-selected" : ""}`}
                            onClick={() => setWitchSave((current) => !current)}
                          >
                            {witchSave ? "Potion de vie utilisée" : `Sauver ${wolfVictim}`}
                          </button>
                        )}
                        {witchLifeUsed && <p>La potion de vie a déjà été utilisée.</p>}
                        {!witchPoisonUsed ? (
                          <>
                            <p>Choisissez éventuellement une victime pour la potion de poison :</p>
                            <div className="player-picker">
                              {alivePlayers.map(({ name }) => (
                                <button
                                  className={witchPoison === name ? "is-danger" : ""}
                                  key={name}
                                  onClick={() =>
                                    setWitchPoison((current) => current === name ? null : name)
                                  }
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <p>La potion de poison a déjà été utilisée.</p>
                        )}
                        <button
                          className="secondary-button role-confirm"
                          onClick={() => {
                            setCompletedSteps((items) => [...new Set([...items, "Sorcière"])]);
                            setAwakeRole(null);
                          }}
                        >
                          Rendormir la Sorcière
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="phase-checklist">
                    {phaseSteps.map((step) => (
                      <button
                        className={completedSteps.includes(step) ? "is-complete" : ""}
                        key={step}
                        onClick={() => toggleStep(step)}
                      >
                        <span>{completedSteps.includes(step) ? "✓" : ""}</span>
                        {step}
                      </button>
                    ))}
                  </div>
                )}
                {!winner && (
                  <button className="primary-button" onClick={nextPhase}>
                    {phaseContent.action}
                  </button>
                )}
              </div>
              <div className="rules-card">
                <h3>Comment gagner ?</h3>
                <div>
                  <p><strong>Village :</strong> éliminer tous les loups-garous.</p>
                  <p><strong>Loups :</strong> devenir aussi nombreux que les autres joueurs.</p>
                </div>
              </div>
              {history.length > 0 && (
                <div className="history-card">
                  <div className="lobby-title">
                    <h2>Journal de partie</h2>
                    <span>{history.length} événement{history.length > 1 ? "s" : ""}</span>
                  </div>
                  <ol>
                    {history.map((event, index) => (
                      <li key={`${event}-${index}`}>{event}</li>
                    ))}
                  </ol>
                </div>
              )}
              <button className="secondary-button reset-button" onClick={resetGame}>
                Recomposer et redistribuer
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="player-view">
          <p className="eyebrow">Votre rôle secret</p>
          {distributed ? (
            <button
              className={`secret-card ${revealed ? "is-revealed" : ""}`}
              onPointerDown={() => setRevealed(true)}
              onPointerUp={() => setRevealed(false)}
              onPointerLeave={() => setRevealed(false)}
            >
              <span className="secret-back">
                <MoonMark />
                Maintenez pour révéler
              </span>
              <span className="secret-front">
                <span className={`camp-tag camp-${assignedCharacter.camp}`}>
                  {campNames[assignedCharacter.camp]}
                </span>
                <strong>{assignedCharacter.name}</strong>
                <small>{assignedCharacter.description}</small>
              </span>
            </button>
          ) : (
            <div className="waiting-card">
              <MoonMark />
              <h2>Bienvenue, {player}</h2>
              <p>Le narrateur prépare les cartes. La partie va bientôt commencer.</p>
            </div>
          )}
        </div>
      )}
      {dealing && (
        <div className="dealing-overlay" role="status" aria-live="polite">
          <div className="dealing-stack" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <strong>La Table mélange les rôles…</strong>
          <small>Chaque carte sera attribuée au hasard.</small>
        </div>
      )}
      <button className="back-link lobby-exit" onClick={onHome}>← Quitter la partie</button>
    </section>
  );
}

export default function App() {
  const [games, setGames] = useState(initialGames);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [page, setPage] = useState<Page>({ name: "home" });

  const currentGame =
    page.name === "game" ? games.find((game) => game.id === page.id) : undefined;

  function startSession(game: Game) {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const code = Array.from(
      { length: 5 },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join("");
    const session = { code, game, players: [] };
    setSessions((items) => [...items, session]);
    setPage({ name: "lobby", session, host: true });
  }

  function updateSession(updated: Session) {
    setSessions((items) =>
      items.map((session) =>
        session.code === updated.code ? updated : session,
      ),
    );
    setPage((current) =>
      current.name === "lobby" ? { ...current, session: updated } : current,
    );
  }

  return (
    <div className="app-shell">
      <Header
        onHome={() => setPage({ name: "home" })}
        onAdd={() => setPage({ name: "add" })}
      />
      <main>
        {page.name === "home" && (
          <Home
            games={games}
            sessions={sessions}
            onOpen={(id) => setPage({ name: "game", id })}
            onJoin={(session, player) => {
              const updated = {
                ...session,
                players: session.players.includes(player)
                  ? session.players
                  : [...session.players, player],
              };
              setSessions((items) =>
                items.map((item) => (item.code === session.code ? updated : item)),
              );
              setPage({ name: "lobby", session: updated, host: false, player });
            }}
          />
        )}
        {page.name === "game" && currentGame && (
          <GameDetail
            game={currentGame}
            onBack={() => setPage({ name: "home" })}
            onStart={() => startSession(currentGame)}
          />
        )}
        {page.name === "add" && (
          <AddGame
            onCancel={() => setPage({ name: "home" })}
            onSave={(game) => {
              setGames((items) => [...items, game]);
              setPage({ name: "game", id: game.id });
            }}
          />
        )}
        {page.name === "lobby" && (
          <Lobby
            page={page}
            onHome={() => setPage({ name: "home" })}
            onUpdate={updateSession}
          />
        )}
      </main>
      <footer>
        <span>La Table</span>
        <p>Des histoires à jouer, ensemble.</p>
      </footer>
    </div>
  );
}
