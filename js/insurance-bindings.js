export function insuranceBindings(content){
 const fields=[],get=path=>path.split('.').reduce((o,k)=>o?.[k],content);
 function bind(selector,path,segment){document.querySelectorAll(selector).forEach(element=>{const image=element.tagName==='IMG',node=image?null:[...element.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.nodeValue.trim());if(!image&&!node)return;let value=get(path);if(segment!==undefined)value=value.split(/\n\n+/)[segment]||'';fields.push({key:'insurance:'+path+(segment===undefined?'':':'+segment),doc:'insurance',path,segment,type:image?'image':'text',value:value||'',label:'Negocios y seguros · '+(image?'Fotografía':String(value).slice(0,80)),element,node,alt:image?element.alt:undefined})})}
 for(const[selector,path,segment]of [['[data-insurance-title],.insurance-hero h1','title'],['[data-insurance-subtitle],.insurance-lead','subtitle'],['[data-insurance-main-cta],.insurance-hero>.button','cta'],['[data-roxana-name],[data-roxana-profile] h1,.insurance-leadership h2','roxana.name'],['[data-roxana-role],[data-roxana-profile] .profile-role,.insurance-leadership>p:not(.eyebrow)','roxana.role'],['[data-roxana-intro]','roxana.description',0],['[data-roxana-image],[data-roxana-profile] .person-portrait img','roxana.image']])bind(selector,path,segment);
 // Leadership contains role followed by the introductory paragraph.
 fields.splice(0,fields.length,...fields.filter(f=>!f.element.matches('.insurance-leadership>p:not(.eyebrow)')));
 bind('.insurance-leadership>p:nth-of-type(2)','roxana.role');bind('.insurance-leadership>p:nth-of-type(3)','roxana.description',0);
 document.querySelectorAll('[data-roxana-specialties] li,[data-roxana-profile] .profile-tags li').forEach((el,i)=>bindElement(el,'roxana.specialties.'+(i%content.roxana.specialties.length)));
 document.querySelectorAll('[data-roxana-profile] .profile-content>section:first-child>p:not(.eyebrow)').forEach((el,i)=>bindElement(el,'roxana.description',i));
 document.querySelectorAll('.insurance-highlights li').forEach((el,i)=>bindElement(el,'highlights.'+i));
 for(const[gIndex,g]of content.groups.entries()){
   const group=document.getElementById(g.id);if(!group)continue;bind('#'+CSS.escape(g.id)+' .section-heading h2',`groups.${gIndex}.title`);bind('#'+CSS.escape(g.id)+' .section-heading>p',`groups.${gIndex}.description`);bind('#'+CSS.escape(g.id)+' .insurance-note',`groups.${gIndex}.note`);
   const services=content.services.map((s,i)=>({...s,index:i})).filter(s=>s.active&&s.group===g.id).sort((a,b)=>a.order-b.order);
   group.querySelectorAll('.insurance-card').forEach((card,i)=>{const s=services[i];if(!s)return;bindElement(card.querySelector('h3'),`services.${s.index}.title`);bindElement(card.querySelector('.insurance-card-copy>p'),`services.${s.index}.description`);card.querySelectorAll('li').forEach((el,j)=>bindElement(el,`services.${s.index}.risks.${j}`));if(!s.informational)bindElement(card.querySelector('.button'),`services.${s.index}.cta`);const img=card.querySelector('img');if(img)bindElement(img,`services.${s.index}.image`)});
 }
 bind('.insurance-callout h3','guaranteesTitle');bind('.insurance-callout>p','guaranteesText');bind('.insurance-callout>.button','cta');bind('.insurance-conditions>p','notice');
 function bindElement(el,path,segment){if(!el)return;const unique='bko-binding-'+fields.length;el.setAttribute('data-bko-binding',unique);bind(`[data-bko-binding="${unique}"]`,path,segment);el.removeAttribute('data-bko-binding')}
 return fields;
}
export function setInsuranceField(content,field,value){const parts=field.path.split('.');let target=content;for(const k of parts.slice(0,-1))target=target[k];const key=parts.at(-1);if(field.segment===undefined)target[key]=value;else{const paragraphs=target[key].split(/\n\n+/);paragraphs[field.segment]=value;target[key]=paragraphs.join('\n\n')}}
