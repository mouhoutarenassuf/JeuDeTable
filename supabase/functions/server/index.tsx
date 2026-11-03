import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-36f7c69f/health", (c) => {
  return c.json({ status: "ok" });
});

const gameTypes = new Set(["roles", "cartes", "plateau", "ambiance", "autre"]);
const camps = new Set(["village", "loups", "solitaire", "autre"]);

function cleanText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function validateGame(input: any) {
  const type = cleanText(input?.type, 20);
  const name = cleanText(input?.name, 80);
  const description = cleanText(input?.description, 800);
  const objective = cleanText(input?.objective, 1000);
  const rules = cleanText(input?.rules, 5000);
  const minPlayers = Math.max(1, Math.min(99, Number(input?.minPlayers) || 1));
  const maxPlayers = Math.max(
    minPlayers,
    Math.min(99, Number(input?.maxPlayers) || minPlayers),
  );
  const duration = Math.max(1, Math.min(1440, Number(input?.duration) || 30));

  if (!name || !description || !objective || !rules || !gameTypes.has(type)) {
    throw new Error("Le jeu est incomplet ou son format n’est pas valide.");
  }

  const characters =
    type === "roles" && Array.isArray(input?.characters)
      ? input.characters
          .slice(0, 60)
          .map((character: any, index: number) => ({
            id: Number(character?.id) || index + 1,
            name: cleanText(character?.name, 60),
            camp: camps.has(character?.camp) ? character.camp : "autre",
            description: cleanText(character?.description, 500),
            ability: cleanText(character?.ability, 300),
          }))
          .filter((character: any) => character.name)
      : [];

  if (type === "roles" && characters.length === 0) {
    throw new Error("Ajoutez au moins un personnage à ce jeu de rôles.");
  }

  return {
    id: Number(input?.id) || Date.now(),
    name,
    description,
    type,
    minPlayers,
    maxPlayers,
    duration,
    equipment: cleanText(input?.equipment, 1200),
    objective,
    setup: cleanText(input?.setup, 1600),
    rules,
    variations: cleanText(input?.variations, 1600),
    characters,
    custom: true,
  };
}

async function authenticatedUser(authorization?: string) {
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}

app.get("/make-server-36f7c69f/games", async (c) => {
  try {
    const records = await kv.getByPrefix("game:");
    const games = records.map(({ creatorId: _creatorId, ...game }) => game);
    return c.json({ games });
  } catch (error) {
    console.log("Unable to load games:", error);
    return c.json({ error: "Impossible de charger le catalogue." }, 500);
  }
});

app.post("/make-server-36f7c69f/games", async (c) => {
  const user = await authenticatedUser(c.req.header("Authorization"));
  if (!user) {
    return c.json({ error: "Connectez-vous pour publier un jeu." }, 401);
  }

  try {
    const game = validateGame(await c.req.json());
    await kv.set(`game:${game.id}`, { ...game, creatorId: user.id });
    return c.json({ game }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Jeu invalide.";
    return c.json({ error: message }, 400);
  }
});

Deno.serve(app.fetch);
