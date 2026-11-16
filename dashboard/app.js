'use strict';
const radar=window.RADAR;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const usd=n=>n==null?'—':n>=1e9?'$'+(n/1e9).toFixed(2)+'B':n>=1e6?'$'+(n/1e6).toFixed(1)+'M':'$'+Math.round(n/1e3)+'K';
const pct=n=>n==null?'No data':(n>0?'+':'')+n.toFixed(1)+'%';
let view='radar',watchOnly=false,sortKey='implied_value_usd',ascending=false,limit=30;
$('#as-of').textContent=radar.as_of;$('#date-tag').textContent=radar.as_of;$('#nav-count').textContent=radar.rows.length;
$('#source').textContent=radar.source;
$('#coverage').textContent=radar.rows.filter(r=>r.watchlist).length===radar.watchlist_count?'100%':'Incomplete';
$('#coverage-count').textContent=`${radar.watchlist_count} / ${radar.watchlist_count} required protocols`;
const metric=(label,value,note)=>`<div class="metric"><label>${esc(label)}</label><strong>${esc(value)}</strong><small>${esc(note)}</small></div>`;
$('#metrics').innerHTML=metric('Pre-token universe',radar.rows.length,'No token recorded in this snapshot')+metric('Watchlist covered',radar.watchlist_count,'All required protocols included')+metric('Comparable peers',radar.peer_count,'Tokenized, usable MCap / TVL')+metric('Tokenized universe',radar.live_count,'Kept separate from launch candidates');
const fill=(selector,values)=>values.forEach(value=>{const o=document.createElement('option');o.value=value;o.textContent=value;$(selector).append(o)});
fill('#chain',[...new Set([...radar.rows,...radar.live].flatMap(r=>r.chains))].sort());
fill('#category',[...new Set([...radar.rows,...radar.live].map(r=>r.category).filter(Boolean))].sort());
$('#method-panel').innerHTML=`<div class="section-head"><div><div class="eyebrow">READ THE ASSUMPTIONS</div><h2>Every number has a trail.</h2></div></div><div class="detail-box method-copy"><h3>01 / Comparable valuation</h3><p>${esc(radar.method.description)}</p><h3>02 / What the number means</h3><p>${esc(radar.method.disclosure)}</p><h3>03 / Evidence boundaries</h3><p>The watchlist is provided by the snapshot and preserved in full. Additional candidates have neither symbol nor CoinGecko id, and exclude visible version markers, exchange products, wrapping, staking and bridge categories. Parent relationships are absent from the input: additional candidates can still include subsidiaries. Verify each protocol before acting.</p><h3>04 / Scenario bands</h3><p>Base values use fixed deterministic factors. Bands widen for missing growth, missing tracking dates and fewer than three category peers. They are sensitivity ranges, not confidence intervals. No probability of token launch, reward or eligibility is inferred.</p><h3>05 / Farm planning</h3><p>Plans are category-based trial procedures, not verified campaigns. Capital and gas figures are illustrative planning budgets, not live quotes. Use only a confirmed official domain, check current product availability, jurisdiction and exit rules, and treat all deployed capital as at risk.</p></div>`;
function visibleRows(){
 const q=$('#search').value.trim().toLowerCase(),chain=$('#chain').value,cat=$('#category').value;
 return (view==='live'?radar.live:radar.rows).filter(r=>(!watchOnly||view==='live'||r.watchlist)&&(!chain||r.chains.includes(chain))&&(!cat||r.category===cat)&&(!q||[r.name,r.slug,r.category,...r.chains].join(' ').toLowerCase().includes(q))).sort((a,b)=>{const key=view==='live'&&sortKey==='implied_value_usd'?'mcap_usd':sortKey;return ((a[key]??-Infinity)-(b[key]??-Infinity))*(ascending?1:-1)||a.slug.localeCompare(b.slug)});
}
function render(){
 const filtered=visibleRows();
 $('#results-count').textContent=`${filtered.length} protocols · ${view==='live'?'token recorded':'ranked by model value by default'}${watchOnly&&view!=='live'?' · house watchlist':''}`;
 $('#rows').innerHTML=filtered.slice(0,limit).map(r=>`<tr data-slug="${esc(r.slug)}" tabindex="0" aria-label="Research ${esc(r.name)}"><td>${r.rank??'—'}</td><td><div class="protocol-cell"><div class="avatar">${esc(r.name.slice(0,2).toUpperCase())}</div><div><div class="protocol-name">${esc(r.name)}</div><small>${esc(r.category??'Unclassified')} · ${esc(r.chains.slice(0,2).join(', '))}${r.chains.length>2?' +'+(r.chains.length-2):''}</small></div></div></td><td class="num">${usd(r.tvl_usd)}</td><td class="num ${r.change_7d>=0?'positive':'negative'}">${pct(r.change_7d)}</td><td class="num value">${usd(view==='live'?r.mcap_usd:r.implied_value_usd)}<small>${view==='live'?'Recorded market cap':'Hypothetical MCap'}</small></td><td><span class="badge ${view==='live'?'live':r.confidence==='Limited'?'limited':''}">${view==='live'?'Token recorded':r.confidence+' data'}</span><small>${view==='live'?esc(r.symbol??r.gecko_id):r.watchlist?'House watchlist':'Extended universe'}</small></td><td>${view==='live'?'—':r.capital_estimate}<small>${view==='live'?'Not a launch candidate':r.gas_estimate+' est. gas'}</small></td><td class="chevron">↗</td></tr>`).join('');
 $('#empty').hidden=filtered.length>0;$('#more').hidden=filtered.length<=limit;
 $('#rows').querySelectorAll('tr').forEach(tr=>{tr.onclick=()=>openDetail(tr.dataset.slug);tr.onkeydown=e=>{if(e.key==='Enter')openDetail(tr.dataset.slug)}});
}
function openDetail(slug){
 const r=(view==='live'?radar.live:radar.rows).find(r=>r.slug===slug);if(!r)return;
 const header=`<div class="detail-heading"><span class="avatar">${esc(r.name.slice(0,2).toUpperCase())}</span><div><h2 id="detail-title">${esc(r.name)}</h2><p>${esc(r.category??'Unclassified')} · ${esc(r.chains.join(' / '))}</p></div></div>`;
 if(view==='live'){$('#detail-content').innerHTML=header+`<div class="notice"><p>Token recorded in the frozen snapshot: ${esc(r.symbol??r.gecko_id)}. This protocol is separated from the pre-token radar.</p></div><div class="detail-metrics">${metric('TVL',usd(r.tvl_usd),'Snapshot value')}${metric('Market cap',usd(r.mcap_usd),'Recorded circulating market cap')}${metric('TVL change',pct(r.change_7d),'Seven days')}</div>`;}
 else{
 $('#detail-content').innerHTML=header+`<div class="detail-metrics">${metric('Base model value',usd(r.implied_value_usd),'Hypothetical circulating MCap')}${metric('Snapshot TVL',usd(r.tvl_usd),pct(r.change_7d)+' over 7 days')}${metric('Tracking history',r.age_days===null?'Unknown':r.age_days+' days','Tracking age ≠ protocol age')}</div><div class="detail-box"><h3>VALUATION / REPRODUCIBLE ASSUMPTIONS</h3><p class="formula">${esc(r.valuation_note)}</p><div class="scenario"><span>LOW ${usd(r.scenario_low_usd)}</span><div class="bar"></div><span>HIGH ${usd(r.scenario_high_usd)}</span></div><p>${esc(r.risk_note)} ${r.peer_count} usable peers. Scenario range is a sensitivity band, not a probability.</p></div><div class="detail-box"><h3>FARM PLAN / SMALL, REVERSIBLE TRIAL</h3><p>${esc(r.capital_estimate)} capital at risk · ${esc(r.gas_estimate)} illustrative gas · ${esc(r.time_estimate)}</p><ol id="farm-plan">${r.farm_steps.map(s=>'<li>'+esc(s)+'</li>').join('')}</ol></div><div class="detail-foot">${esc(r.status)} · ${r.watchlist?'House watchlist':'Extended candidate, verify parent relationship'} · Source date ${esc(radar.as_of)}. No airdrop, allocation or launch date confirmed by this data.</div>`;
 }
 $('#detail').showModal();$('#detail').scrollTop=0;
}
$('#close-detail').onclick=()=>$('#detail').close();$('#detail').onclick=e=>{if(e.target===$('#detail')){const b=$('#detail').getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)$('#detail').close()}};
for(const selector of ['#search','#chain','#category'])$(selector).addEventListener(selector==='#search'?'input':'change',()=>{limit=30;render()});
$('#reset').onclick=()=>{$('#search').value='';$('#chain').value='';$('#category').value='';watchOnly=false;$('#watch-filter').classList.remove('active');$('#all-filter').classList.add('active');limit=30;render()};
for(const [id,only] of [['#all-filter',false],['#watch-filter',true]])$(id).onclick=()=>{watchOnly=only;$('#watch-filter').classList.toggle('active',only);$('#all-filter').classList.toggle('active',!only);limit=30;render()};
document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{ascending=sortKey===b.dataset.sort?!ascending:false;sortKey=b.dataset.sort;render()});
$('#more').onclick=()=>{limit+=30;render()};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n===b));$('#view-label').textContent=view==='radar'?'LAUNCH RADAR':view==='live'?'TOKENIZED UNIVERSE':'METHODOLOGY';$('#method-panel').hidden=view!=='method';$('#board-panel').hidden=view==='method';$('#board-title').textContent=view==='live'?'Tokens already recorded':'Pre-token protocols';$('#board-eyebrow').textContent=view==='live'?'SEPARATE REFERENCE UNIVERSE':'OPPORTUNITY UNIVERSE';$('#reset').click()});
render();
