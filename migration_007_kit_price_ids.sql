alter table kits add column if not exists stripe_price_id_standard text;
alter table kits add column if not exists stripe_price_id_extended text;

update kits set stripe_price_id_standard = 'price_1U6NA7DamHQxgFP29Fyncui9'
  where id = 'a6d7eb9f-a744-494e-921f-1b46f092024e';

update kits set stripe_price_id_standard = 'price_1U6NA7DamHQxgFP2aNpHXCqZ'
  where id = '7fbaff16-351e-47bf-850f-8c5cc9e940ba';

update kits set
  stripe_price_id_standard = 'price_1U6NA6DamHQxgFP2r1JfGB5F',
  stripe_price_id_extended = 'price_1U6NA6DamHQxgFP2RW8N1l52'
  where id = '4a13a276-8819-48c8-bc19-7f82a22c61e9';

update kits set stripe_price_id_standard = 'price_1U6NA6DamHQxgFP2nuoTxqFR'
  where id = 'e6e08e0a-cf63-4a0a-b259-f0be018ace62';
