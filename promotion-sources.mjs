// Official public sources. Reachability alone never authorizes a discount.
export const walletPromotionSources = [
  {
    id: "mercado_pago_public",
    name: "Mercado Pago — promociones públicas",
    url: "https://www.mercadopago.com.ar/c/promocionesqr",
    render: true,
    role: "discovery",
  },
  {
    id: "changomas",
    name: "ChangoMás / Más Online",
    chain: "ChangoMás",
    url: "https://www.masonline.com.ar/promociones-bancarias",
    structured: "vtex_master_data",
    role: "retailer_terms",
  },
  {
    id: "la_anonima",
    name: "La Anónima",
    chain: "La Anónima",
    url: "https://www.laanonima.com.ar/",
    render: true,
    role: "retailer_terms",
  },
  {
    id: "vea",
    name: "Vea",
    chain: "Vea",
    url: "https://www.vea.com.ar/descuentos-del-dia?type=por-banco",
    structured: "cencosud_public", accounts: ["veaargentina"],
    role: "retailer_terms",
  },
  {
    id: "dia",
    name: "DIA",
    chain: "DIA",
    url: "https://diaonline.supermercadosdia.com.ar/medios-de-pago-y-promociones",
    render: true,
    role: "retailer_terms",
  },
  {
    id: "carrefour",
    name: "Carrefour",
    chain: "Carrefour",
    url: "https://www.carrefour.com.ar/descuentos-bancarios",
    structured: "carrefour_vtex",
    role: "retailer_terms",
  },
  {id:'modo',name:'MODO — promociones públicas',url:'https://www.modo.com.ar/promos',render:true,role:'discovery'},
  {id:'banco_san_juan',name:'Banco San Juan — beneficios',url:'https://www.bancosanjuan.com/personas/beneficios',role:'discovery'},
  {id:'jumbo',name:'Jumbo',chain:'Jumbo',url:'https://www.jumbo.com.ar/descuentos-del-dia',structured:'cencosud_public',accounts:['jumboargentina','jumboargentinaio'],role:'retailer_terms'},
  {id:'disco',name:'Disco',chain:'Disco',url:'https://www.disco.com.ar/descuentos-del-dia',structured:'cencosud_public',accounts:['discoargentina'],role:'retailer_terms'},
  {id:'coto',name:'Coto — legales oficiales',chain:'Coto',url:'https://www.coto.com.ar/descuentos',structured:'coto_public',role:'retailer_terms'},
  {id:'libertad',name:'Hiper Libertad',chain:'Hiper Libertad',url:'https://www.hiperlibertad.com.ar/institucional/medios-de-pago',render:true,role:'retailer_terms'},
  {id:'atomo',name:'Átomo — ofertas online',chain:'Átomo',url:'https://atomoconviene.com/atomo-ecommerce/833-ofertas',role:'discovery'},
  {id:'banco_nacion',name:'Banco Nación',provider:'Banco Nación',url:'https://www.bna.com.ar/Personas/DescuentosYPromociones',role:'discovery'},
  {id:'naranja_x',name:'Naranja X',provider:'Naranja X',url:'https://www.naranjax.com/promociones/medios/Super',render:true,role:'discovery'},
  {id:'macro',name:'Banco Macro',provider:'Banco Macro',url:'https://www.macro.com.ar/beneficios/categoria?categoria=Supermercados',role:'discovery'},
  {id:'santander',name:'Santander',provider:'Santander',url:'https://www.santander.com.ar/personas/beneficios',render:true,role:'discovery'},
  {id:'bbva',name:'BBVA',provider:'BBVA',url:'https://www.bbva.com.ar/beneficios/',render:true,role:'discovery'},
  {id:'galicia',name:'Banco Galicia',provider:'Banco Galicia',url:'https://beneficios.galicia.ar/',render:true,role:'discovery'},
  {id:'supervielle',name:'Supervielle',provider:'Supervielle',url:'https://www.supervielle.com.ar/personas/beneficios/descuentos/supermercados',render:true,role:'discovery'},

];

export const productPromotionSources = [
  { id: "vea", chain: /vea/i, name: "Vea", url: "https://www.vea.com.ar/ofertas-y-catalogo" },
  { id: "changomas", chain: /chango|walmart|mas online/i, name: "ChangoMás", url: "https://www.masonline.com.ar/3195?map=productClusterIds" },
  { id: "la_anonima", chain: /la anonima/i, name: "La Anónima", url: "https://www.laanonima.com.ar/empresa/catalogos", render: true },
  { id: "carrefour", chain: /carrefour/i, name: "Carrefour", url: "https://www.carrefour.com.ar/promociones", render: true },
  {id:'jumbo',chain:/jumbo/i,name:'Jumbo',url:'https://www.jumbo.com.ar/ofertas-y-catalogo'},
  {id:'disco',chain:/disco/i,name:'Disco',url:'https://www.disco.com.ar/ofertas-y-catalogo'},
  {id:'dia',chain:/\bdia\b/i,name:'DIA',url:'https://diaonline.supermercadosdia.com.ar/'},
  {id:'coto',chain:/coto/i,name:'Coto',url:'https://www.coto.com.ar/hoy/'},
  {id:'libertad',chain:/libertad/i,name:'Hiper Libertad',url:'https://www.hiperlibertad.com.ar/oferta'},
  {id:'atomo',chain:/atomo|millan/i,name:'Átomo',url:'https://atomoconviene.com/atomo-ecommerce/833-ofertas'}

];
