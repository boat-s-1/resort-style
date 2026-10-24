function normalize(value){return String(value??'').normalize('NFKC').toLowerCase().trim();}
function filterCustomers(customers,query){
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 return customers.filter(customer=>{
  const fields=[customer.name,customer.phone,customer.line_name].map(normalize);
  const phone=normalize(customer.phone).replace(/\D/g,'');
  return terms.every(term=>fields.some(field=>field.includes(term))||(/^[+\d()ー−‐-]+$/.test(term)&&/\d/.test(term)&&phone.includes(term.replace(/\D/g,''))));
 });
}
function customerOptions(customers,matches,selectedId){
 const selected=customers.find(c=>c.id===selectedId);
 return selected&&!matches.some(c=>c.id===selectedId)?[selected,...matches]:matches;
}
module.exports={filterCustomers,customerOptions};
