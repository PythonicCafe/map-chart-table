export const exampleFilters = [
  {
    title: "Caxumba por UF",
    description: "Mapa da cobertura de caxumba entre 2000 e 2020 por UF",
    granularity: "Estados",
    tab: "map",
    tabBy: "sicks",
    filters: {
      sickImmunizer: "Caxumba",
      type: "Cobertura",
      local: ["AC", "AL", "AM"],
      dose: "1ª dose",
      periodStart: 2000,
      periodEnd: 2020,
      granularity: "Estados",
    }
  },
  {
    title: "Hepatite B por UF",
    description: "Gráfico da cobertura de hepatite b entre 2000 e 2020 por UF",
    granularity: "Estados",
    tab: "chart",
    tabBy: "sicks",
    filters: {
      sickImmunizer: ["Hepatite B"],
      type: "Cobertura",
      local: ["AC", "AL", "SP", "PB"],
      dose: "1ª dose",
      periodStart: 2000,
      periodEnd: 2020,
      granularity: "Estados",
    }
  },
  {
    title: "Difteria por UF",
    description: "Tabela da cobertura de difteria entre 2000 e 2010 por UF",
    granularity: "Estados",
    tab: "table",
    tabBy: "sicks",
    filters: {
      sickImmunizer: ["Difteria"],
      type: "Cobertura",
      local: ["AC", "AL", "MG"],
      dose: "1ª dose",
      periodStart: 2000,
      periodEnd: 2010,
      granularity: "Estados",
    }
  },
  {
    title: "Varicela por Macrorregião de saúde",
    description: "Tabela da cobertura de caricela entre 2000 e 2005 por Macrorregião de saúde",
    granularity: "Estados",
    tab: "table",
    tabBy: "sicks",
    filters: {
      sickImmunizer: ["Varicela"],
      type: "Cobertura",
      local: ["PB", "AL", "AM"],
      dose: "1ª dose",
      periodStart: 2000,
      periodEnd: 2005,
      granularity: "Macrorregião de saúde",
    }
  },
  {
    title: "Febre Amarela (FA) por Macrorregiao de saúde",
    description: "Mapa da cobertura de tetano imunizante entre 2000 e 2020 por UF",
    granularity: "Estados",
    tab: "map",
    tabBy: "immunizers",
    filters: {
      sickImmunizer: "Febre Amarela (FA)",
      type: "Cobertura",
      local: ["AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO"],
      dose: "1ª dose",
      periodStart: 2000,
      periodEnd: 2020,
      granularity: "Estados",
    }
  },
];
