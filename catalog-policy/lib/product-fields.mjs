import { presentationsForChoice,matchesCatalogBrand } from './product-search.mjs';

export const emptyProductFields = () => ({choice:null,brand:'',presentation:'',variant:'',packaging:''});
const unique = values => [...new Set(values.filter(Boolean))];
const selected = (options,value) => options.includes(value) ? value : options.length===1 ? options[0] : '';

// A familiar product type can still have brands/sizes beyond the shortcuts.
// Exact SKUs, manual entries, weighted cuts and verified combinations retain
// their own identity constraints.
export function choiceWithCatalogFields(choice,facets,includeUnpriced=false){
 if(!choice||choice.ean||choice.manualOnly||choice.bulkUnit||choice.availableCombinations||!facets)return choice;
 return {...choice,brands:unique([...(includeUnpriced?choice.brands:[]),...facets.brands]),presentations:unique([...(includeUnpriced?choice.presentations:[]),...facets.sizes])};
}

// Empty real facets are meaningful: a shortcut must not advertise an invented
// brand/size combination. Manual inventory entry remains explicitly available.
export function constrainProductFields(value,facets,includeUnpriced=false){
 const choice=choiceWithCatalogFields(value.choice,facets,includeUnpriced);
 if(choice===value.choice||includeUnpriced)return value;
 return {...value,choice,brand:choice.brands.find(brand=>matchesCatalogBrand(brand,value.brand))??'',presentation:choice.presentations.includes(value.presentation)?value.presentation:''};
}

export function productFieldOptions(candidates, choice, brand='') {
  const products=choice?[choice]:candidates;
  return {
    brands:unique(products.flatMap(product=>product.brands)),
    presentations:unique(products.filter(product=>!brand||product.brands.includes(brand)||product.brandOptional).flatMap(product=>presentationsForChoice(product,brand))),
  };
}

// Resolve only an unambiguous choice. Keep type selection explicit otherwise.
export function reconcileProductFields(candidates,current,patch={}) {
  let choice=Object.hasOwn(patch,'choice')?patch.choice:candidates.find(product=>product.name===current.choice?.name)??(candidates.length===1?candidates[0]:null);
  let brand=Object.hasOwn(patch,'brand')?patch.brand:current.brand;
  let presentation=Object.hasOwn(patch,'presentation')?patch.presentation:current.presentation;
  if(!choice){
    const matching=candidates.filter(product=>(!brand||product.brands.includes(brand)||product.brandOptional)&&(!presentation||product.presentations.includes(presentation)));
    if(matching.length===1)choice=matching[0];
  }
  const options=productFieldOptions(candidates,choice,brand);
  brand=choice?.brandOptional?'':selected(options.brands,brand);
  presentation=selected(productFieldOptions(candidates,choice,brand).presentations,presentation);
  return {choice,brand,presentation,variant:selected(choice?.variants??[],patch.variant??current.variant),packaging:selected(choice?.packagings??[],patch.packaging??current.packaging)};
}

export function fieldsForProductInput(candidates,current) {
  // An unfinished word must not erase valid choices while the user is typing.
  if (!candidates.length) return {...current,choice:null};
  const sameFamily=!current.choice||candidates.some(product=>product.name===current.choice.name);
  return reconcileProductFields(candidates,sameFamily?current:emptyProductFields());
}
