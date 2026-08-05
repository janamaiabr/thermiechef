import json, sys
d = json.load(open('recipes/data/banana-bread-bill-granger.json'))
for i, s in enumerate(d['steps']):
    print(f'{i}: {s[:120]}')