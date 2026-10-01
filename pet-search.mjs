const stop=new Set('a an the is are was were be been being can could should would will shall do does did have has had what which why when where how who whom and or but if so to of in on at for from with without by as it its this that these those i me my we our you your they their them please explain tell about give help understand know question answer lesson course design ux better'.split(' '));
stop.add('affect');stop.add('affects');
export function words(text){return [...new Set(String(text).toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu,' ').split(/\s+/).filter(w=>(w.length>2||w==='ai')&&!stop.has(w)).map(w=>w.length>5&&w.endsWith('s')?w.slice(0,-1):w))]}
export function plain(text){return String(text).replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/[*_`#>]/g,'').replace(/\s+/g,' ').trim()}
export function createIndex(library){
  const titles=Object.fromEntries(Object.values(library.index).flatMap(m=>m.lessons));
  const entries=[];
  for(const [id,lesson] of Object.entries(library.reading)){
    for(const section of lesson.sections){
      for(const paragraph of section.body.split(/\n\s*\n/)){
        const text=plain(paragraph);if(text.length<100||text.startsWith('|'))continue;
        entries.push({id,title:titles[id],section:section.label,text,terms:new Set(words(text)),heading:new Set(words(titles[id]+' '+section.label)),refs:plain(lesson.refs)});
      }
    }
  }
  return entries;
}
export function findPassages(index,question,currentId){
  const terms=words(question);if(!terms.length)return [];
  const matches=index.map(entry=>{
    const hits=terms.filter(term=>entry.terms.has(term)||entry.heading.has(term));
    const coverage=hits.length/terms.length;
    const headings=terms.filter(term=>entry.heading.has(term)).length;
    const bodyCoverage=terms.filter(term=>entry.terms.has(term)).length/terms.length;
    const definitionPattern=new RegExp('\\b'+terms.map(term=>term+'s?').join('\\s+')+'\\s+(is|are|means|refers)\\b','i');
    const definition=bodyCoverage===1&&definitionPattern.test(entry.text)?4:0;
    const titleWords=words(entry.title),exactTopic=titleWords.length===terms.length&&terms.every(term=>titleWords.includes(term));
    return {...entry,coverage,score:coverage*10+bodyCoverage*6+headings*.4+definition+(exactTopic?3:0)+(entry.id===currentId?0.25:0)-(entry.text.length<200?1:0)};
  }).filter(entry=>entry.coverage>=.8);
  matches.sort((a,b)=>b.score-a.score||a.text.length-b.text.length);
  const selected=[];
  for(const entry of matches){if(selected.some(x=>x.id===entry.id&&x.section===entry.section))continue;selected.push(entry);if(selected.length===2)break}
  return selected;
}
