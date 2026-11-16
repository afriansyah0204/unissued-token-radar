type Protocol = {slug:string; name:string; category:string|null; chains:string[]; tvl_usd:number; change_7d:number|null; mcap_usd:number|null; listed_at:string|null; gecko_id:string|null; symbol:string|null};
type Snapshot = {as_of:string; source:string; floor_usd:number; protocols:Protocol[]; watchlist:string[]};
const clamp=(v:number,a:number,b:number)=>Math.min(b,Math.max(a,v));
const median=(values:number[])=>{const a=[...values].sort((a,b)=>a-b);return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2;};
const money=(n:number)=>'$'+Math.round(n).toLocaleString('en-US');

export function buildRadar(snapshot:Snapshot) {
 const watch=new Set(snapshot.watchlist);
 const live=snapshot.protocols.filter(p=>p.gecko_id!==null||p.symbol!==null);
 const peers=live.filter(p=>p.mcap_usd!==null&&p.mcap_usd>0&&p.tvl_usd>0&&p.mcap_usd/p.tvl_usd>=0.02&&p.mcap_usd/p.tvl_usd<=20);
 const globalRatio=peers.length?median(peers.map(p=>p.mcap_usd!/p.tvl_usd)):1;
 const excluded=(p:Protocol)=>/\s(v\d+(\.\d+)?|\d+\.\d+)$/i.test(p.name)||/\b(wrapped|staked|staking)\b/i.test(p.name)||/^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/i.test(p.name)||['Bridge','Canonical Bridge','Liquid Staking','Liquid Restaking','Restaked BTC','CEX'].includes(p.category??'');
 const candidates=snapshot.protocols.filter(p=>watch.has(p.slug)||(!p.gecko_id&&!p.symbol&&!excluded(p)));
 const selected=candidates.filter(p=>watch.has(p.slug)||p.tvl_usd>=5_000_000).sort((a,b)=>b.tvl_usd-a.tvl_usd).slice(0,4000);
 const asOf=Date.parse(snapshot.as_of+'T00:00:00Z');
 const rows=selected.map(p=>{
  const categoryPeers=peers.filter(q=>q.category===p.category);
  const comparable=categoryPeers.length>=3?categoryPeers:peers;
  const ratio=comparable.length?median(comparable.map(q=>q.mcap_usd!/q.tvl_usd)):globalRatio;
  const prior=clamp(ratio,0.15,4);
  const days=p.listed_at?Math.max(0,Math.floor((asOf-Date.parse(p.listed_at+'T00:00:00Z'))/86400000)):null;
  const growth=p.change_7d===null?0:clamp(p.change_7d,-50,100);
  const growthFactor=clamp(1+growth/200,0.75,1.5);
  const maturityFactor=days===null?0.8:0.7+0.3*clamp(days/730,0,1);
  const base=Math.max(1,Math.round(p.tvl_usd*prior*growthFactor*maturityFactor));
  const sparse=categoryPeers.length<3;
  const uncertainty=(sparse?0.65:0.4)+(p.change_7d===null?0.1:0)+(days===null?0.1:0);
  const chain=p.chains.find(c=>['Base','Arbitrum','Optimism','Solana','Polygon','Ethereum'].includes(c))??p.chains[0]??'the supported chain';
  const gas=chain==='Ethereum'?'$3–20':chain==='Solana'?'$0.05–1':'$0.20–3';
  const category=p.category??'Unclassified';
  const strategy=/Lending|CDP/i.test(category)?'Supply a small amount of a supported asset; avoid borrowing or leverage. Keep enough native gas to withdraw.':/Dex|Trading|Derivatives/i.test(category)?'Make one small spot swap with a liquid pair; set a strict slippage limit. Avoid perps, leverage and repeated volume farming.':/Yield|Farm|Vault/i.test(category)?'Read the vault assets and withdrawal terms, then use a small unlevered deposit only if the underlying exposure is acceptable.':/Payment|RWA|Assets/i.test(category)?'Check residency restrictions, redemption rules and any KYC requirement first. If ineligible, stop rather than funding an account.':'Inspect the protocol’s core product and withdrawal path. Try its smallest reversible action only after confirming eligibility and asset risks.';
  const farm_steps=[
   `Verify ${p.name}'s current official domain and token status via its own docs. Snapshot absence is not proof of no token; do not use a search ad. Budget: $0, 10–15 minutes.`,
   `On ${chain}, review approvals, supported assets and the exit path. Suggested trial capital: $20–100, fully at risk; estimated round-trip gas ${gas}, variable, not a live quote. Allow 10 minutes.`,
   `${p.name} on ${chain}: ${strategy} Allow 5–15 minutes; record fees and transaction hashes. No reward or allocation is assumed.`,
   `Review ${p.name} once a week for 4 weeks (5 minutes each). Check official campaign rules before doing more; stop if fees or exposure exceed your budget.`,
   `After the trial, test withdrawal and revoke unused allowances on ${chain}. Budget one extra gas fee and 5–10 minutes; leave funds only by a separate decision.`
  ];
  return {...p,rank:0,implied_value_usd:base,scenario_low_usd:Math.max(1,Math.round(base*(1-uncertainty))),scenario_high_usd:Math.round(base*(1+uncertainty*1.8)),watchlist:watch.has(p.slug),status:'No token recorded',age_days:days,peer_count:comparable.length,category_peer_count:categoryPeers.length,peer_ratio:prior,growth_factor:growthFactor,maturity_factor:maturityFactor,confidence:sparse||days===null||p.change_7d===null?'Limited':'Moderate',chain,gas_estimate:gas,capital_estimate:'$20–100',time_estimate:'35–60 min + weekly review',farm_steps,valuation_note:`${money(p.tvl_usd)} TVL × ${prior.toFixed(2)} peer MCap/TVL × ${growthFactor.toFixed(2)} growth × ${maturityFactor.toFixed(2)} maturity. Hypothetical circulating market cap, not FDV or an airdrop estimate.`,risk_note:sparse?'Fewer than 3 tokenized category peers; global comparable median used.':'Category median from at least 3 tokenized peers; token economics still unknown.'};
 }).sort((a,b)=>b.implied_value_usd-a.implied_value_usd||a.slug.localeCompare(b.slug,'en'));
 rows.forEach((r,i)=>r.rank=i+1);
 return {as_of:snapshot.as_of,source:snapshot.source,watchlist_count:snapshot.watchlist.length,protocol_count:snapshot.protocols.length,live_count:live.length,excluded_count:candidates.length-selected.length,peer_count:peers.length,rows,live:live.map(p=>({...p,status:'Token recorded'})),method:{name:'Comparable market cap / TVL',description:'Median circulating MCap/TVL of tokenized category peers (3+), otherwise global. Outlier ratios outside 0.02–20 are excluded; the median is capped at 0.15–4. Growth is clipped to −50…100% and applied at half weight. Maturity rises from 0.70 to 1.00 over 730 days; missing age gets 0.80. Scenario bands express model uncertainty, not probabilities.',disclosure:'Frozen snapshot. No live prices, confirmed airdrops, token issuance predictions or personalized investment advice. TVL is not revenue, tracking age is not protocol age, and market cap is not FDV.'}};
}
