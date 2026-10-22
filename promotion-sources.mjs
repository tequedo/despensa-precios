// Official public sources. Reachability alone never authorizes a discount.
export const walletPromotionSources = [
  {
    id: "mercado_pago_public",
    name: "Mercado Pago — promociones públicas",
    url: "https://promociones.mercadopago.com.ar/tipocat/supermercado/",
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
    render: true,
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
];

export const productPromotionSources = [
  { id: "vea", chain: /vea/i, name: "Vea", url: "https://www.vea.com.ar/ofertas-y-catalogo" },
  { id: "changomas", chain: /chango|walmart|mas online/i, name: "ChangoMás", url: "https://www.masonline.com.ar/3195?map=productClusterIds" },
  { id: "la_anonima", chain: /la anonima/i, name: "La Anónima", url: "https://www.laanonima.com.ar/empresa/catalogos", render: true },
  { id: "carrefour", chain: /carrefour/i, name: "Carrefour", url: "https://www.carrefour.com.ar/promociones", render: true }
];
