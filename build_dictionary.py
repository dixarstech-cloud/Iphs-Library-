"""Builds the OPTIONAL offline dictionary pack from Princeton WordNet (about 150,000 words with all their meanings).

Run this ONCE on a computer that has Python and internet:
    pip install nltk
    python build_dictionary.py

It writes dict-a.js ... dict-z.js, dict-0.js and dict-index.json next to index.html (about 20 MB in total).
Keep those files in the same folder as index.html (and upload them too if you host the app).
The app then looks words up offline first and only uses the internet for words that are missing.
Note: the pack only works when index.html is opened from a normal folder or a web address,
not when a phone opens the single file from Downloads.

WordNet 3.0 (c) Princeton University. Free to use under the WordNet licence:
https://wordnet.princeton.edu/license-and-commercial-use
"""
import json, os, re, sys

try:
    import nltk
    from nltk.corpus import wordnet as wn
except ImportError:
    sys.exit("nltk is not installed. Run:  pip install nltk")
try:
    wn.synsets("test")
except LookupError:
    print("Downloading WordNet ...")
    nltk.download("wordnet"); nltk.download("omw-1.4")

POS = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}
here = os.path.dirname(os.path.abspath(__file__))
shards, total = {}, 0
for name in sorted(set(wn.all_lemma_names())):
    word = name.replace("_", " ").lower()
    if not re.match(r"^[a-z][a-z'\- ]*$", word):
        continue
    rows = shards.setdefault(word[0], {}).setdefault(word, [])
    for lemma in wn.lemmas(name):
        s = lemma.synset()
        syn = []
        for l in s.lemma_names():
            l = l.replace("_", " ").lower()
            if l != word and l not in syn:
                syn.append(l)
        row = [POS[s.pos()], s.definition(), (s.examples() or [""])[0], syn[:4]]
        if row not in rows:
            rows.append(row)
    total += 1

files = []
for letter, words in sorted(shards.items()):
    fn = f"dict-{letter}.js"
    with open(os.path.join(here, fn), "w", encoding="utf-8") as f:
        f.write('(window.IPHS_DICT=window.IPHS_DICT||{})["%s"]=' % letter + json.dumps(words, ensure_ascii=False, separators=(",", ":")) + ";\n")
    files.append(fn)
with open(os.path.join(here, "dict-index.json"), "w") as f:
    json.dump(files, f)
print(f"Done: {total} words in {len(files)} files.")
