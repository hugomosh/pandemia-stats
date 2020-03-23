export function matchRegionsHist(
  regions: Object,
  nCases: number,
  attribute: string
) {
  let res = {};
  Object.keys(regions).forEach(key => {
    const regionHist = regions[key];
    let regionMatchedHist = matchRegionHist(regionHist, nCases, attribute);
    res[key] = regionMatchedHist;
  });
  return res;
}

export function matchRegionHist(hist: any[], nCases, attribute: string): any[] {
  return hist
    .filter(h => h[attribute] >= nCases)
    .map((h, i) => {
      h.index = i;
      return h;
    });
}
