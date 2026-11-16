# UNISSUED — token launch research

An offline snapshot-based research dashboard for make.fun token-radar-01. MIT licensed.

## Run

Node.js 22.18+; no install or external dependencies:

```sh
node main.ts --input /path/to/snapshot.json --output out
```

Open `out/dashboard/index.html` directly in a desktop browser. The data is read from `out/data.js`, without network access. Three screenshots under `screenshots/` are copied into output and the official vendored library creates `dossier.json`.

## Model

The frozen input is the only research dataset. The board includes the full house watchlist and additional records with no token identifiers, excluding visible wrapped, versioned, staking, bridge and exchange products. Additional candidate parent relationships are unknown because they are absent from the input.

Base implied circulating market cap = TVL × peer MCap/TVL median × clipped growth factor × tracking-maturity factor. Three or more valid tokenized category peers are preferred; otherwise the global median is used. Comparable ratios outside 0.02–20 are dropped, and the median is bounded at 0.15–4. A missing tracking date uses a stated fallback. Scenario ranges are sensitivity bands, not confidence intervals, FDV, token issuance probabilities or airdrop allocations.

Farm plans are category-based trial procedures with illustrative capital, gas and time budgets. They are not verified campaigns or recommendations to fund any protocol. Current official domains, token status, eligibility, withdrawal terms and actual gas require independent checking before acting.

## Validation

```sh
node --test tests/*.test.mjs
```

Unit and pipeline tests verify complete watchlist coverage, value order, unique ranks, plan limits and deterministic output. Browser tests and screenshot capture scripts live in the parent workspace's setup directory. The sealed server scorer and AI judge are not included in the public kit, so local verification does not establish a server score or reward eligibility.
