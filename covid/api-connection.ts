export async function getCountryStats(countryOrRegion) {
  const primaryKey = "b8e75c953eaf408a80eb20222bd330b3";
  const apiEnpoint = `https://api.smartable.ai/coronavirus/stats/${countryOrRegion}`;
  return await fetch(apiEnpoint, {
    headers: { "Subscription-Key": primaryKey }
  }).then(async response => {
    const json = await response.json();
    console.log({ json });
    return json;
  });
}

