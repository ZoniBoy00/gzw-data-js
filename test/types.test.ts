import { GzwDataClient, type ArmorItem, type DatasetResource, type GzwDatasetMetadata, type GzwMetadata, type GzwRecord, type HelmetMod, type OpenApiSpec, type Weapon, type WeaponPart } from "../src/index.js";

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
  const metadata: GzwMetadata = await client.metadata();
  const datasetMetadata: GzwDatasetMetadata = await client.metadata("weapons");
  const readyCount: number = (await client.ready()).datasetCount;
  const changes: string[] = (await client.changes()).changes.added;
  const schema: GzwDatasetMetadata = await client.schema("weapons");
  const openApi: OpenApiSpec = await client.spec();
  const schemaProperties: Record<string, unknown> | undefined = openApi.components?.schemas?.weapons?.properties;
  const searchFields: string[] = (await client.search("AK", { datasets: ["weapons"], fields: ["name"], fuzzy: true, limit: 5 })).fields;
  const armor: ArmorItem | undefined = (await client.armor()).data[0];
  const part: WeaponPart | undefined = (await client.weaponParts()).data[0];
  const mod: HelmetMod | undefined = (await client.helmetMods()).data[0];
  void [caliber, unknownField, metadata.datasets, datasetMetadata.capabilities, readyCount, changes, schema.fields, schemaProperties, searchFields, armor?.nij_class, part?.part_category, mod?.mod_type];
}

void checkPublicTypes;
