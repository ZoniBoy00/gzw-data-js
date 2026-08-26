import { GzwDataClient, type DatasetResource, type GzwRecord, type Weapon } from "../src/index.js";

const client = new GzwDataClient({ baseUrl: "https://example.test/api" });
const weapons = client.dataset("weapons");
const dynamic = client.dataset("new-scraper-dataset");

const typedWeapons: DatasetResource<Weapon> = weapons;
const dynamicRecords: DatasetResource<GzwRecord> = dynamic;

void typedWeapons;
void dynamicRecords;

async function checkPublicTypes(): Promise<void> {
  const response = await weapons.list();
  const weapon: Weapon | undefined = response.data[0];
  const caliber: string | undefined = weapon?.caliber;
  const unknownField: unknown = weapon?.future_wiki_field;
  void caliber;
  void unknownField;
}

void checkPublicTypes;
