// lib/reco.ts
export type DocLike = {
    id: string
    text: string // gabungan name+desc+category
  }
  
  function tokenize(s: string) {
    return (s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9\s]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  }
  
  export function tfidfRank(
    docs: DocLike[],
    userQueryTokens: string[],           // token preferensi user
    topN = 6
  ) {
    const corpusTokens = docs.map(d => tokenize(d.text))
    const vocab = new Map<string, number>() // df
    corpusTokens.forEach(toks => {
      const uniq = new Set(toks)
      uniq.forEach(t => vocab.set(t, (vocab.get(t) || 0) + 1))
    })
    const N = docs.length || 1
  
    // User vector (TF * IDF untuk token preferensi)
    const uq = tokenize(userQueryTokens.join(' '))
    const uqCount: Record<string, number> = {}
    uq.forEach(t => (uqCount[t] = (uqCount[t] || 0) + 1))
  
    function idf(term: string) {
      const df = vocab.get(term) || 0.5
      return Math.log((N + 1) / df)
    }
  
    function cosine(docVec: Record<string, number>, queryVec: Record<string, number>) {
      let dot = 0, n1 = 0, n2 = 0
      for (const [k, v] of Object.entries(docVec)) {
        dot += v * (queryVec[k] || 0)
        n1 += v * v
      }
      for (const v of Object.values(queryVec)) n2 += v * v
      const denom = Math.sqrt(n1) * Math.sqrt(n2)
      return denom ? dot / denom : 0
    }
  
    // Build query vector
    const qvec: Record<string, number> = {}
    for (const [t, tf] of Object.entries(uqCount)) {
      qvec[t] = tf * idf(t)
    }
  
    const scored = docs.map((d, i) => {
      const tfc: Record<string, number> = {}
      for (const t of corpusTokens[i]) tfc[t] = (tfc[t] || 0) + 1
      const dvec: Record<string, number> = {}
      for (const [t, tf] of Object.entries(tfc)) dvec[t] = tf * idf(t)
      const score = cosine(dvec, qvec)
      return { id: d.id, score }
    })
  
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map(s => s.id)
  }
  