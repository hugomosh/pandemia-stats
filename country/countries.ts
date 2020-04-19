import countries from "./countryFlags.json";

export function renderCountriesSelection({ initialValue = [] }) {
  console.log("Render countries", countries.length);

  let selectedCountries = [];
  const getValue = (input) => {
    if (input.length)
      return Array.prototype.filter
        .call(input, (i) => i.checked)
        .map((i) => i.value);
    return input.checked ? input.value : false;
  };
  const form = `
  <style>
    .country{ 
      position:relative;
      display: inline-flex;
      border:1px solid #ccc;
      height: 24px;
      max-height: 24px;
      border-radius:12px;
      padding:0px 3px;
      font-size:14px;
      font-family: monospace;
      margin: 2px;
    }
    input[type="checkbox"]:checked+label.country{
      background:pink;
    }
    input.country-input{
      position:absolute;
      opacity:0;
      z-index:-1;
    }
    .country span{
      padding-left: 8px;
      padding-right: 8px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  </style>
  <form
    class=countrySelection
    style="font: 20px var(--sans-serif); 
        font-variant-numeric: tabular-nums; 
        display: flex; 
        max-width: 100%;
        flex-flow: wrap;
        align-items: center;"
        
  >
    ${countries
      .map((c) => {
        return `
        <input 
        type=checkbox 
        class="country-input"
        name=input ${initialValue.indexOf(c.code) > -1 ? "checked" : ""}
        id="${c.code}"
         value="${c.code}"></input>
        <label class="country" for="${c.code}" title="${c.name}"> 
          <span>${c.emoji}${c.code}</span>
        </label>
        `;
      })
      .join("")}
  </form>`;
  return form;
}

export function appendCountrySelectionToNode(node: Element, config) {
  let countriesSelection = document.createElement("div");
  countriesSelection.innerHTML = renderCountriesSelection(config);
  countriesSelection.style.minWidth = "100%";
  countriesSelection.style.width = "0px";
  return node.appendChild(countriesSelection);
}

export function getChecked(node: HTMLDivElement) {
  return Array.from(node.querySelectorAll(":checked")).map(
    (x: HTMLInputElement) => x.value
  );
}
