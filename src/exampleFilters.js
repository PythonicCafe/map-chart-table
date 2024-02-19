export const exampleFilters = [
  {
    "title": "Mapa de cobertura para Poliomielite por estados",
    "description": "Mapa da cobertura das terceiras doses para Poliomielite entre 2000 e 2022 por UF",
    "granularity": "Estados",
    "tab": "map",
    "tabBy": "sicks",
    "filters": {
      "sickImmunizer": "Poliomielite",
      "type": "Cobertura",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "3ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Estados"
    }
  },
  {
    "title": "Gráfico de cobertura vacinal para Febre Amarela por estado",
    "description": "Gráfico de linhas da cobertura de primeiras doses de imunizantes para febre amarela entre 2000 e 2022 por estado, regiões sul e sudeste",
    "granularity": "Estados",
    "tab": "chart",
    "tabBy": "sicks",
    "filters": {
      "sickImmunizer": ["Febre Amarela"],
      "type": "Cobertura",
      "local": ["ES", "MG","PR", "RJ", "RS", "SC",  "SP"],
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Estados"
    }
  },
  {
    "title": "Tabela de cobertura da Tríplice Viral por município",
    "description": "Tabela da cobertura de primeira dose da Tríplice Viral entre 2000 e 2022 por estado, regiões sul e sudeste",
    "granularity": "Municípios",
    "tab": "table",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": ["Tríplice Viral (SCR)"],
      "type": "Cobertura",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Municípios"
    }
  },
  {
    "title": "Mapa de Abandono de Poliomielite inativada (VIP) por Macrorregião",
    "description": "Mapa de abandono da terceira dose de Poliomielite inativada (VIP) por macrorregião de saúde, entre 2016 e 2022",
    "granularity": "Macrorregião de saúde",
    "tab": "map",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": "Poliomielite inativada (VIP)",
      "type": "Abandono",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "3ª dose",
      "periodStart": 2016,
      "periodEnd": 2022,
      "granularity": "Macrorregião de saúde"
    }
  },
  {
    "title": "Mapa de meta atingida Meningocócica Conjugada - C (MncC) por Região de saúde",
    "description": "Mapa de meta atingida da primeira dose de Meningocócica Conjugada - C (MncC) por Região de saúde entre 2010 e 2022",
    "granularity": "Região de saúde",
    "tab": "map",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": "Meningocócica Conjugada - C (MncC)",
      "type": "Meta atingida",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "1ª dose",
      "periodStart": 2010,
      "periodEnd": 2022,
      "granularity": "Região de saúde"
    }
  },
  {
    "title": "Tabela de doses aplicadas das vacinas Poliomielite inativada (VIP) e Oral Poliomielite (VOP) por município",
    "description": "Tabela da doses aplicadas para primeiras doses Doses aplicadas das vacinas Poliomielite inativada (VIP) e Oral Poliomielite (VOP) por município entre 2000 e 2022",
    "granularity": "Municípios",
    "tab": "table",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": ["Poliomielite inativada (VIP)", "Oral Poliomielite (VOP)"],
      "type": "Cobertura",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Municípios"
    }
  },
  {
    "title": "Gráfico de cobertura vacinal para Tetravalente e Pentavalente em São Paulo",
    "description": "Gráfico de linhas da cobertura de primeiras doses de Tetravalente (DTP/Hib) e Pentavalente (DTP+HB+Hib) entre 2000 e 2022 no estado de São Paulo",
    "granularity": "Estados",
    "tab": "chart",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": ["Tetravalente (DTP/Hib) (TETRA)","Pentavalente (DTP+HB+Hib) (PENTA)"],
      "type": "Cobertura",
      "local": ["SP"],
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Estados"
    }
  },
  {
    "title": "Mapa de cobertura vacinal para Sarampo por estado",
    "description": "Mapa da cobertura de primeira dose das vacinas para sarampo entre 2000 e 2022 por estado",
    "granularity": "Estados",
    "tab": "map",
    "tabBy": "sicks",
    "filters": {
      "sickImmunizer": "Sarampo",
      "type": "Cobertura",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Estados"
    }
  },
  {
    "title": "Gráfico de cobertura vacinal para Poliomielite inativada (VIP) nas Macrorregiões de saúde da Bahia",
    "description": "Gráfico de linhas da cobertura de primeiras doses Poliomielite inativada (VIP) entre 2000 e 2022 por Macrorregião de saúde no estado da Bahia",
    "granularity": "Macrorregião de saúde",
    "tab": "chart",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": ["Poliomielite inativada (VIP)"],
      "type": "Cobertura",
      "local": "SP",
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Macrorregião de saúde"
    }
  },
  {
    "title": "Mapa do Abandono para terceira dose de Pentavalente (DTP+HB+Hib) Macrorregião de saúde",
    "description": "Mapa da cobertura de primeira dose das vacinas para sarampo entre 2012 e 2022 por Macrorregião de saúde",
    "granularity": "Macrorregião de saúde",
    "tab": "map",
    "tabBy": "immunizers",
    "filters": {
      "sickImmunizer": "Pentavalente (DTP+HB+Hib) (PENTA)",
      "type": "Cobertura",
      "local": ["AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA", "PB", "PE", "PI", "PR", "RJ", "RN" , "RO", "RR", "RS", "SC", "SE", "SP", "TO"],
      "dose": "1ª dose",
      "periodStart": 2000,
      "periodEnd": 2022,
      "granularity": "Macrorregião de saúde"
    }
  }
];
