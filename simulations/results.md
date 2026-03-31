====================================================================================================
GoodDollar Token Economics Simulation
====================================================================================================

─── Parameters ─────────────────────────────────────────────────
  G$ Price: $0.01
  Initial Supply: 1B G$
  Daily UBI Mint: 1.0 G$/person/day
  UBI Fee Pool %: 33%
  DEX Volume/User: $10/day
  DEX Fee: 0.3%
  Lending/User: $5/day @ 5% APY
  Validator Stake: 10% @ 5% reward
  Gas Burn Rate: 50%

─── Results by User Scale ──────────────────────────────────────
Metric                                       │ 1M            │ 10M           │ 100M             │ 1B
────────────────────────────────────────────────────────────────────────────────────────────────────
Annual Inflation (gross)                  │ 36.5%         │ 365.0%        │ 3650.0%       │ 36500.0%
Annual Inflation (net of burn)            │ 31.0%         │ 310.2%        │ 3102.5%       │ 31025.0%
Daily Fee Pool (total)                   │ $33.7K        │ $336.8K         │ $3.37M        │ $33.68M
  ├─ DEX Fees                            │ $30.0K        │ $300.0K         │ $3.00M        │ $30.00M
  ├─ Lending Fees                       │ $684.93          │ $6.8K         │ $68.5K        │ $684.9K
  └─ Gas Fees                             │ $3.0K         │ $30.0K        │ $300.0K         │ $3.00M
Daily UBI Value (total)                  │ $21.1K        │ $211.2K         │ $2.11M        │ $21.12M
  ├─ From Fees                           │ $11.1K        │ $111.2K         │ $1.11M        │ $11.12M
  └─ From Minting                        │ $10.0K        │ $100.0K         │ $1.00M        │ $10.00M
UBI per Person/Day                        │ $0.02          │ $0.02          │ $0.02          │ $0.02
Daily Burns                               │ $1.5K         │ $15.0K        │ $150.0K         │ $1.50M
Sustainability Ratio                      │ 1.11x          │ 1.11x          │ 1.11x          │ 1.11x
Validator APR                             │ 59.8%         │ 552.5%        │ 5480.0%       │ 54755.0%

─── Sustainability Analysis ────────────────────────────────────

  Per-user daily fee contribution to UBI: $0.011116
  Per-user daily UBI cost (minting):      $0.010000

  ✅ UBI is ALREADY self-sustaining from fees alone!

====================================================================================================
Sensitivity Analysis (100M users)
====================================================================================================

  Base case sustainability ratio: 1.11x

  DEX Vol/User:
               $5 → ratio 0.62x | UBI $0.016166/person/day | inflation 3102.5%
    ✅        $10 → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
    ✅        $25 → ratio 2.60x | UBI $0.035966/person/day | inflation 3102.5%
    ✅        $50 → ratio 5.07x | UBI $0.060716/person/day | inflation 3102.5%
    ✅       $100 → ratio 10.02x | UBI $0.110216/person/day | inflation 3102.5%

  DEX Fee %:
             0.1% → ratio 0.45x | UBI $0.014516/person/day | inflation 3102.5%
    ✅       0.3% → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
    ✅       0.5% → ratio 1.77x | UBI $0.027716/person/day | inflation 3102.5%
    ✅       1.0% → ratio 3.42x | UBI $0.044216/person/day | inflation 3102.5%

  UBI Fee Share:
            20.0% → ratio 0.67x | UBI $0.016737/person/day | inflation 3102.5%
    ✅      33.0% → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
    ✅      50.0% → ratio 1.68x | UBI $0.026842/person/day | inflation 3102.5%
    ✅      75.0% → ratio 2.53x | UBI $0.035264/person/day | inflation 3102.5%
    ✅        1.0 → ratio 3.37x | UBI $0.043685/person/day | inflation 3102.5%

  UBI Mint/Day:
    ✅       $0.1 → ratio 11.12x | UBI $0.012116/person/day | inflation -182.5%
    ✅       $0.5 → ratio 2.22x | UBI $0.016116/person/day | inflation 1277.5%
    ✅       $1.0 → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
             $2.0 → ratio 0.56x | UBI $0.031116/person/day | inflation 6752.5%
             $5.0 → ratio 0.22x | UBI $0.061116/person/day | inflation 17702.5%

  G$ Price:
    ✅     $0.001 → ratio 11.12x | UBI $0.012116/person/day | inflation -1825.0%
    ✅     $0.005 → ratio 2.22x | UBI $0.016116/person/day | inflation 2555.0%
    ✅      $0.01 → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
            $0.05 → ratio 0.22x | UBI $0.061116/person/day | inflation 3540.5%
             $0.1 → ratio 0.11x | UBI $0.111116/person/day | inflation 3595.2%

  Lending/User:
    ✅         $1 → ratio 1.09x | UBI $0.020935/person/day | inflation 3102.5%
    ✅         $5 → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
    ✅        $10 → ratio 1.13x | UBI $0.021342/person/day | inflation 3102.5%
    ✅        $25 → ratio 1.20x | UBI $0.022020/person/day | inflation 3102.5%
    ✅        $50 → ratio 1.32x | UBI $0.023150/person/day | inflation 3102.5%

  Txs/User/Day:
    ✅          1 → ratio 1.05x | UBI $0.020456/person/day | inflation 3467.5%
    ✅          3 → ratio 1.11x | UBI $0.021116/person/day | inflation 3102.5%
    ✅          5 → ratio 1.18x | UBI $0.021776/person/day | inflation 2737.5%
    ✅         10 → ratio 1.34x | UBI $0.023426/person/day | inflation 1825.0%
    ✅         20 → ratio 1.67x | UBI $0.026726/person/day | inflation 0.0%


====================================================================================================
KEY FINDINGS
====================================================================================================

  1. With current parameters, UBI sustainability is independent of user count
     (linear scaling: more users = more fees AND more UBI cost)

  2. The critical lever is per-user economic activity:
     - Current: $10 DEX vol + $5 lending/user/day
     - Break-even: $10 DEX volume/user/day (with current fee structure)

  3. Most impactful levers (in order):
     a) DEX volume per user (drives bulk of fees)
     b) UBI fee share % (how much fees fund UBI)
     c) G$ price (lower price = cheaper UBI to fund)
     d) Transaction frequency (gas fee revenue)

  4. Validator APR is attractive at 5%+ with gas fee sharing

